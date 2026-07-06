namespace WorldCup.Api.Models;

public enum TournamentStage
{
    GroupStage,
    RoundOf16,
    QuarterFinal,
    SemiFinal,
    Final,
    Completed
}

public class Tournament
{
    public int Id { get; set; }
    public string Name { get; set; } = "Summer Cup";
    public TournamentStage Stage { get; set; } = TournamentStage.GroupStage;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<BracketMatch> Matches { get; set; } = new();
}

public class BracketMatch
{
    public int Id { get; set; }
    public int TournamentId { get; set; }
    public TournamentStage Stage { get; set; }
    public int RoundIndex { get; set; } // ordering within a stage

    public int CoachAId { get; set; }
    public int CoachBId { get; set; }
    public int? WinnerCoachId { get; set; }

    public int MatchStateId { get; set; }
    public MatchState? MatchState { get; set; }
}
