using LosDeLuna.Core.Enums;

namespace LosDeLuna.Core.Entities;

public class OrderStatusHistory
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public Guid? ChangedBy { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
}
