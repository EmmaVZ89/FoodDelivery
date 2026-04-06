namespace LosDeLuna.API.DTOs.Products;

public class ProductListResponse
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
    public int SortOrder { get; set; }
    public decimal? MinVariantPrice { get; set; }
}
