using LosDeLuna.API.DTOs.Alerts;
using LosDeLuna.Infra.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers;

[ApiController]
[Route("api/alerts")]
[EnableRateLimiting("general")]
public class AlertsController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly TimeZoneInfo ArgentinaTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");

    public AlertsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var now = DateTime.UtcNow;

        var alerts = await _db.Alerts
            .Where(a => a.IsActive && a.ValidFrom <= now && a.ValidUntil >= now)
            .Select(a => new AlertResponse
            {
                Id = a.Id,
                Message = a.Message,
                ValidFrom = a.ValidFrom,
                ValidUntil = a.ValidUntil
            })
            .ToListAsync();

        return Ok(alerts);
    }
}
