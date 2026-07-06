using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

// Tick-based live match simulation (called once per simulated minute by a background loop
// driven from MatchHub). Produces MatchEvents that get broadcast to players AND spectators.
// Mid-match commands (subs, tactic changes) mutate MatchState between ticks, same as a
// Winning-Eleven-style live match screen.
public class MatchEngine
{
    private readonly AppDbContext _db;
    private readonly AuditChainService _audit;
    private static readonly Random _rng = new();

    public MatchEngine(AppDbContext db, AuditChainService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<MatchState> CreateMatchAsync(int coachAId, int coachBId)
    {
        var match = new MatchState { CoachAId = coachAId, CoachBId = coachBId, Phase = MatchPhase.PreMatch, IsSpectatable = true };
        _db.MatchStates.Add(match);
        await _db.SaveChangesAsync();

        await AddEvent(match, 0, MatchEventType.KickOff, null, null, "Kick-off!");
        match.Phase = MatchPhase.FirstHalf;
        await _db.SaveChangesAsync();
        return match;
    }

    // Advances the match by one simulated minute. Returns the events generated this tick so
    // the hub can broadcast only the delta.
    public async Task<List<MatchEvent>> TickAsync(int matchId)
    {
        var match = await _db.MatchStates.Include(m => m.Events).FirstAsync(m => m.Id == matchId);
        var tickEvents = new List<MatchEvent>();

        if (match.Phase is MatchPhase.FullTime or MatchPhase.Penalties)
            return tickEvents;

        // Half-time is a brief pause, not a dead end: auto-resume into the second half after
        // one tick so the match doesn't stall forever waiting for a call that never comes.
        if (match.Phase == MatchPhase.HalfTime)
        {
            match.Phase = MatchPhase.SecondHalf;
            tickEvents.Add(await AddEvent(match, match.Minute, MatchEventType.KickOff, null, null, "Second half underway."));
            await _db.SaveChangesAsync();
            return tickEvents;
        }

        match.Minute++;

        // Possession drifts based on tactics
        int tacticSkewA = TacticSkew(match.TacticA) - TacticSkew(match.TacticB);
        match.PossessionA = Math.Clamp(match.PossessionA + _rng.Next(-3, 4) + tacticSkewA / 2, 25, 75);

        // Random match events, weighted lightly by attacking tactic
        double attackRollA = 0.06 + (match.TacticA == Tactic.Attacking ? 0.03 : 0);
        double attackRollB = 0.06 + (match.TacticB == Tactic.Attacking ? 0.03 : 0);

        if (_rng.NextDouble() < attackRollA)
            tickEvents.Add(await GoalOrShot(match, match.CoachAId, isA: true));
        if (_rng.NextDouble() < attackRollB)
            tickEvents.Add(await GoalOrShot(match, match.CoachBId, isA: false));

        if (_rng.NextDouble() < 0.02)
            tickEvents.Add(await CardOrFoul(match, _rng.NextDouble() < 0.5 ? match.CoachAId : match.CoachBId));

        if (_rng.NextDouble() < 0.01)
            tickEvents.Add(await Injury(match, _rng.NextDouble() < 0.5 ? match.CoachAId : match.CoachBId));

        if (_rng.NextDouble() < 0.015)
            tickEvents.Add(await KeyMoment(match, _rng.NextDouble() < 0.5 ? match.CoachAId : match.CoachBId));

        if (match.Minute == 45 && match.Phase == MatchPhase.FirstHalf)
        {
            match.Phase = MatchPhase.HalfTime;
            tickEvents.Add(await AddEvent(match, match.Minute, MatchEventType.HalfTime, null, null, "Half-time."));
        }
        else if (match.Minute == 90 && match.Phase == MatchPhase.SecondHalf)
        {
            if (match.ScoreA == match.ScoreB && IsKnockout(match))
            {
                match.Phase = MatchPhase.ExtraTime;
                tickEvents.Add(await AddEvent(match, match.Minute, MatchEventType.ExtraTimeStart, null, null, "Extra time!"));
            }
            else
            {
                match.Phase = MatchPhase.FullTime;
                tickEvents.Add(await AddEvent(match, match.Minute, MatchEventType.FullTime, null, null, "Full-time."));
            }
        }
        else if (match.Minute == 120 && match.Phase == MatchPhase.ExtraTime)
        {
            if (match.ScoreA == match.ScoreB)
            {
                match.Phase = MatchPhase.Penalties;
                tickEvents.Add(await AddEvent(match, match.Minute, MatchEventType.PenaltyShootoutStart, null, null, "Penalty shootout!"));
                await ResolvePenalties(match);
                tickEvents.Add(await AddEvent(match, match.Minute, MatchEventType.FullTime, null, null,
                    $"Penalties final: {match.PenaltiesA}-{match.PenaltiesB}"));
                match.Phase = MatchPhase.FullTime;
            }
            else
            {
                match.Phase = MatchPhase.FullTime;
                tickEvents.Add(await AddEvent(match, match.Minute, MatchEventType.FullTime, null, null, "Full-time (extra time)."));
            }
        }

        if (match.Phase == MatchPhase.FullTime)
        {
            await _audit.AppendAsync("MatchResult", new
            {
                matchId,
                match.CoachAId,
                match.CoachBId,
                match.ScoreA,
                match.ScoreB,
                match.PenaltiesA,
                match.PenaltiesB,
            });
        }

        await _db.SaveChangesAsync();
        return tickEvents;
    }

    public async Task ResumeSecondHalfAsync(int matchId)
    {
        var match = await _db.MatchStates.FirstAsync(m => m.Id == matchId);
        match.Phase = MatchPhase.SecondHalf;
        await _db.SaveChangesAsync();
    }

    public async Task ChangeTacticAsync(int matchId, int coachId, Tactic tactic)
    {
        var match = await _db.MatchStates.FirstAsync(m => m.Id == matchId);
        if (coachId == match.CoachAId) match.TacticA = tactic; else match.TacticB = tactic;
        await AddEvent(match, match.Minute, MatchEventType.TacticChange, coachId, null, $"Tactic changed to {tactic}.");
        await _db.SaveChangesAsync();
        await _audit.AppendAsync("TacticChange", new { matchId, coachId, tactic = tactic.ToString() });
    }

    public async Task SubstituteAsync(int matchId, int coachId, int outPlayerId, int inPlayerId)
    {
        var match = await _db.MatchStates.FirstAsync(m => m.Id == matchId);
        var remaining = coachId == match.CoachAId ? match.SubsRemainingA : match.SubsRemainingB;
        if (remaining <= 0) throw new InvalidOperationException("No substitutions remaining.");

        if (coachId == match.CoachAId) match.SubsRemainingA--; else match.SubsRemainingB--;

        var slot = await _db.RosterSlots.FirstOrDefaultAsync(r => r.CoachId == coachId && r.PlayerId == outPlayerId);
        if (slot != null) slot.PlayerId = inPlayerId;

        await AddEvent(match, match.Minute, MatchEventType.Substitution, coachId, inPlayerId, "Substitution made.");
        await _db.SaveChangesAsync();
        await _audit.AppendAsync("Substitution", new { matchId, coachId, outPlayerId, inPlayerId });
    }

    private static bool IsKnockout(MatchState match) => true; // group-stage draws are allowed to stand upstream; caller decides

    private static int TacticSkew(Tactic t) => t switch
    {
        Tactic.Attacking => 6,
        Tactic.Defensive => -6,
        _ => 0,
    };

    private async Task<MatchEvent> GoalOrShot(MatchState match, int coachId, bool isA)
    {
        if (isA) match.ShotsA++; else match.ShotsB++;

        bool isGoal = _rng.NextDouble() < 0.35;
        if (isGoal)
        {
            if (isA) match.ScoreA++; else match.ScoreB++;
            return await AddEvent(match, match.Minute, MatchEventType.Goal, coachId, null, "GOAL!");
        }
        return await AddEvent(match, match.Minute, MatchEventType.Corner, coachId, null, "Shot saved, corner.");
    }

    private async Task<MatchEvent> CardOrFoul(MatchState match, int coachId)
    {
        if (coachId == match.CoachAId) match.FoulsA++; else match.FoulsB++;

        double roll = _rng.NextDouble();
        if (roll < 0.15)
            return await AddEvent(match, match.Minute, MatchEventType.RedCard, coachId, null, "RED CARD! Down to 10 men.");
        if (roll < 0.55)
            return await AddEvent(match, match.Minute, MatchEventType.YellowCard, coachId, null, "Yellow card shown.");
        return await AddEvent(match, match.Minute, MatchEventType.Foul, coachId, null, "Foul committed.");
    }

    private async Task<MatchEvent> Injury(MatchState match, int coachId)
        => await AddEvent(match, match.Minute, MatchEventType.Injury, coachId, null, "Player down injured - emergency sub needed.");

    private async Task<MatchEvent> KeyMoment(MatchState match, int coachId)
        => await AddEvent(match, match.Minute, MatchEventType.KeyMoment, coachId, null, "1-on-1 chance! Awaiting coach decision...");

    private async Task ResolvePenalties(MatchState match)
    {
        for (int i = 0; i < 5; i++)
        {
            if (_rng.NextDouble() < 0.78) match.PenaltiesA++;
            if (_rng.NextDouble() < 0.78) match.PenaltiesB++;
        }
        while (match.PenaltiesA == match.PenaltiesB)
        {
            if (_rng.NextDouble() < 0.78) match.PenaltiesA++;
            if (_rng.NextDouble() < 0.78) match.PenaltiesB++;
        }
    }

    private async Task<MatchEvent> AddEvent(MatchState match, int minute, MatchEventType type, int? coachId, int? playerId, string description)
    {
        var ev = new MatchEvent
        {
            MatchStateId = match.Id,
            Minute = minute,
            Type = type,
            CoachId = coachId,
            PlayerId = playerId,
            Description = description,
        };
        _db.MatchEvents.Add(ev);
        await _db.SaveChangesAsync();
        return ev;
    }
}
