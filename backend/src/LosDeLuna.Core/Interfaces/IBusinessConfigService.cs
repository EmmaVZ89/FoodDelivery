using LosDeLuna.Core.Entities;

namespace LosDeLuna.Core.Interfaces;

public interface IBusinessConfigService
{
    Task<BusinessConfig> GetConfigAsync();
    Task<bool> IsBusinessOpenAsync();
    Task<bool> HasKitchenCapacityAsync();
}
