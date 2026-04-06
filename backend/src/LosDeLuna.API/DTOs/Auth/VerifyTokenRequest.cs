using System.ComponentModel.DataAnnotations;

namespace LosDeLuna.API.DTOs.Auth;

public class VerifyTokenRequest
{
    [Required(ErrorMessage = "El token es obligatorio")]
    public string Token { get; set; } = string.Empty;
}
