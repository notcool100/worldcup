using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

// Server-authoritative draft logic. Every mutation happens here (never trust the client to
// report its own pick) and every meaningful action is written to the audit chain, satisfying
// "no one can manipulate the DB" without needing an actual blockchain (see AuditChainService).
public class DraftService
{
    private readonly AppDbContext _db;
    private readonly AuditChainService _audit;
    private readonly ChemistryCalculator _chemistry;
    private static readonly Random _rng = new();

    public DraftService(AppDbContext db, AuditChainService audit, ChemistryCalculator chemistry)
    {
        _db = db;
        _audit = audit;
        _chemistry = chemistry;
    }

    public async Task<NationalSquad> ScoutAsync(int draftSessionId, int coachId)
    {
        var session = await _db.DraftSessions.FindAsync(draftSessionId)
            ?? throw new InvalidOperationException("Session not found.");
        if (session.CurrentTurnCoachId != coachId)
            throw new InvalidOperationException("It is not your turn.");

        var count = await _db.NationalSquads.CountAsync();
        var skip = _rng.Next(count);
        var squad = await _db.NationalSquads.Include(s => s.Players)
            .OrderBy(s => s.Id).Skip(skip).Take(1).FirstAsync();

        await _audit.AppendAsync("Scout", new { draftSessionId, coachId, squadId = squad.Id, squad.Nation, squad.Year });
        return squad;
    }

    public async Task<(RosterSlot Slot, int NextCoachId)> PickAndPlaceAsync(int draftSessionId, int coachId, int playerId, string slotCode)
    {
        var session = await _db.DraftSessions.Include(s => s.Coaches)
            .FirstOrDefaultAsync(s => s.Id == draftSessionId)
            ?? throw new InvalidOperationException("Session not found.");

        if (session.CurrentTurnCoachId != coachId)
            throw new InvalidOperationException("It is not your turn.");

        var coach = session.Coaches.FirstOrDefault(c => c.Id == coachId)
            ?? throw new InvalidOperationException("Coach not found in this draft session.");

        var existing = await _db.RosterSlots.AnyAsync(r => r.CoachId == coachId && r.SlotCode == slotCode);
        if (existing)
            throw new InvalidOperationException($"Slot {slotCode} is already filled.");

        // Global exclusivity: no two coaches in the same session may draft the same player.
        var alreadyDrafted = await _db.DraftPicks
            .AnyAsync(p => p.DraftSessionId == draftSessionId && p.PickedPlayerId == playerId);
        if (alreadyDrafted)
            throw new InvalidOperationException("This player has already been drafted by another coach.");

        var player = await _db.Players.FindAsync(playerId)
            ?? throw new InvalidOperationException("Player not found.");

        var slot = new RosterSlot { CoachId = coachId, SlotCode = slotCode, PlayerId = playerId };
        _db.RosterSlots.Add(slot);

        _db.DraftPicks.Add(new DraftPick
        {
            DraftSessionId = draftSessionId,
            CoachId = coachId,
            PickedPlayerId = playerId,
            PlacedSlot = slotCode,
        });

        // Advance turn: next coach in order, wrapping around.
        var coachIds = session.Coaches.OrderBy(c => c.Id).Select(c => c.Id).ToList();
        var currentIndex = coachIds.IndexOf(coachId);
        var nextCoachId = coachIds[(currentIndex + 1) % coachIds.Count];
        session.CurrentTurnCoachId = nextCoachId;

        await _db.SaveChangesAsync();
        await _audit.AppendAsync("DraftPick", new { draftSessionId, coachId, playerId, slotCode, nextTurn = nextCoachId });

        return (slot, nextCoachId);
    }

    // Limited-use ability: block a rival from taking a specific player this round, or steal
    // a player already placed on a rival's roster (per the "block/steal" multiplayer feature).
    public async Task<RosterSlot> StealAsync(int draftSessionId, int stealingCoachId, int targetCoachId, int targetSlotId, string newSlotCode)
    {
        var targetSlot = await _db.RosterSlots.FindAsync(targetSlotId)
            ?? throw new InvalidOperationException("Target slot not found.");

        if (targetSlot.CoachId != targetCoachId)
            throw new InvalidOperationException("Slot does not belong to the target coach.");

        _db.RosterSlots.Remove(targetSlot);

        var newSlot = new RosterSlot { CoachId = stealingCoachId, SlotCode = newSlotCode, PlayerId = targetSlot.PlayerId };
        _db.RosterSlots.Add(newSlot);

        var pick = new DraftPick
        {
            DraftSessionId = draftSessionId,
            CoachId = stealingCoachId,
            PickedPlayerId = targetSlot.PlayerId,
            PlacedSlot = newSlotCode,
            WasSteal = true,
        };
        _db.DraftPicks.Add(pick);

        await _db.SaveChangesAsync();
        await _audit.AppendAsync("Steal", new { draftSessionId, stealingCoachId, targetCoachId, playerId = targetSlot.PlayerId });

        return newSlot;
    }

    // Blind-bid auction for jackpot squads: coaches submit sealed bids, highest wins the pick.
    public async Task<(int WinningCoachId, int Amount)> ResolveAuctionAsync(int draftSessionId, Dictionary<int, int> bidsByCoachId, int playerId, string slotCode)
    {
        if (bidsByCoachId.Count == 0)
            throw new InvalidOperationException("No bids submitted.");

        var winner = bidsByCoachId.OrderByDescending(b => b.Value).First();

        await PickAndPlaceAsync(draftSessionId, winner.Key, playerId, slotCode);
        var slot = await _db.RosterSlots.Where(s => s.CoachId == winner.Key && s.PlayerId == playerId)
            .OrderByDescending(s => s.Id).FirstAsync();
        slot.PlayerId = playerId; // no-op, kept for clarity

        var pick = await _db.DraftPicks.Where(p => p.CoachId == winner.Key && p.PickedPlayerId == playerId)
            .OrderByDescending(p => p.Id).FirstAsync();
        pick.WasAuctionWin = true;
        pick.AuctionBidAmount = winner.Value;
        await _db.SaveChangesAsync();

        await _audit.AppendAsync("AuctionResolved", new { draftSessionId, playerId, winningCoachId = winner.Key, amount = winner.Value, allBids = bidsByCoachId });

        return (winner.Key, winner.Value);
    }

    public async Task<ChemistryCalculator.ChemistryResult> GetChemistryAsync(int coachId)
    {
        var players = await _db.RosterSlots.Where(r => r.CoachId == coachId)
            .Include(r => r.Player).Select(r => r.Player!).ToListAsync();
        return _chemistry.Calculate(players);
    }
}
