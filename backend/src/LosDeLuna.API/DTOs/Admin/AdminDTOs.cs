using System.ComponentModel.DataAnnotations;

namespace LosDeLuna.API.DTOs.Admin;

// Categories
public class CreateCategoryRequest
{
    [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

// Products
public class CreateProductRequest
{
    [Required] public int CategoryId { get; set; }
    [Required, MaxLength(150)] public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsAvailable { get; set; } = true;
    public bool IsPromotion { get; set; }
    [Range(0, 100)] public decimal DiscountPercent { get; set; }
    public bool HasVariants { get; set; }
    public List<VariantRequest> Variants { get; set; } = new();
    public List<CustomizationGroupRequest> CustomizationGroups { get; set; } = new();
}

public class VariantRequest
{
    public int? Id { get; set; }
    [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SelectionCount { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CustomizationGroupRequest
{
    public int? Id { get; set; }
    [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    [Required] public string SelectionType { get; set; } = "Single";
    public int MinSelections { get; set; }
    public int? MaxSelections { get; set; }
    public bool IsRequired { get; set; }
    public List<CustomizationOptionRequest> Options { get; set; } = new();
}

public class CustomizationOptionRequest
{
    public int? Id { get; set; }
    [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    public decimal PriceModifier { get; set; }
    public bool IsActive { get; set; } = true;
}

// Reorder
public class ReorderRequest
{
    public List<ReorderItem> Items { get; set; } = new();
}

public class ReorderItem
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
}

// Schedules
public class UpdateSchedulesRequest
{
    public List<ScheduleItem> Schedules { get; set; } = new();
}

public class ScheduleItem
{
    public int Id { get; set; }
    public bool IsOpen { get; set; }
    public string? OpenTime { get; set; }  // "HH:mm"
    public string? CloseTime { get; set; } // "HH:mm"
}

// Business Config
public class UpdateConfigRequest
{
    [MaxLength(100)] public string? Name { get; set; }
    [MaxLength(20)] public string? Phone { get; set; }
    [MaxLength(20)] public string? Whatsapp { get; set; }
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? Address { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? MaxConcurrentOrders { get; set; }
    public decimal? ShippingCost { get; set; }
    [MaxLength(255)] public string? EmailFrom { get; set; }
    [MaxLength(100)] public string? EmailFromName { get; set; }
}

// Discount Codes
public class CreateDiscountCodeRequest
{
    [Required, MaxLength(50)] public string Code { get; set; } = string.Empty;
    [Range(0, 50)] public decimal DiscountPercent { get; set; }
    public bool FreeShipping { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public int? MaxUses { get; set; }
}

// Alerts
public class CreateAlertRequest
{
    [Required] public string Message { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public bool IsActive { get; set; } = true;
}

// Order Status
public class UpdateOrderStatusRequest
{
    [Required] public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

// Dashboard
public class DashboardResponse
{
    public int PendingOrders { get; set; }
    public int PreparingOrders { get; set; }
    public int OnTheWayOrders { get; set; }
    public int DeliveredToday { get; set; }
    public int CancelledToday { get; set; }
    public decimal TodayRevenue { get; set; }
    public int ActiveOrdersCount { get; set; }
    public int MaxConcurrentOrders { get; set; }
}
