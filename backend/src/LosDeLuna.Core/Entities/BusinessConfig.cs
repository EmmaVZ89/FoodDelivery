namespace LosDeLuna.Core.Entities;

public class BusinessConfig : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Whatsapp { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? Address { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int MaxConcurrentOrders { get; set; } = 0;
    public decimal ShippingCost { get; set; } = 0;
}
