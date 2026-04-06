using System.Security.Claims;
using LosDeLuna.API.DTOs.Common;
using LosDeLuna.API.DTOs.Orders;
using LosDeLuna.Core.Enums;
using LosDeLuna.Core.Exceptions;
using LosDeLuna.Core.Interfaces;
using LosDeLuna.Infra.Data;
using LosDeLuna.Infra.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
[EnableRateLimiting("general")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly OrderService _orderService;
    private readonly IBusinessConfigService _configService;

    public OrdersController(AppDbContext db, OrderService orderService, IBusinessConfigService configService)
    {
        _db = db;
        _orderService = orderService;
        _configService = configService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();

        if (!Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var paymentMethod))
            throw new BusinessException("Método de pago inválido");

        var items = request.Items.Select(i => (
            i.ProductId,
            (int?)i.VariantId,
            i.Quantity,
            i.Observations,
            i.Customizations.Select(c => (c.GroupId, c.OptionId, c.OptionQuantity)).ToList()
        )).ToList();

        var order = await _orderService.CreateOrderAsync(
            userId, items,
            request.DeliveryName, request.DeliveryPhone, request.DeliveryAddress,
            request.DeliveryBetweenStreets, request.DeliveryApartment, request.DeliveryNotes,
            paymentMethod, request.CashAmount, request.DiscountCode
        );

        return Ok(MapOrderResponse(order));
    }

    [HttpGet]
    public async Task<IActionResult> GetMyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _db.Orders.Where(o => o.UserId == userId);
        var totalCount = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderListResponse
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                Status = o.Status.ToString(),
                Total = o.Total,
                CreatedAt = o.CreatedAt,
                ItemCount = o.Items.Count
            })
            .ToListAsync();

        return Ok(new PaginatedResponse<OrderListResponse>
        {
            Items = orders,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var userId = GetUserId();

        var order = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Customizations)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

        if (order == null)
            return NotFound(new { error = "Pedido no encontrado" });

        return Ok(MapOrderResponse(order));
    }

    [HttpPost("validate-code")]
    public async Task<IActionResult> ValidateCode([FromBody] ValidateCodeRequest request)
    {
        var code = await _db.DiscountCodes.FirstOrDefaultAsync(c =>
            c.Code == request.Code.ToUpperInvariant() && c.IsActive);

        if (code == null)
            return BadRequest(new { error = "Código inválido" });

        if (code.ValidUntil.HasValue && code.ValidUntil < DateTime.UtcNow)
            return BadRequest(new { error = "El código ha expirado" });

        if (code.MaxUses.HasValue && code.CurrentUses >= code.MaxUses)
            return BadRequest(new { error = "El código ya no está disponible" });

        return Ok(new
        {
            code.Code,
            code.DiscountPercent,
            code.FreeShipping
        });
    }

    [HttpGet("kitchen-capacity")]
    [AllowAnonymous]
    public async Task<IActionResult> GetKitchenCapacity()
    {
        return Ok(new { hasCapacity = await _configService.HasKitchenCapacityAsync() });
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : throw new BusinessException("Usuario no válido", 401);
    }

    private static OrderResponse MapOrderResponse(Core.Entities.Order order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            Status = order.Status.ToString(),
            Subtotal = order.Subtotal,
            ShippingCost = order.ShippingCost,
            DiscountAmount = order.DiscountAmount,
            Total = order.Total,
            PaymentMethod = order.PaymentMethod.ToString(),
            CashAmount = order.CashAmount,
            DeliveryName = order.DeliveryName,
            DeliveryPhone = order.DeliveryPhone,
            DeliveryAddress = order.DeliveryAddress,
            DeliveryBetweenStreets = order.DeliveryBetweenStreets,
            DeliveryApartment = order.DeliveryApartment,
            DeliveryNotes = order.DeliveryNotes,
            WhatsappMessage = order.WhatsappMessage,
            CreatedAt = order.CreatedAt,
            Items = order.Items.OrderBy(i => i.SortOrder).Select(i => new OrderItemResponse
            {
                Id = i.Id,
                ProductName = i.ProductName,
                VariantName = i.VariantName,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Subtotal = i.Subtotal,
                Observations = i.Observations,
                Customizations = i.Customizations.Select(c => new OrderItemCustResponse
                {
                    GroupName = c.GroupName,
                    OptionName = c.OptionName,
                    OptionQuantity = c.OptionQuantity,
                    PriceModifier = c.PriceModifier
                }).ToList()
            }).ToList(),
            StatusHistory = order.StatusHistory.OrderBy(h => h.CreatedAt).Select(h => new StatusHistoryResponse
            {
                Status = h.Status.ToString(),
                Notes = h.Notes,
                CreatedAt = h.CreatedAt
            }).ToList()
        };
    }
}

public class ValidateCodeRequest
{
    public string Code { get; set; } = string.Empty;
}
