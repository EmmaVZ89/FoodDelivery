using LosDeLuna.API.DTOs.Admin;
using LosDeLuna.API.DTOs.Categories;
using LosDeLuna.Infra.Data;
using LosDeLuna.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers.Admin;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Policy = "AdminOnly")]
public class AdminCategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminCategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cats = await _db.Categories.OrderBy(c => c.SortOrder).ToListAsync();
        return Ok(cats.Select(c => new
        {
            c.Id, c.Name, c.Description, c.ImageUrl, c.IsActive, c.SortOrder
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest req)
    {
        var maxOrder = await _db.Categories.MaxAsync(c => (int?)c.SortOrder) ?? 0;
        var cat = new Category
        {
            Name = req.Name, Description = req.Description,
            ImageUrl = req.ImageUrl, IsActive = req.IsActive, SortOrder = maxOrder + 1
        };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(new { cat.Id, cat.Name, cat.Description, cat.ImageUrl, cat.IsActive, cat.SortOrder });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateCategoryRequest req)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        cat.Name = req.Name; cat.Description = req.Description;
        cat.ImageUrl = req.ImageUrl; cat.IsActive = req.IsActive;
        cat.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { cat.Id, cat.Name, cat.Description, cat.ImageUrl, cat.IsActive, cat.SortOrder });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts) return BadRequest(new { error = "La categoría tiene productos. Eliminá los productos primero." });
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Categoría eliminada" });
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] ReorderRequest req)
    {
        foreach (var item in req.Items)
        {
            var cat = await _db.Categories.FindAsync(item.Id);
            if (cat != null) cat.SortOrder = item.SortOrder;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Orden actualizado" });
    }
}
