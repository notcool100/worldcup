namespace WorldCup.Api.Models;

// A single filled formation slot on a coach's drafted XI.
public class RosterSlot
{
    public int Id { get; set; }
    public int CoachId { get; set; }
    public Coach? Coach { get; set; }

    public string SlotCode { get; set; } = ""; // e.g. "GK", "LB", "CB1", "ST"
    public int PlayerId { get; set; }
    public Player? Player { get; set; }

    public bool IsSuspended { get; set; } // red-card / accumulated-yellow suspension
    public bool IsInjured { get; set; }
}
