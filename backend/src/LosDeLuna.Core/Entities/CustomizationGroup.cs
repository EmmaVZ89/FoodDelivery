using LosDeLuna.Core.Enums;

namespace LosDeLuna.Core.Entities;

public class CustomizationGroup
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public SelectionType SelectionType { get; set; }
    public int MinSelections { get; set; } = 0;
    public int? MaxSelections { get; set; }
    public bool IsRequired { get; set; } = false;
    public int SortOrder { get; set; }

    public Product Product { get; set; } = null!;
    public ICollection<CustomizationOption> Options { get; set; } = new List<CustomizationOption>();
}
