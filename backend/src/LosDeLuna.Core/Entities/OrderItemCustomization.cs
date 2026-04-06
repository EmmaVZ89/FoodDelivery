namespace LosDeLuna.Core.Entities;

public class OrderItemCustomization
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public int OptionQuantity { get; set; } = 1;
    public decimal PriceModifier { get; set; } = 0;

    public OrderItem OrderItem { get; set; } = null!;
}
