namespace LosDeLuna.API.DTOs.Alerts;

public class AlertResponse
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
}
