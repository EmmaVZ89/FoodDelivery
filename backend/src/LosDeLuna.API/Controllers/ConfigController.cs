using LosDeLuna.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LosDeLuna.API.Controllers;

[ApiController]
[Route("api/config")]
[EnableRateLimiting("general")]
public class ConfigController : ControllerBase
{
    private readonly IBusinessConfigService _configService;

    public ConfigController(IBusinessConfigService configService)
    {
        _configService = configService;
    }

    [HttpGet]
    public async Task<IActionResult> GetConfig()
    {
        var config = await _configService.GetConfigAsync();
        return Ok(new
        {
            config.Name,
            config.Phone,
            config.Whatsapp,
            config.LogoUrl,
            config.FaviconUrl,
            config.InstagramUrl,
            config.Address,
            config.Latitude,
            config.Longitude,
            config.ShippingCost,
            IsOpen = await _configService.IsBusinessOpenAsync(),
            HasCapacity = await _configService.HasKitchenCapacityAsync()
        });
    }
}
