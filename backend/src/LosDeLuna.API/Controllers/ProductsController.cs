using LosDeLuna.API.DTOs.Common;
using LosDeLuna.API.DTOs.Products;
using LosDeLuna.Infra.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.API.Controllers;

[ApiController]
[Route("api/products")]
[EnableRateLimiting("general")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(1, page);

        var query = _db.Products
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Where(p => p.IsActive);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        var totalCount = await query.CountAsync();

        var products = await query
            .OrderBy(p => p.SortOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductListResponse
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsAvailable = p.IsAvailable,
                IsPromotion = p.IsPromotion,
                DiscountPercent = p.DiscountPercent,
                HasVariants = p.HasVariants,
                SortOrder = p.SortOrder,
                MinVariantPrice = p.HasVariants
                    ? p.Variants.Where(v => v.IsActive).Min(v => (decimal?)v.Price)
                    : null
            })
            .ToListAsync();

        return Ok(new PaginatedResponse<ProductListResponse>
        {
            Items = products,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("promotions")]
    public async Task<IActionResult> GetPromotions()
    {
        var promos = await _db.Products
            .Where(p => p.IsActive && p.IsPromotion)
            .OrderBy(p => p.SortOrder)
            .Take(10)
            .Select(p => new ProductListResponse
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsAvailable = p.IsAvailable,
                IsPromotion = p.IsPromotion,
                DiscountPercent = p.DiscountPercent,
                HasVariants = p.HasVariants,
                SortOrder = p.SortOrder
            })
            .ToListAsync();

        return Ok(promos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _db.Products
            .Where(p => p.Id == id && p.IsActive)
            .Select(p => new ProductDetailResponse
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsAvailable = p.IsAvailable,
                IsPromotion = p.IsPromotion,
                DiscountPercent = p.DiscountPercent,
                HasVariants = p.HasVariants,
                Variants = p.Variants
                    .Where(v => v.IsActive)
                    .OrderBy(v => v.SortOrder)
                    .Select(v => new VariantResponse
                    {
                        Id = v.Id,
                        Name = v.Name,
                        Price = v.Price,
                        SelectionCount = v.SelectionCount,
                        SortOrder = v.SortOrder
                    })
                    .ToList(),
                CustomizationGroups = p.CustomizationGroups
                    .OrderBy(g => g.SortOrder)
                    .Select(g => new CustomizationGroupResponse
                    {
                        Id = g.Id,
                        Name = g.Name,
                        SelectionType = g.SelectionType.ToString(),
                        MinSelections = g.MinSelections,
                        MaxSelections = g.MaxSelections,
                        IsRequired = g.IsRequired,
                        SortOrder = g.SortOrder,
                        Options = g.Options
                            .Where(o => o.IsActive)
                            .OrderBy(o => o.SortOrder)
                            .Select(o => new CustomizationOptionResponse
                            {
                                Id = o.Id,
                                Name = o.Name,
                                PriceModifier = o.PriceModifier,
                                SortOrder = o.SortOrder
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound(new { error = "Producto no encontrado" });

        return Ok(product);
    }
}
