using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LosDeLuna.Core.Entities;
using LosDeLuna.Core.Enums;
using LosDeLuna.Core.Exceptions;
using LosDeLuna.Core.Interfaces;
using LosDeLuna.Infra.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace LosDeLuna.Infra.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;

    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _jwtExpiryMinutes;
    private readonly int _refreshTokenExpiryDays;
    private readonly string _frontendUrl;

    public AuthService(AppDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
        _jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")!;
        _jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "lodeluna-api";
        _jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "lodeluna-app";
        _jwtExpiryMinutes = int.TryParse(Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES"), out var m) ? m : 15;
        _refreshTokenExpiryDays = int.TryParse(Environment.GetEnvironmentVariable("REFRESH_TOKEN_EXPIRY_DAYS"), out var d) ? d : 7;
        _frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:4200";
    }

    public async Task<string> GenerateMagicLinkAsync(string email)
    {
        email = email.ToLowerInvariant().Trim();

        // Invalidate previous unused magic links for this email
        var oldLinks = await _db.MagicLinks
            .Where(ml => ml.Email == email && ml.UsedAt == null && ml.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
        foreach (var old in oldLinks)
            old.UsedAt = DateTime.UtcNow; // Mark as used

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        var token = GenerateSecureToken();
        var magicLink = new MagicLink
        {
            Email = email,
            UserId = user?.Id,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };

        _db.MagicLinks.Add(magicLink);
        await _db.SaveChangesAsync();

        var url = $"{_frontendUrl}/auth/verify?token={token}";
        var config = await _db.BusinessConfigs.FirstOrDefaultAsync();
        await _emailService.SendMagicLinkAsync(email, url, config?.Name ?? "", config?.EmailFrom, config?.EmailFromName);

        return "Se envió un enlace de acceso a tu email";
    }

    public async Task<(string AccessToken, string RefreshToken, Guid UserId)> VerifyMagicLinkAsync(string token)
    {
        var magicLink = await _db.MagicLinks
            .FirstOrDefaultAsync(ml => ml.Token == token);

        if (magicLink == null)
            throw new BusinessException("Enlace inválido", 400);

        if (magicLink.UsedAt != null)
            throw new BusinessException("Este enlace ya fue utilizado", 400);

        if (magicLink.ExpiresAt < DateTime.UtcNow)
            throw new BusinessException("El enlace ha expirado. Solicitá uno nuevo.", 400);

        magicLink.UsedAt = DateTime.UtcNow;

        // Find or create user
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == magicLink.Email);
        if (user == null)
        {
            user = new User
            {
                Email = magicLink.Email,
                Role = UserRole.Customer
            };
            _db.Users.Add(user);
        }

        magicLink.UserId = user.Id;

        // Generate tokens
        var accessToken = GenerateJwt(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        await _db.SaveChangesAsync();

        return (accessToken, refreshToken, user.Id);
    }

    public async Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (stored == null || stored.RevokedAt != null || stored.ExpiresAt < DateTime.UtcNow)
            throw new BusinessException("Token inválido o expirado", 401);

        if (!stored.User.IsActive)
            throw new BusinessException("Usuario desactivado", 403);

        // Revoke old refresh token
        stored.RevokedAt = DateTime.UtcNow;

        // Generate new tokens
        var newAccessToken = GenerateJwt(stored.User);
        var newRefreshToken = await CreateRefreshTokenAsync(stored.UserId);

        await _db.SaveChangesAsync();

        return (newAccessToken, newRefreshToken);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.RevokedAt == null);

        if (stored != null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    private string GenerateJwt(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.Name, user.Name ?? user.Email)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> CreateRefreshTokenAsync(Guid userId)
    {
        var token = GenerateSecureToken();
        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays)
        };
        _db.RefreshTokens.Add(refreshToken);
        return token;
    }

    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
