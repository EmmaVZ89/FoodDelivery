using LosDeLuna.Core.Enums;

namespace LosDeLuna.Core.Entities;

public class Order
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    // Montos
    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }

    // Pago
    public int? DiscountCodeId { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal? CashAmount { get; set; }

    // Entrega (snapshot)
    public string DeliveryName { get; set; } = string.Empty;
    public string DeliveryPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string? DeliveryBetweenStreets { get; set; }
    public string? DeliveryApartment { get; set; }
    public string? DeliveryNotes { get; set; }

    // WhatsApp
    public string? WhatsappMessage { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public DiscountCode? DiscountCode { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
}
