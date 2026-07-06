using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;
using WorldCup.Api.Hubs;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.BackgroundServices;

// Drives every in-progress match forward one simulated minute at a time and broadcasts the
// resulting events to both the competing coaches and any spectators in the same SignalR
// group. Runs continuously; a real deployment would likely shard this across workers, but
// for the vertical slice a single loop covering all live matches is enough.
public class MatchTickerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IHubContext<MatchHub> _hub;

    public MatchTickerService(IServiceProvider services, IHubContext<MatchHub> hub)
    {
        _services = services;
        _hub = hub;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var engine = scope.ServiceProvider.GetRequiredService<MatchEngine>();

                // HalfTime is included: TickAsync auto-resumes it into the second half after
                // one tick (see MatchEngine.TickAsync), so it must not be excluded here or
                // the match would stall forever at half-time.
                var liveMatchIds = await db.MatchStates
                    .Where(m => m.Phase != MatchPhase.FullTime)
                    .Select(m => m.Id)
                    .ToListAsync(stoppingToken);

                foreach (var matchId in liveMatchIds)
                {
                    var events = await engine.TickAsync(matchId);
                    if (events.Count > 0)
                        await _hub.Clients.Group($"match-{matchId}").SendAsync("MatchTick", matchId, events, stoppingToken);
                }
            }

            // ~1 simulated minute per real second; tune for pacing (original game is a
            // quick 5-minute run, so a 90-minute match ticking at this rate finishes fast).
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }
}
