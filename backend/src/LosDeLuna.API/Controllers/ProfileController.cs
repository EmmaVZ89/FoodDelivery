using System.Security.Claims;
using LosDeLuna.API.DTOs.Profile;
using LosDeLuna.Core.Exceptions;
using LosDeLuna.Infra.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
[EnableRateLimiting("general")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return NotFound(new { error = "Usuario no encontrado" });

        return Ok(new ProfileResponse
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Phone = user.Phone,
            Address = user.Address,
            BetweenStreets = user.BetweenStreets,
            ApartmentInfo = user.ApartmentInfo,
            DeliveryNotes = user.DeliveryNotes,
            Role = user.Role.ToString()
        });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return NotFound(new { error = "Usuario no encontrado" });

        if (request.Name != null) user.Name = request.Name;
        if (request.Phone != null) user.Phone = request.Phone;
        if (request.Address != null) user.Address = request.Address;
        if (request.BetweenStreets != null) user.BetweenStreets = request.BetweenStreets;
        if (request.ApartmentInfo != null) user.ApartmentInfo = request.ApartmentInfo;
        if (request.DeliveryNotes != null) user.DeliveryNotes = request.DeliveryNotes;

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new ProfileResponse
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Phone = user.Phone,
            Address = user.Address,
            BetweenStreets = user.BetweenStreets,
            ApartmentInfo = user.ApartmentInfo,
            DeliveryNotes = user.DeliveryNotes,
            Role = user.Role.ToString()
        });
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : throw new BusinessException("Usuario no válido", 401);
    }
}
