namespace WorldCup.Api.Models;

public enum MatchEventType
{
    KickOff,
    Goal,
    YellowCard,
    RedCard,
    Injury,
    Substitution,
    TacticChange,
    Corner,
    Foul,
    HalfTime,
    FullTime,
    ExtraTimeStart,
    PenaltyShootoutStart,
    PenaltyKick,
    ManOfTheMatch,
    KeyMoment // decision-point prompt (1v1 shot, concede foul/corner, etc.)
}

public class MatchEvent
{
    public int Id { get; set; }
    public int MatchStateId { get; set; }
    public int Minute { get; set; }
    public MatchEventType Type { get; set; }
    public int? CoachId { get; set; } // which side the event applies to
    public int? PlayerId { get; set; }
    public string Description { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
