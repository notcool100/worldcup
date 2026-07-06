using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;

namespace WorldCup.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public LeaderboardController(AppDbContext db) => _db = db;

    // Async ladder: ranked list of coaches by rating, with W/L and best streak, as described
    // in the "async ladder mode" feature.
    [HttpGet]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int take = 50)
    {
        var ranked = await _db.Coaches
            .OrderByDescending(c => c.Rating)
            .Take(take)
            .Select(c => new
            {
                c.Id,
                c.DisplayName,
                c.Rating,
                c.Wins,
                c.Losses,
                c.BestStreak,
            })
            .ToListAsync();

        return Ok(ranked);
    }
}
