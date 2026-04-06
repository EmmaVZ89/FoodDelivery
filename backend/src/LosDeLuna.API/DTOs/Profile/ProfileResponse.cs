namespace LosDeLuna.API.DTOs.Profile;

public class ProfileResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? BetweenStreets { get; set; }
    public string? ApartmentInfo { get; set; }
    public string? DeliveryNotes { get; set; }
    public string Role { get; set; } = string.Empty;
}
