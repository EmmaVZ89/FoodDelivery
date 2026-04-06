using LosDeLuna.Core.Entities;
using LosDeLuna.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.Infra.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<BusinessConfig> BusinessConfigs => Set<BusinessConfig>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<User> Users => Set<User>();
    public DbSet<MagicLink> MagicLinks => Set<MagicLink>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<CustomizationGroup> CustomizationGroups => Set<CustomizationGroup>();
    public DbSet<CustomizationOption> CustomizationOptions => Set<CustomizationOption>();
    public DbSet<DiscountCode> DiscountCodes => Set<DiscountCode>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemCustomization> OrderItemCustomizations => Set<OrderItemCustomization>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // BusinessConfig
        modelBuilder.Entity<BusinessConfig>(e =>
        {
            e.ToTable("business_config");
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(20);
            e.Property(x => x.Whatsapp).HasMaxLength(20).IsRequired();
            e.Property(x => x.ShippingCost).HasPrecision(10, 2);
            e.Property(x => x.Latitude).HasPrecision(10, 8);
            e.Property(x => x.Longitude).HasPrecision(11, 8);
        });

        // Schedule
        modelBuilder.Entity<Schedule>(e =>
        {
            e.ToTable("schedules");
            e.Property(x => x.DayOfWeek).IsRequired();
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.Property(x => x.Email).HasMaxLength(255).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.Phone).HasMaxLength(20);
            e.Property(x => x.BetweenStreets).HasMaxLength(255);
            e.Property(x => x.ApartmentInfo).HasMaxLength(100);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => x.Role);
        });

        // MagicLink
        modelBuilder.Entity<MagicLink>(e =>
        {
            e.ToTable("magic_links");
            e.Property(x => x.Email).HasMaxLength(255).IsRequired();
            e.Property(x => x.Token).HasMaxLength(255).IsRequired();
            e.HasIndex(x => x.Token).IsUnique();
            e.HasIndex(x => x.Email);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // RefreshToken
        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.Property(x => x.Token).HasMaxLength(255).IsRequired();
            e.HasIndex(x => x.Token).IsUnique();
            e.HasIndex(x => x.UserId);
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // Category
        modelBuilder.Entity<Category>(e =>
        {
            e.ToTable("categories");
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.HasIndex(x => new { x.IsActive, x.SortOrder });
        });

        // Product
        modelBuilder.Entity<Product>(e =>
        {
            e.ToTable("products");
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.Property(x => x.DiscountPercent).HasPrecision(5, 2);
            e.HasIndex(x => x.CategoryId);
            e.HasIndex(x => new { x.IsActive, x.IsAvailable, x.SortOrder });
            e.HasOne(x => x.Category).WithMany(c => c.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        // ProductVariant
        modelBuilder.Entity<ProductVariant>(e =>
        {
            e.ToTable("product_variants");
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.HasIndex(x => x.ProductId);
            e.HasOne(x => x.Product).WithMany(p => p.Variants).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        // CustomizationGroup
        modelBuilder.Entity<CustomizationGroup>(e =>
        {
            e.ToTable("customization_groups");
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.SelectionType).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => x.ProductId);
            e.HasOne(x => x.Product).WithMany(p => p.CustomizationGroups).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        // CustomizationOption
        modelBuilder.Entity<CustomizationOption>(e =>
        {
            e.ToTable("customization_options");
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.PriceModifier).HasPrecision(10, 2);
            e.HasIndex(x => x.GroupId);
            e.HasOne(x => x.Group).WithMany(g => g.Options).HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Cascade);
        });

        // DiscountCode
        modelBuilder.Entity<DiscountCode>(e =>
        {
            e.ToTable("discount_codes");
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.DiscountPercent).HasPrecision(5, 2);
        });

        // Alert
        modelBuilder.Entity<Alert>(e =>
        {
            e.ToTable("alerts");
            e.Property(x => x.Message).IsRequired();
        });

        // Order
        modelBuilder.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.Property(x => x.OrderCode).HasMaxLength(30).IsRequired();
            e.HasIndex(x => x.OrderCode).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.Property(x => x.ShippingCost).HasPrecision(10, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(10, 2);
            e.Property(x => x.Total).HasPrecision(10, 2);
            e.Property(x => x.CashAmount).HasPrecision(10, 2);
            e.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.DeliveryName).HasMaxLength(100).IsRequired();
            e.Property(x => x.DeliveryPhone).HasMaxLength(20).IsRequired();
            e.Property(x => x.DeliveryAddress).IsRequired();
            e.Property(x => x.DeliveryBetweenStreets).HasMaxLength(255);
            e.Property(x => x.DeliveryApartment).HasMaxLength(100);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CreatedAt);
            e.HasOne(x => x.User).WithMany(u => u.Orders).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.DiscountCode).WithMany().HasForeignKey(x => x.DiscountCodeId).OnDelete(DeleteBehavior.SetNull);
        });

        // OrderItem
        modelBuilder.Entity<OrderItem>(e =>
        {
            e.ToTable("order_items");
            e.Property(x => x.ProductName).HasMaxLength(150).IsRequired();
            e.Property(x => x.VariantName).HasMaxLength(100);
            e.Property(x => x.UnitPrice).HasPrecision(10, 2);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.HasIndex(x => x.OrderId);
            e.HasOne(x => x.Order).WithMany(o => o.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        // OrderItemCustomization
        modelBuilder.Entity<OrderItemCustomization>(e =>
        {
            e.ToTable("order_item_customizations");
            e.Property(x => x.GroupName).HasMaxLength(100).IsRequired();
            e.Property(x => x.OptionName).HasMaxLength(100).IsRequired();
            e.Property(x => x.PriceModifier).HasPrecision(10, 2);
            e.HasIndex(x => x.OrderItemId);
            e.HasOne(x => x.OrderItem).WithMany(oi => oi.Customizations).HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Cascade);
        });

        // OrderStatusHistory
        modelBuilder.Entity<OrderStatusHistory>(e =>
        {
            e.ToTable("order_status_history");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => x.OrderId);
            e.HasOne(x => x.Order).WithMany(o => o.StatusHistory).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Static date for seed data (EF Core requires deterministic values)
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<BusinessConfig>().HasData(new BusinessConfig
        {
            Id = 1,
            Name = "Lo de Luna",
            Whatsapp = "+5491169200561",
            ShippingCost = 500,
            MaxConcurrentOrders = 0,
            CreatedAt = seedDate,
            UpdatedAt = seedDate
        });

        for (int i = 0; i < 7; i++)
        {
            modelBuilder.Entity<Schedule>().HasData(new Schedule
            {
                Id = i + 1,
                DayOfWeek = i,
                OpenTime = new TimeOnly(9, 0),
                CloseTime = new TimeOnly(23, 0),
                IsOpen = i < 6,
                SortOrder = i
            });
        }

        modelBuilder.Entity<User>().HasData(new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Email = "admin@lodeluna.com",
            Name = "Administrador",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = seedDate,
            UpdatedAt = seedDate
        });
    }
}
