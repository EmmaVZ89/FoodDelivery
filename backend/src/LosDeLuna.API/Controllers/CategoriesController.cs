using LosDeLuna.API.DTOs.Categories;
using LosDeLuna.Infra.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers;

[ApiController]
[Route("api/categories")]
[EnableRateLimiting("general")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _db.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                SortOrder = c.SortOrder
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _db.Categories
            .Where(c => c.Id == id && c.IsActive)
            .Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                SortOrder = c.SortOrder
            })
            .FirstOrDefaultAsync();

        if (category == null)
            return NotFound(new { error = "Categoría no encontrada" });

        return Ok(category);
    }
}
