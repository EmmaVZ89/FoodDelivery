using LosDeLuna.Core.Entities;
using LosDeLuna.Core.Enums;
using LosDeLuna.Core.Exceptions;
using LosDeLuna.Core.Interfaces;
using LosDeLuna.Infra.Data;
using Microsoft.EntityFrameworkCore;

namespace LosDeLuna.Infra.Services;

public class BusinessConfigService : IBusinessConfigService
{
    private readonly AppDbContext _db;
    private static readonly TimeZoneInfo ArgentinaTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");

    public BusinessConfigService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<BusinessConfig> GetConfigAsync()
    {
        return await _db.BusinessConfigs.FirstOrDefaultAsync()
            ?? throw new BusinessException("Configuración no encontrada", 500);
    }

    public async Task<bool> IsBusinessOpenAsync()
    {
        var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ArgentinaTimeZone);
        // Monday=1 in .NET DayOfWeek is Sunday=0, need to map: Mon=0, Tue=1,..., Sun=6
        var dayIndex = now.DayOfWeek == System.DayOfWeek.Sunday ? 6 : (int)now.DayOfWeek - 1;

        var schedule = await _db.Schedules.FirstOrDefaultAsync(s => s.DayOfWeek == dayIndex);
        if (schedule == null || !schedule.IsOpen)
            return false;

        if (schedule.OpenTime == null || schedule.CloseTime == null)
            return false;

        var currentTime = TimeOnly.FromDateTime(now);
        return currentTime >= schedule.OpenTime && currentTime <= schedule.CloseTime;
    }

    public async Task<bool> HasKitchenCapacityAsync()
    {
        var config = await GetConfigAsync();
        if (config.MaxConcurrentOrders <= 0)
            return true; // Sin limite

        var activeOrders = await _db.Orders.CountAsync(o =>
            o.Status == OrderStatus.Pending || o.Status == OrderStatus.Preparing);

        return activeOrders < config.MaxConcurrentOrders;
    }
}
