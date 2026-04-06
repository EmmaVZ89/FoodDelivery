using System.ComponentModel.DataAnnotations;

namespace LosDeLuna.API.DTOs.Auth;

public class MagicLinkRequest
{
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
}
