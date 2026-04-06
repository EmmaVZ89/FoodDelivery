using LosDeLuna.API.DTOs.Auth;
using LosDeLuna.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LosDeLuna.API.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("magic-link")]
    public async Task<IActionResult> SendMagicLink([FromBody] MagicLinkRequest request)
    {
        var message = await _authService.GenerateMagicLinkAsync(request.Email);
        return Ok(new { message });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyToken([FromBody] VerifyTokenRequest request)
    {
        var (accessToken, refreshToken, userId) = await _authService.VerifyMagicLinkAsync(request.Token);
        return Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserId = userId
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var (accessToken, refreshToken) = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(new { accessToken, refreshToken });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        await _authService.RevokeRefreshTokenAsync(request.RefreshToken);
        return Ok(new { message = "Sesión cerrada" });
    }
}
