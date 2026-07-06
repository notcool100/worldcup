using Microsoft.AspNetCore.SignalR;
using WorldCup.Api.Services;

namespace WorldCup.Api.Hubs;

// Live draft room: all coaches in a session join the same SignalR group and see scouts/
// picks/steals broadcast in real time, matching the "live draft battle" feature.
public class DraftHub : Hub
{
    private readonly DraftService _draftService;

    public DraftHub(DraftService draftService)
    {
        _draftService = draftService;
    }

    public async Task JoinSession(int draftSessionId, int coachId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(draftSessionId));
        await Clients.Group(GroupName(draftSessionId)).SendAsync("CoachJoined", coachId);
    }

    public async Task Scout(int draftSessionId, int coachId)
    {
        var squad = await _draftService.ScoutAsync(draftSessionId, coachId);
        // Only the scouting coach sees their own squad
        await Clients.Caller.SendAsync("SquadScouted", coachId, squad);
        // Everyone else just sees that a scout happened (not which squad)
        await Clients.OthersInGroup(GroupName(draftSessionId))
            .SendAsync("OpponentScouted", coachId, $"{squad.Nation} {squad.Year}");
    }

    public async Task PickAndPlace(int draftSessionId, int coachId, int playerId, string slotCode)
    {
        var (slot, nextCoachId) = await _draftService.PickAndPlaceAsync(draftSessionId, coachId, playerId, slotCode);
        await Clients.Group(GroupName(draftSessionId)).SendAsync("PlayerPlaced", coachId, slot);
        await Clients.Group(GroupName(draftSessionId)).SendAsync("TurnChanged", nextCoachId, 30);
    }

    // Called by the host after successfully creating a tournament via REST.
    // Broadcasts to all coaches in the room so they all navigate to the bracket together.
    public async Task NotifyTournamentStarted(int draftSessionId, int tournamentId)
    {
        await Clients.Group(GroupName(draftSessionId))
            .SendAsync("TournamentStarted", tournamentId);
    }

    public async Task Steal(int draftSessionId, int stealingCoachId, int targetCoachId, int targetSlotId, string newSlotCode)
    {
        var slot = await _draftService.StealAsync(draftSessionId, stealingCoachId, targetCoachId, targetSlotId, newSlotCode);
        await Clients.Group(GroupName(draftSessionId)).SendAsync("PlayerStolen", stealingCoachId, targetCoachId, slot);
    }

    public async Task SubmitAuctionBid(int draftSessionId, int coachId, int playerId, int amount)
    {
        // Bids are collected by the caller (REST/game-loop timer) and resolved via
        // DraftService.ResolveAuctionAsync once the auction window closes; here we just
        // broadcast that a (sealed) bid was placed so others see the countdown tension
        // without seeing the amount.
        await Clients.Group(GroupName(draftSessionId)).SendAsync("BidPlaced", coachId, playerId);
    }

    private static string GroupName(int draftSessionId) => $"draft-{draftSessionId}";
}
