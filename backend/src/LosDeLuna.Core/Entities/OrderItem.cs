namespace LosDeLuna.Core.Entities;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int? ProductId { get; set; }
    public int? VariantId { get; set; }

    // Snapshots
    public string ProductName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string? Observations { get; set; }
    public int SortOrder { get; set; }

    // Navigation
    public Order Order { get; set; } = null!;
    public ICollection<OrderItemCustomization> Customizations { get; set; } = new List<OrderItemCustomization>();
}
