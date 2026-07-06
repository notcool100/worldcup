using Microsoft.AspNetCore.SignalR;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Hubs;

// Live match room. Both competing coaches AND any number of spectating coaches (per the
// "coach should be able to see other ongoing matches" feature) join the same group and
// receive identical tick broadcasts; only the two competing coaches are allowed to send
// tactic/sub commands, everyone else is read-only.
public class MatchHub : Hub
{
    private readonly MatchEngine _matchEngine;
    private readonly BracketService _brackets;

    public MatchHub(MatchEngine matchEngine, BracketService brackets)
    {
        _matchEngine = matchEngine;
        _brackets = brackets;
    }

    public async Task JoinMatch(int matchId, int coachId, bool isSpectator)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(matchId));
        await Clients.Group(GroupName(matchId)).SendAsync("ViewerJoined", coachId, isSpectator);
    }

    // Called by a server-side timer/background loop (one per live match), not directly by
    // clients - kept public here so a hosted service can invoke it via IHubContext.
    public async Task BroadcastTick(int matchId, List<MatchEvent> newEvents)
    {
        await Clients.Group(GroupName(matchId)).SendAsync("MatchTick", matchId, newEvents);
    }

    public async Task ChangeTactic(int matchId, int coachId, Tactic tactic)
    {
        await _matchEngine.ChangeTacticAsync(matchId, coachId, tactic);
        await Clients.Group(GroupName(matchId)).SendAsync("TacticChanged", coachId, tactic);
    }

    public async Task Substitute(int matchId, int coachId, int outPlayerId, int inPlayerId)
    {
        await _matchEngine.SubstituteAsync(matchId, coachId, outPlayerId, inPlayerId);
        await Clients.Group(GroupName(matchId)).SendAsync("SubstitutionMade", coachId, outPlayerId, inPlayerId);
    }

    // Spectator-only: browse all currently live matches without joining one yet.
    public async Task RequestLiveMatchList()
    {
        var live = await _brackets.GetLiveMatchesAsync();
        await Clients.Caller.SendAsync("LiveMatchList", live);
    }

    private static string GroupName(int matchId) => $"match-{matchId}";
}
