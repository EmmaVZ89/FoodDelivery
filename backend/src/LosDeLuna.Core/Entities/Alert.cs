namespace LosDeLuna.Core.Entities;

public class Alert
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
