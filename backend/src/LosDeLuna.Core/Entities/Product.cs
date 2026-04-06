namespace LosDeLuna.Core.Entities;

public class Product : BaseEntity
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsAvailable { get; set; } = true;
    public bool IsPromotion { get; set; } = false;
    public decimal DiscountPercent { get; set; } = 0;
    public bool HasVariants { get; set; } = false;
    public int SortOrder { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<CustomizationGroup> CustomizationGroups { get; set; } = new List<CustomizationGroup>();
}
