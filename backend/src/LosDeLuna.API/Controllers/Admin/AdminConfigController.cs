using LosDeLuna.API.DTOs.Admin;
using LosDeLuna.Infra.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminConfigController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly TimeZoneInfo ArgTz =
        TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");

    public AdminConfigController(AppDbContext db) => _db = db;

    // Config
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var config = await _db.BusinessConfigs.FirstOrDefaultAsync();
        return Ok(config);
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpdateConfigRequest req)
    {
        var config = await _db.BusinessConfigs.FirstOrDefaultAsync();
        if (config == null) return NotFound();

        if (req.Name != null) config.Name = req.Name;
        if (req.Phone != null) config.Phone = req.Phone;
        if (req.Whatsapp != null) config.Whatsapp = req.Whatsapp;
        if (req.LogoUrl != null) config.LogoUrl = req.LogoUrl;
        if (req.FaviconUrl != null) config.FaviconUrl = req.FaviconUrl;
        if (req.InstagramUrl != null) config.InstagramUrl = req.InstagramUrl;
        if (req.Address != null) config.Address = req.Address;
        if (req.Latitude.HasValue) config.Latitude = req.Latitude;
        if (req.Longitude.HasValue) config.Longitude = req.Longitude;
        if (req.MaxConcurrentOrders.HasValue) config.MaxConcurrentOrders = req.MaxConcurrentOrders.Value;
        if (req.ShippingCost.HasValue) config.ShippingCost = req.ShippingCost.Value;
        if (req.EmailFrom != null) config.EmailFrom = req.EmailFrom;
        if (req.EmailFromName != null) config.EmailFromName = req.EmailFromName;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    // Schedules
    [HttpGet("schedules")]
    public async Task<IActionResult> GetSchedules()
    {
        var schedules = await _db.Schedules.OrderBy(s => s.SortOrder).ToListAsync();
        return Ok(schedules);
    }

    [HttpPut("schedules")]
    public async Task<IActionResult> UpdateSchedules([FromBody] UpdateSchedulesRequest req)
    {
        foreach (var item in req.Schedules)
        {
            var schedule = await _db.Schedules.FindAsync(item.Id);
            if (schedule == null) continue;
            schedule.IsOpen = item.IsOpen;
            if (item.OpenTime != null && TimeOnly.TryParse(item.OpenTime, out var open))
                schedule.OpenTime = open;
            if (item.CloseTime != null && TimeOnly.TryParse(item.CloseTime, out var close))
                schedule.CloseTime = close;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Horarios actualizados" });
    }

    // Discount Codes
    [HttpGet("discount-codes")]
    public async Task<IActionResult> GetDiscountCodes()
    {
        return Ok(await _db.DiscountCodes.OrderByDescending(d => d.CreatedAt).ToListAsync());
    }

    [HttpPost("discount-codes")]
    public async Task<IActionResult> CreateDiscountCode([FromBody] CreateDiscountCodeRequest req)
    {
        var code = new Core.Entities.DiscountCode
        {
            Code = req.Code.ToUpperInvariant(), DiscountPercent = req.DiscountPercent,
            FreeShipping = req.FreeShipping, IsActive = req.IsActive,
            ValidFrom = req.ValidFrom, ValidUntil = req.ValidUntil, MaxUses = req.MaxUses
        };
        _db.DiscountCodes.Add(code);
        await _db.SaveChangesAsync();
        return Ok(code);
    }

    [HttpPut("discount-codes/{id:int}")]
    public async Task<IActionResult> UpdateDiscountCode(int id, [FromBody] CreateDiscountCodeRequest req)
    {
        var code = await _db.DiscountCodes.FindAsync(id);
        if (code == null) return NotFound();
        code.Code = req.Code.ToUpperInvariant(); code.DiscountPercent = req.DiscountPercent;
        code.FreeShipping = req.FreeShipping; code.IsActive = req.IsActive;
        code.ValidFrom = req.ValidFrom; code.ValidUntil = req.ValidUntil; code.MaxUses = req.MaxUses;
        await _db.SaveChangesAsync();
        return Ok(code);
    }

    [HttpDelete("discount-codes/{id:int}")]
    public async Task<IActionResult> DeleteDiscountCode(int id)
    {
        var code = await _db.DiscountCodes.FindAsync(id);
        if (code == null) return NotFound();
        _db.DiscountCodes.Remove(code);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Código eliminado" });
    }

    // Alerts
    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlerts()
    {
        return Ok(await _db.Alerts.OrderByDescending(a => a.CreatedAt).ToListAsync());
    }

    [HttpPost("alerts")]
    public async Task<IActionResult> CreateAlert([FromBody] CreateAlertRequest req)
    {
        var alert = new Core.Entities.Alert
        {
            Message = req.Message, ValidFrom = req.ValidFrom,
            ValidUntil = req.ValidUntil, IsActive = req.IsActive
        };
        _db.Alerts.Add(alert);
        await _db.SaveChangesAsync();
        return Ok(alert);
    }

    [HttpPut("alerts/{id:int}")]
    public async Task<IActionResult> UpdateAlert(int id, [FromBody] CreateAlertRequest req)
    {
        var alert = await _db.Alerts.FindAsync(id);
        if (alert == null) return NotFound();
        alert.Message = req.Message; alert.ValidFrom = req.ValidFrom;
        alert.ValidUntil = req.ValidUntil; alert.IsActive = req.IsActive;
        await _db.SaveChangesAsync();
        return Ok(alert);
    }

    [HttpDelete("alerts/{id:int}")]
    public async Task<IActionResult> DeleteAlert(int id)
    {
        var alert = await _db.Alerts.FindAsync(id);
        if (alert == null) return NotFound();
        _db.Alerts.Remove(alert);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Alerta eliminada" });
    }

    // Upload image
    [HttpPost("upload")]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2MB
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No se envió archivo" });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Tipo de archivo no permitido. Usá JPG, PNG o WebP." });

        var storagePath = Environment.GetEnvironmentVariable("STORAGE_PATH") ?? "./storage";
        Directory.CreateDirectory(storagePath);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(storagePath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var url = $"/uploads/{fileName}";
        return Ok(new { url });
    }

    // Delete image
    [HttpDelete("upload")]
    public IActionResult DeleteImage([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return BadRequest();
        var storagePath = Environment.GetEnvironmentVariable("STORAGE_PATH") ?? "./storage";
        var fileName = Path.GetFileName(url);
        var filePath = Path.Combine(storagePath, fileName);
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);
        return Ok(new { message = "Imagen eliminada" });
    }

    // Dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ArgTz);
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
        var todayStartUtc = TimeZoneInfo.ConvertTimeToUtc(todayStart, ArgTz);

        var config = await _db.BusinessConfigs.FirstOrDefaultAsync();

        return Ok(new DashboardResponse
        {
            PendingOrders = await _db.Orders.CountAsync(o => o.Status == Core.Enums.OrderStatus.Pending),
            PreparingOrders = await _db.Orders.CountAsync(o => o.Status == Core.Enums.OrderStatus.Preparing),
            OnTheWayOrders = await _db.Orders.CountAsync(o => o.Status == Core.Enums.OrderStatus.OnTheWay),
            DeliveredToday = await _db.Orders.CountAsync(o => o.Status == Core.Enums.OrderStatus.Delivered && o.DeliveredAt >= todayStartUtc),
            CancelledToday = await _db.Orders.CountAsync(o => o.Status == Core.Enums.OrderStatus.Cancelled && o.CancelledAt >= todayStartUtc),
            TodayRevenue = await _db.Orders.Where(o => o.Status == Core.Enums.OrderStatus.Delivered && o.DeliveredAt >= todayStartUtc).SumAsync(o => o.Total),
            ActiveOrdersCount = await _db.Orders.CountAsync(o => o.Status == Core.Enums.OrderStatus.Pending || o.Status == Core.Enums.OrderStatus.Preparing),
            MaxConcurrentOrders = config?.MaxConcurrentOrders ?? 0
        });
    }
}
