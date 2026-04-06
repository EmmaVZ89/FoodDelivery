namespace LosDeLuna.API.DTOs.Orders;

public class OrderResponse
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal? CashAmount { get; set; }
    public string DeliveryName { get; set; } = string.Empty;
    public string DeliveryPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string? DeliveryBetweenStreets { get; set; }
    public string? DeliveryApartment { get; set; }
    public string? DeliveryNotes { get; set; }
    public string? WhatsappMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemResponse> Items { get; set; } = new();
    public List<StatusHistoryResponse> StatusHistory { get; set; } = new();
}

public class OrderItemResponse
{
    public int Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string? Observations { get; set; }
    public List<OrderItemCustResponse> Customizations { get; set; } = new();
}

public class OrderItemCustResponse
{
    public string GroupName { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public int OptionQuantity { get; set; }
    public decimal PriceModifier { get; set; }
}

public class StatusHistoryResponse
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrderListResponse
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
}
