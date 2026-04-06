namespace LosDeLuna.Core.Interfaces;

public interface IEmailService
{
    Task SendMagicLinkAsync(string toEmail, string magicLinkUrl, string businessName = "");
}
