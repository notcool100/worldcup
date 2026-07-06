using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BracketController : ControllerBase
{
    private readonly BracketService _brackets;
    private readonly AppDbContext _db;

    public BracketController(BracketService brackets, AppDbContext db)
    {
        _brackets = brackets;
        _db = db;
    }

    public record StartCupRequest(int DraftSessionId, string TournamentName = "World Cup");

    [HttpPost("start")]
    public async Task<ActionResult<Tournament>> StartCup(StartCupRequest req)
    {
        var session = await _db.DraftSessions.Include(s => s.Coaches)
            .FirstOrDefaultAsync(s => s.Id == req.DraftSessionId);
        if (session is null) return NotFound("Session not found.");

        var coaches = session.Coaches.OrderBy(c => c.Id).ToList();
        if (coaches.Count < 1) return BadRequest("No coaches in session.");

        var pairs = new List<(int, int)>();
        if (coaches.Count == 1)
        {
            // Solo mode: coach plays against themselves so the match engine still runs.
            pairs.Add((coaches[0].Id, coaches[0].Id));
        }
        else
        {
            for (int i = 0; i + 1 < coaches.Count; i += 2)
                pairs.Add((coaches[i].Id, coaches[i + 1].Id));
        }

        var tournament = await _brackets.CreateTournamentAsync(req.TournamentName, pairs, TournamentStage.GroupStage);
        return Ok(tournament);
    }

    [HttpGet("tournaments/{id:int}")]
    public async Task<IActionResult> GetTournament(int id)
    {
        var matches = await _db.BracketMatches
            .Include(b => b.MatchState).ThenInclude(m => m!.Events)
            .Where(b => b.TournamentId == id)
            .OrderBy(b => b.RoundIndex)
            .ToListAsync();
        return Ok(matches);
    }

    [HttpGet("live")]
    public async Task<IActionResult> GetLiveMatches()
    {
        var live = await _brackets.GetLiveMatchesAsync();
        return Ok(live);
    }
}
