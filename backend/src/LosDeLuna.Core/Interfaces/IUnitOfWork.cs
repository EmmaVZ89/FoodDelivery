namespace LosDeLuna.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync();
}
