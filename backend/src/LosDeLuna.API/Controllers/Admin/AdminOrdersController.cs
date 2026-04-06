using System.Security.Claims;
using LosDeLuna.API.DTOs.Admin;
using LosDeLuna.API.DTOs.Orders;
using LosDeLuna.Core.Entities;
using LosDeLuna.Core.Enums;
using LosDeLuna.Core.Exceptions;
using LosDeLuna.Infra.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers.Admin;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Policy = "AdminOnly")]
public class AdminOrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly TimeZoneInfo ArgTz =
        TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");

    public AdminOrdersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.Orders.Include(o => o.User).AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var s))
            query = query.Where(o => o.Status == s);

        if (from.HasValue) query = query.Where(o => o.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(o => o.CreatedAt <= to.Value.AddDays(1));

        var total = await query.CountAsync();
        var orders = await query.OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new
            {
                o.Id, o.OrderCode, Status = o.Status.ToString(),
                o.Total, o.CreatedAt, o.DeliveryName, o.DeliveryPhone,
                UserEmail = o.User != null ? o.User.Email : null,
                ItemCount = o.Items.Count,
                PaymentMethod = o.PaymentMethod.ToString()
            })
            .ToListAsync();

        return Ok(new { items = orders, totalCount = total, page, pageSize });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Customizations)
            .Include(o => o.StatusHistory)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();

        return Ok(new
        {
            order.Id,
            order.OrderCode,
            Status = order.Status.ToString(),
            order.Subtotal,
            order.ShippingCost,
            order.DiscountAmount,
            order.Total,
            PaymentMethod = order.PaymentMethod.ToString(),
            order.CashAmount,
            order.DeliveryName,
            order.DeliveryPhone,
            order.DeliveryAddress,
            order.DeliveryBetweenStreets,
            order.DeliveryApartment,
            order.DeliveryNotes,
            order.WhatsappMessage,
            order.CreatedAt,
            UserEmail = order.User?.Email,
            UserName = order.User?.Name,
            Items = order.Items.OrderBy(i => i.SortOrder).Select(i => new
            {
                i.Id,
                i.ProductName,
                i.VariantName,
                i.Quantity,
                i.UnitPrice,
                i.Subtotal,
                i.Observations,
                Customizations = i.Customizations.Select(c => new
                {
                    c.GroupName,
                    c.OptionName,
                    c.OptionQuantity,
                    c.PriceModifier
                })
            }),
            StatusHistory = order.StatusHistory.OrderBy(h => h.CreatedAt).Select(h => new
            {
                Status = h.Status.ToString(),
                h.Notes,
                h.CreatedAt
            })
        });
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest req)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        if (!Enum.TryParse<OrderStatus>(req.Status, true, out var newStatus))
            throw new BusinessException("Estado inválido");

        // Validate transitions
        var validTransitions = new Dictionary<OrderStatus, OrderStatus[]>
        {
            [OrderStatus.Pending] = new[] { OrderStatus.Preparing, OrderStatus.Cancelled },
            [OrderStatus.Preparing] = new[] { OrderStatus.OnTheWay, OrderStatus.Cancelled },
            [OrderStatus.OnTheWay] = new[] { OrderStatus.Delivered, OrderStatus.Cancelled },
        };

        if (!validTransitions.ContainsKey(order.Status) ||
            !validTransitions[order.Status].Contains(newStatus))
            throw new BusinessException($"No se puede cambiar de '{order.Status}' a '{newStatus}'");

        var userId = Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : (Guid?)null;

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        switch (newStatus)
        {
            case OrderStatus.Preparing: order.ConfirmedAt = DateTime.UtcNow; break;
            case OrderStatus.OnTheWay: order.ShippedAt = DateTime.UtcNow; break;
            case OrderStatus.Delivered: order.DeliveredAt = DateTime.UtcNow; break;
            case OrderStatus.Cancelled: order.CancelledAt = DateTime.UtcNow; break;
        }

        _db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = id, Status = newStatus, ChangedBy = userId, Notes = req.Notes
        });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Estado actualizado", status = newStatus.ToString() });
    }
}
