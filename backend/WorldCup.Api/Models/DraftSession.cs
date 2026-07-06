namespace WorldCup.Api.Models;

public enum DraftSessionStatus
{
    Waiting,
    InProgress,
    Completed,
    Cancelled
}

public enum DraftMode
{
    SnakeDraft,
    SimultaneousTimed,
    Auction
}

// A live multiplayer draft room. Multiple coaches join, scout/pick/place against a shared pool.
public class DraftSession
{
    public int Id { get; set; }
    public Guid RoomCode { get; set; } = Guid.NewGuid();
    public DraftMode Mode { get; set; } = DraftMode.SnakeDraft;
    public DraftSessionStatus Status { get; set; } = DraftSessionStatus.Waiting;
    public int MaxCoaches { get; set; } = 8;
    public int CurrentTurnCoachId { get; set; }
    public int TurnTimeSeconds { get; set; } = 20;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Coach> Coaches { get; set; } = new();
    public List<DraftPick> Picks { get; set; } = new();
}

// A participant in a draft session / match / ladder. Kept intentionally simple (no full auth
// system here) - Id is what the frontend/SignalR connection is keyed on.
public class Coach
{
    public int Id { get; set; }
    public string DisplayName { get; set; } = "";
    public int Rating { get; set; } = 1000; // ladder ELO-style rating
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int BestStreak { get; set; }

    public int DraftSessionId { get; set; }
    public DraftSession? DraftSession { get; set; }

    public List<RosterSlot> Roster { get; set; } = new();
}
