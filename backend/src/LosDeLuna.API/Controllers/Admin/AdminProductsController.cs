using LosDeLuna.API.DTOs.Admin;
using LosDeLuna.Core.Entities;
using LosDeLuna.Core.Enums;
using LosDeLuna.Infra.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers.Admin;

[ApiController]
[Route("api/admin/products")]
[Authorize(Policy = "AdminOnly")]
public class AdminProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminProductsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? categoryId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var query = _db.Products.Include(p => p.Category).AsQueryable();
        if (categoryId.HasValue) query = query.Where(p => p.CategoryId == categoryId.Value);

        var total = await query.CountAsync();
        var products = await query.OrderBy(p => p.SortOrder)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new
            {
                p.Id, p.CategoryId, CategoryName = p.Category.Name,
                p.Name, p.Description, p.Price, p.ImageUrl,
                p.IsActive, p.IsAvailable, p.IsPromotion, p.DiscountPercent,
                p.HasVariants, p.SortOrder
            })
            .ToListAsync();

        return Ok(new { items = products, totalCount = total, page, pageSize });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Products
            .Include(x => x.Variants.OrderBy(v => v.SortOrder))
            .Include(x => x.CustomizationGroups.OrderBy(g => g.SortOrder))
                .ThenInclude(g => g.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p == null) return NotFound();
        return Ok(p);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest req)
    {
        var maxOrder = await _db.Products.Where(x => x.CategoryId == req.CategoryId)
            .MaxAsync(x => (int?)x.SortOrder) ?? 0;

        var product = new Product
        {
            CategoryId = req.CategoryId, Name = req.Name, Description = req.Description,
            Price = req.Price, ImageUrl = req.ImageUrl, IsActive = req.IsActive,
            IsAvailable = req.IsAvailable, IsPromotion = req.IsPromotion,
            DiscountPercent = req.DiscountPercent, HasVariants = req.HasVariants,
            SortOrder = maxOrder + 1
        };

        // Variants
        int vOrder = 0;
        foreach (var v in req.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                Name = v.Name, Price = v.Price, SelectionCount = v.SelectionCount,
                IsActive = v.IsActive, SortOrder = vOrder++
            });
        }

        // Customization Groups
        int gOrder = 0;
        foreach (var g in req.CustomizationGroups)
        {
            var group = new CustomizationGroup
            {
                Name = g.Name,
                SelectionType = Enum.Parse<SelectionType>(g.SelectionType, true),
                MinSelections = g.MinSelections, MaxSelections = g.MaxSelections,
                IsRequired = g.IsRequired, SortOrder = gOrder++
            };
            int oOrder = 0;
            foreach (var o in g.Options)
            {
                group.Options.Add(new CustomizationOption
                {
                    Name = o.Name, PriceModifier = o.PriceModifier,
                    IsActive = o.IsActive, SortOrder = oOrder++
                });
            }
            product.CustomizationGroups.Add(group);
        }

        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return Ok(new { product.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateProductRequest req)
    {
        var product = await _db.Products
            .Include(p => p.Variants)
            .Include(p => p.CustomizationGroups).ThenInclude(g => g.Options)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound();

        product.CategoryId = req.CategoryId; product.Name = req.Name;
        product.Description = req.Description; product.Price = req.Price;
        product.ImageUrl = req.ImageUrl; product.IsActive = req.IsActive;
        product.IsAvailable = req.IsAvailable; product.IsPromotion = req.IsPromotion;
        product.DiscountPercent = req.DiscountPercent; product.HasVariants = req.HasVariants;
        product.UpdatedAt = DateTime.UtcNow;

        // Sync variants
        _db.ProductVariants.RemoveRange(product.Variants);
        int vOrder = 0;
        foreach (var v in req.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                Name = v.Name, Price = v.Price, SelectionCount = v.SelectionCount,
                IsActive = v.IsActive, SortOrder = vOrder++
            });
        }

        // Sync customization groups
        _db.CustomizationOptions.RemoveRange(product.CustomizationGroups.SelectMany(g => g.Options));
        _db.CustomizationGroups.RemoveRange(product.CustomizationGroups);
        int gOrder = 0;
        foreach (var g in req.CustomizationGroups)
        {
            var group = new CustomizationGroup
            {
                Name = g.Name,
                SelectionType = Enum.Parse<SelectionType>(g.SelectionType, true),
                MinSelections = g.MinSelections, MaxSelections = g.MaxSelections,
                IsRequired = g.IsRequired, SortOrder = gOrder++
            };
            int oOrder = 0;
            foreach (var o in g.Options)
            {
                group.Options.Add(new CustomizationOption
                {
                    Name = o.Name, PriceModifier = o.PriceModifier,
                    IsActive = o.IsActive, SortOrder = oOrder++
                });
            }
            product.CustomizationGroups.Add(group);
        }

        await _db.SaveChangesAsync();
        return Ok(new { product.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Producto eliminado" });
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] ReorderRequest req)
    {
        foreach (var item in req.Items)
        {
            var p = await _db.Products.FindAsync(item.Id);
            if (p != null) p.SortOrder = item.SortOrder;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Orden actualizado" });
    }
}
