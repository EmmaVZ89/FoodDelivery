namespace LosDeLuna.Core.Entities;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SelectionCount { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public Product Product { get; set; } = null!;
}
