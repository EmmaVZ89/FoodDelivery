namespace LosDeLuna.API.DTOs.Products;

public class ProductDetailResponse
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsPromotion { get; set; }
    public decimal DiscountPercent { get; set; }
    public bool HasVariants { get; set; }
    public List<VariantResponse> Variants { get; set; } = new();
    public List<CustomizationGroupResponse> CustomizationGroups { get; set; } = new();
}

public class VariantResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SelectionCount { get; set; }
    public int SortOrder { get; set; }
}

public class CustomizationGroupResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SelectionType { get; set; } = string.Empty;
    public int MinSelections { get; set; }
    public int? MaxSelections { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public List<CustomizationOptionResponse> Options { get; set; } = new();
}

public class CustomizationOptionResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal PriceModifier { get; set; }
    public int SortOrder { get; set; }
}
