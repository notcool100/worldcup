using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;

namespace WorldCup.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchController : ControllerBase
{
    private readonly AppDbContext _db;

    public MatchController(AppDbContext db) => _db = db;

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetMatch(int id)
    {
        var match = await _db.MatchStates
            .Include(m => m.Events)
            .FirstOrDefaultAsync(m => m.Id == id);
        return match is null ? NotFound() : Ok(match);
    }

    [HttpGet("{id:int}/rosters")]
    public async Task<IActionResult> GetRosters(int id)
    {
        var match = await _db.MatchStates.FirstOrDefaultAsync(m => m.Id == id);
        if (match is null) return NotFound();

        var coachA = await _db.RosterSlots.Include(r => r.Player)
            .Where(r => r.CoachId == match.CoachAId).ToListAsync();
        var coachB = await _db.RosterSlots.Include(r => r.Player)
            .Where(r => r.CoachId == match.CoachBId).ToListAsync();

        return Ok(new { coachA, coachB });
    }
}
