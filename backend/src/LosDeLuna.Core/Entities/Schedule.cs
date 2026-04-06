namespace LosDeLuna.Core.Entities;

public class Schedule
{
    public int Id { get; set; }
    public int DayOfWeek { get; set; } // 0=Lunes, 6=Domingo
    public TimeOnly? OpenTime { get; set; }
    public TimeOnly? CloseTime { get; set; }
    public bool IsOpen { get; set; } = true;
    public int SortOrder { get; set; }
}
