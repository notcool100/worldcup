using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

// Chemistry bonuses reward drafting players who share a nation or era, mirroring the
// original game's "combine players from the same nation or era" hook.
public class ChemistryCalculator
{
    public record ChemistryResult(int TotalBonus, Dictionary<string, int> NationCounts, Dictionary<int, int> EraCounts);

    public ChemistryResult Calculate(IEnumerable<Player> roster)
    {
        var players = roster.ToList();
        var nationCounts = players.GroupBy(p => p.Nation).ToDictionary(g => g.Key, g => g.Count());
        var eraCounts = players.GroupBy(p => p.Era).ToDictionary(g => g.Key, g => g.Count());

        int bonus = 0;

        // +2 overall per pair of players sharing a nation (beyond the first)
        foreach (var (_, count) in nationCounts)
            if (count > 1) bonus += (count - 1) * 2;

        // +1 overall per pair of players sharing an era/tournament year (beyond the first)
        foreach (var (_, count) in eraCounts)
            if (count > 1) bonus += (count - 1) * 1;

        // Full-XI same-nation bonus: significant boost for an entire drafted dream team
        if (players.Count >= 11 && nationCounts.Values.Any(c => c == players.Count))
            bonus += 15;

        return new ChemistryResult(bonus, nationCounts, eraCounts);
    }
}
