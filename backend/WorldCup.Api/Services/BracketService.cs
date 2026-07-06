using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

// Manages group-stage -> knockout bracket progression, and exposes which matches are
// currently live so the spectator UI can list "other ongoing matches" to watch.
public class BracketService
{
    private readonly AppDbContext _db;
    private readonly MatchEngine _matchEngine;
    private readonly AuditChainService _audit;

    public BracketService(AppDbContext db, MatchEngine matchEngine, AuditChainService audit)
    {
        _db = db;
        _matchEngine = matchEngine;
        _audit = audit;
    }

    public async Task<Tournament> CreateTournamentAsync(string name, List<(int CoachA, int CoachB)> firstRoundPairs, TournamentStage stage)
    {
        var tournament = new Tournament { Name = name, Stage = stage };
        _db.Tournaments.Add(tournament);
        await _db.SaveChangesAsync();

        int idx = 0;
        foreach (var (coachA, coachB) in firstRoundPairs)
        {
            var matchState = await _matchEngine.CreateMatchAsync(coachA, coachB);
            tournament.Matches.Add(new BracketMatch
            {
                TournamentId = tournament.Id,
                Stage = stage,
                RoundIndex = idx++,
                CoachAId = coachA,
                CoachBId = coachB,
                MatchStateId = matchState.Id,
            });
        }
        await _db.SaveChangesAsync();
        await _audit.AppendAsync("TournamentCreated", new { tournament.Id, name, stage = stage.ToString(), pairs = firstRoundPairs });
        return tournament;
    }

    public async Task<List<BracketMatch>> GetLiveMatchesAsync()
    {
        // "Live" = has a MatchState that hasn't reached FullTime yet and is spectatable.
        return await _db.BracketMatches
            .Include(b => b.MatchState)
            .Where(b => b.MatchState != null
                        && b.MatchState.Phase != MatchPhase.FullTime
                        && b.MatchState.IsSpectatable)
            .ToListAsync();
    }

    public async Task RecordResultAsync(int bracketMatchId, int winnerCoachId)
    {
        var bm = await _db.BracketMatches.FirstAsync(b => b.Id == bracketMatchId);
        bm.WinnerCoachId = winnerCoachId;
        await _db.SaveChangesAsync();
        await _audit.AppendAsync("BracketResult", new { bracketMatchId, winnerCoachId });
    }
}
