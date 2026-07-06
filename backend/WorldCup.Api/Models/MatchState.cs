namespace WorldCup.Api.Models;

public enum MatchPhase
{
    PreMatch,
    FirstHalf,
    HalfTime,
    SecondHalf,
    ExtraTime,
    Penalties,
    FullTime
}

public enum Tactic
{
    Defensive,
    Balanced,
    Attacking
}

public class MatchState
{
    public int Id { get; set; }
    public int CoachAId { get; set; }
    public int CoachBId { get; set; }

    public MatchPhase Phase { get; set; } = MatchPhase.PreMatch;
    public int Minute { get; set; }
    public int ScoreA { get; set; }
    public int ScoreB { get; set; }
    public int PenaltiesA { get; set; }
    public int PenaltiesB { get; set; }

    public Tactic TacticA { get; set; } = Tactic.Balanced;
    public Tactic TacticB { get; set; } = Tactic.Balanced;

    public int PossessionA { get; set; } = 50; // percentage
    public int ShotsA { get; set; }
    public int ShotsB { get; set; }
    public int FoulsA { get; set; }
    public int FoulsB { get; set; }

    public int SubsRemainingA { get; set; } = 5;
    public int SubsRemainingB { get; set; } = 5;

    public bool IsSpectatable { get; set; } = true;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public List<MatchEvent> Events { get; set; } = new();
}
