using LosDeLuna.Core.Entities;
using LosDeLuna.Core.Enums;
using LosDeLuna.Core.Exceptions;
using LosDeLuna.Core.Interfaces;
using LosDeLuna.Infra.Data;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.Infra.Services;

public class OrderService
{
    private readonly AppDbContext _db;
    private readonly IBusinessConfigService _configService;
    private static readonly TimeZoneInfo ArgTz =
        TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");

    public OrderService(AppDbContext db, IBusinessConfigService configService)
    {
        _db = db;
        _configService = configService;
    }

    public async Task<Order> CreateOrderAsync(
        Guid userId,
        List<(int ProductId, int? VariantId, int Quantity, string? Observations,
              List<(int GroupId, int OptionId, int OptionQuantity)> Customizations)> items,
        string deliveryName, string deliveryPhone, string deliveryAddress,
        string? deliveryBetweenStreets, string? deliveryApartment, string? deliveryNotes,
        PaymentMethod paymentMethod, decimal? cashAmount, string? discountCode)
    {
        // Validate business is open
        if (!await _configService.IsBusinessOpenAsync())
            throw new BusinessException("El local está cerrado en este momento");

        // Validate kitchen capacity
        if (!await _configService.HasKitchenCapacityAsync())
            throw new BusinessException("Estamos al máximo de capacidad. Intentá en unos minutos.");

        var config = await _configService.GetConfigAsync();

        // Process items and calculate prices server-side
        var orderItems = new List<OrderItem>();
        decimal subtotal = 0;
        int sortOrder = 0;

        foreach (var item in items)
        {
            var product = await _db.Products
                .Include(p => p.Variants)
                .Include(p => p.CustomizationGroups)
                    .ThenInclude(g => g.Options)
                .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.IsActive);

            if (product == null)
                throw new BusinessException($"Producto no encontrado o no disponible");

            if (!product.IsAvailable)
                throw new BusinessException($"'{product.Name}' no está disponible en este momento");

            // Determine price
            decimal unitPrice;
            string? variantName = null;

            if (item.VariantId.HasValue)
            {
                var variant = product.Variants.FirstOrDefault(v => v.Id == item.VariantId && v.IsActive);
                if (variant == null)
                    throw new BusinessException($"Variante no válida para '{product.Name}'");
                unitPrice = variant.Price;
                variantName = variant.Name;
            }
            else if (product.IsPromotion && product.DiscountPercent > 0)
            {
                unitPrice = product.Price * (1 - product.DiscountPercent / 100);
            }
            else
            {
                unitPrice = product.Price;
            }

            // Process customizations
            var orderCustomizations = new List<OrderItemCustomization>();
            decimal customizationCost = 0;

            foreach (var cust in item.Customizations)
            {
                var group = product.CustomizationGroups.FirstOrDefault(g => g.Id == cust.GroupId);
                var option = group?.Options.FirstOrDefault(o => o.Id == cust.OptionId && o.IsActive);

                if (group == null || option == null)
                    throw new BusinessException("Personalización no válida");

                customizationCost += option.PriceModifier * cust.OptionQuantity;

                orderCustomizations.Add(new OrderItemCustomization
                {
                    GroupName = group.Name,
                    OptionName = option.Name,
                    OptionQuantity = cust.OptionQuantity,
                    PriceModifier = option.PriceModifier
                });
            }

            var itemSubtotal = (unitPrice + customizationCost) * item.Quantity;
            subtotal += itemSubtotal;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                VariantId = item.VariantId,
                ProductName = product.Name,
                VariantName = variantName,
                Quantity = item.Quantity,
                UnitPrice = unitPrice + customizationCost,
                Subtotal = itemSubtotal,
                Observations = item.Observations,
                SortOrder = sortOrder++,
                Customizations = orderCustomizations
            });
        }

        // Discount code
        decimal discountAmount = 0;
        int? discountCodeId = null;
        decimal shippingCost = config.ShippingCost;

        if (!string.IsNullOrWhiteSpace(discountCode))
        {
            var code = await _db.DiscountCodes.FirstOrDefaultAsync(c =>
                c.Code == discountCode.ToUpperInvariant() && c.IsActive);

            if (code == null)
                throw new BusinessException("Código de descuento inválido");

            if (code.ValidFrom.HasValue && code.ValidFrom > DateTime.UtcNow)
                throw new BusinessException("El código aún no es válido");

            if (code.ValidUntil.HasValue && code.ValidUntil < DateTime.UtcNow)
                throw new BusinessException("El código ha expirado");

            if (code.MaxUses.HasValue && code.CurrentUses >= code.MaxUses)
                throw new BusinessException("El código ha alcanzado el máximo de usos");

            discountAmount = subtotal * (code.DiscountPercent / 100);
            discountCodeId = code.Id;

            if (code.FreeShipping)
                shippingCost = 0;

            code.CurrentUses++;
        }

        var total = subtotal - discountAmount + shippingCost;

        // Validate cash amount
        if (paymentMethod == PaymentMethod.Cash && cashAmount.HasValue && cashAmount < total)
            throw new BusinessException("El monto en efectivo debe ser igual o mayor al total");

        // Generate order code
        var argNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ArgTz);
        var orderCode = argNow.ToString("yyyy-ddMM-HHmmss");

        var order = new Order
        {
            OrderCode = orderCode,
            UserId = userId,
            Status = OrderStatus.Pending,
            Subtotal = Math.Round(subtotal, 2),
            ShippingCost = Math.Round(shippingCost, 2),
            DiscountAmount = Math.Round(discountAmount, 2),
            Total = Math.Round(total, 2),
            DiscountCodeId = discountCodeId,
            PaymentMethod = paymentMethod,
            CashAmount = cashAmount,
            DeliveryName = deliveryName,
            DeliveryPhone = deliveryPhone,
            DeliveryAddress = deliveryAddress,
            DeliveryBetweenStreets = deliveryBetweenStreets,
            DeliveryApartment = deliveryApartment,
            DeliveryNotes = deliveryNotes,
            Items = orderItems,
            StatusHistory = new List<OrderStatusHistory>
            {
                new() { Status = OrderStatus.Pending, ChangedBy = userId }
            }
        };

        // Generate WhatsApp message
        order.WhatsappMessage = GenerateWhatsAppMessage(order, config);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        return order;
    }

    private static string GenerateWhatsAppMessage(Order order, BusinessConfig config)
    {
        var argNow = TimeZoneInfo.ConvertTimeFromUtc(order.CreatedAt, ArgTz);
        var lines = new List<string>
        {
            $"*Pedido #{order.Id} - {order.OrderCode}*",
            $"Fecha: {argNow:dd/MM/yyyy} - {argNow:HH:mm}hs",
            "",
            "*Productos:*"
        };

        foreach (var item in order.Items)
        {
            var line = $"• {item.Quantity}x {item.ProductName}";
            if (item.VariantName != null)
                line += $" ({item.VariantName})";

            // Customizations
            var custs = item.Customizations
                .Select(c => c.OptionQuantity > 1 ? $"{c.OptionQuantity} {c.OptionName}" : c.OptionName);
            if (custs.Any())
                line += $" - {string.Join(", ", custs)}";

            line += $" - ${item.Subtotal:N0}";
            lines.Add(line);

            if (!string.IsNullOrWhiteSpace(item.Observations))
                lines.Add($"  Obs: {item.Observations}");
        }

        lines.Add("");
        lines.Add($"Subtotal: ${order.Subtotal:N0}");
        if (order.DiscountAmount > 0)
            lines.Add($"Descuento: -${order.DiscountAmount:N0}");
        lines.Add($"Envío: ${order.ShippingCost:N0}");
        lines.Add($"*Total: ${order.Total:N0}*");
        lines.Add("");
        lines.Add("*Entrega:*");
        lines.Add($"{order.DeliveryName} - {order.DeliveryPhone}");
        lines.Add(order.DeliveryAddress);

        if (!string.IsNullOrWhiteSpace(order.DeliveryBetweenStreets))
            lines.Add($"Entre: {order.DeliveryBetweenStreets}");
        if (!string.IsNullOrWhiteSpace(order.DeliveryApartment))
            lines.Add($"Depto: {order.DeliveryApartment}");
        if (!string.IsNullOrWhiteSpace(order.DeliveryNotes))
            lines.Add($"Ref: {order.DeliveryNotes}");

        lines.Add("");
        lines.Add($"Pago: {(order.PaymentMethod == PaymentMethod.Cash ? "Efectivo" : "Transferencia")}");
        if (order.PaymentMethod == PaymentMethod.Cash && order.CashAmount.HasValue)
            lines.Add($"Paga con: ${order.CashAmount:N0}");

        return string.Join("\n", lines);
    }
}
