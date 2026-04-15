using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using LosDeLuna.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace LosDeLuna.Infra.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string _apiKey;
    private readonly string _defaultFromEmail;
    private readonly string _defaultFromName;
    private static readonly HttpClient _httpClient = new();

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
        _apiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? "";
        _defaultFromEmail = Environment.GetEnvironmentVariable("EMAIL_FROM") ?? "noreply@example.com";
        _defaultFromName = Environment.GetEnvironmentVariable("EMAIL_FROM_NAME") ?? "";
    }

    public async Task SendMagicLinkAsync(string toEmail, string magicLinkUrl, string businessName = "", string? senderEmail = null, string? senderName = null)
    {
        // Priority: BD config > .env > defaults
        var fromEmail = !string.IsNullOrWhiteSpace(senderEmail) ? senderEmail : _defaultFromEmail;
        var fromName = !string.IsNullOrWhiteSpace(senderName) ? senderName
            : !string.IsNullOrWhiteSpace(businessName) ? businessName
            : !string.IsNullOrWhiteSpace(_defaultFromName) ? _defaultFromName
            : "Tu negocio";

        if (string.IsNullOrEmpty(_apiKey) || _apiKey.Contains("placeholder"))
        {
            _logger.LogWarning("=== MAGIC LINK (dev mode) ===");
            _logger.LogWarning("To: {Email}", toEmail);
            _logger.LogWarning("From: {Name} <{FromEmail}>", fromName, fromEmail);
            _logger.LogWarning("URL: {Url}", magicLinkUrl);
            _logger.LogWarning("=============================");
            return;
        }

        var payload = new
        {
            sender = new { name = fromName, email = fromEmail },
            to = new[] { new { email = toEmail } },
            subject = $"Tu enlace de acceso - {fromName}",
            htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #1A2E12;'>¡Hola!</h2>
                    <p>Hacé clic en el siguiente botón para acceder a tu cuenta:</p>
                    <a href='{magicLinkUrl}'
                       style='display: inline-block; background-color: #4A7C2E; color: #ffffff;
                              padding: 14px 28px; text-decoration: none; border-radius: 8px;
                              font-size: 16px; font-weight: bold; margin: 20px 0;'>
                        Ingresar a {fromName}
                    </a>
                    <p style='color: #5F7456; font-size: 13px;'>
                        Este enlace expira en 15 minutos.<br>
                        Si no solicitaste este acceso, ignorá este email.
                    </p>
                </div>"
        };

        var json = JsonSerializer.Serialize(payload);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Add("api-key", _apiKey);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to send email via Brevo: {Error}", error);
            throw new Exception("No se pudo enviar el email");
        }
    }
}
