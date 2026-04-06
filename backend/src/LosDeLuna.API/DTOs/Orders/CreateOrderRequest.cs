using System.ComponentModel.DataAnnotations;

namespace LosDeLuna.API.DTOs.Orders;

public class CreateOrderRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "El pedido debe tener al menos un producto")]
    public List<OrderItemRequest> Items { get; set; } = new();

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100)]
    public string DeliveryName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio")]
    [MaxLength(20)]
    public string DeliveryPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "La dirección es obligatoria")]
    public string DeliveryAddress { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? DeliveryBetweenStreets { get; set; }

    [MaxLength(100)]
    public string? DeliveryApartment { get; set; }

    public string? DeliveryNotes { get; set; }

    [Required(ErrorMessage = "El método de pago es obligatorio")]
    public string PaymentMethod { get; set; } = string.Empty; // "Cash" or "Transfer"

    public decimal? CashAmount { get; set; }

    public string? DiscountCode { get; set; }
}

public class OrderItemRequest
{
    [Required]
    public int ProductId { get; set; }

    public int? VariantId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; } = 1;

    public List<OrderItemCustomizationRequest> Customizations { get; set; } = new();

    [MaxLength(500)]
    public string? Observations { get; set; }
}

public class OrderItemCustomizationRequest
{
    public int GroupId { get; set; }
    public int OptionId { get; set; }

    [Range(1, 100)]
    public int OptionQuantity { get; set; } = 1;
}
