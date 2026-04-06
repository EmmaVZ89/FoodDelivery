namespace LosDeLuna.Core.Entities;

public class DiscountCode
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountPercent { get; set; }
    public bool FreeShipping { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public int? MaxUses { get; set; }
    public int CurrentUses { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
