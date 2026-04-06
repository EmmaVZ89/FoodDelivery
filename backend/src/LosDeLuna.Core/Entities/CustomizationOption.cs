namespace LosDeLuna.Core.Entities;

public class CustomizationOption
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal PriceModifier { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public CustomizationGroup Group { get; set; } = null!;
}
