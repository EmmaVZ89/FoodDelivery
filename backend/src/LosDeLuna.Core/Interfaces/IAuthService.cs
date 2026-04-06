namespace LosDeLuna.Core.Interfaces;

public interface IAuthService
{
    Task<string> GenerateMagicLinkAsync(string email);
    Task<(string AccessToken, string RefreshToken, Guid UserId)> VerifyMagicLinkAsync(string token);
    Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
}
