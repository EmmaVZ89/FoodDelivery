using System.ComponentModel.DataAnnotations;

namespace LosDeLuna.API.DTOs.Profile;

public class UpdateProfileRequest
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    public string? Address { get; set; }

    [MaxLength(255)]
    public string? BetweenStreets { get; set; }

    [MaxLength(100)]
    public string? ApartmentInfo { get; set; }

    public string? DeliveryNotes { get; set; }
}
