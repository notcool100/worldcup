using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;
using WorldCup.Api.Models;

namespace WorldCup.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LobbyController : ControllerBase
{
    private readonly AppDbContext _db;

    public LobbyController(AppDbContext db) => _db = db;

    public record CreateSessionRequest(string HostDisplayName, DraftMode Mode = DraftMode.SnakeDraft, int MaxCoaches = 4);

    [HttpPost("sessions")]
    public async Task<ActionResult<DraftSession>> CreateSession(CreateSessionRequest req)
    {
        var hostCoach = new Coach { DisplayName = req.HostDisplayName };
        var session = new DraftSession { Mode = req.Mode, MaxCoaches = req.MaxCoaches };
        session.Coaches.Add(hostCoach);
        _db.DraftSessions.Add(session);
        await _db.SaveChangesAsync();
        // Set the first turn to the host now that the coach has an ID.
        session.CurrentTurnCoachId = hostCoach.Id;
        await _db.SaveChangesAsync();
        return Ok(session);
    }

    public record JoinSessionRequest(string DisplayName);

    [HttpPost("sessions/{roomCode:guid}/join")]
    public async Task<ActionResult<Coach>> JoinSession(Guid roomCode, JoinSessionRequest req)
    {
        var session = await _db.DraftSessions.Include(s => s.Coaches)
            .FirstOrDefaultAsync(s => s.RoomCode == roomCode);
        if (session is null) return NotFound("Room not found.");
        if (session.Coaches.Count >= session.MaxCoaches) return BadRequest("Room is full.");

        var coach = new Coach { DisplayName = req.DisplayName, DraftSessionId = session.Id };
        _db.Coaches.Add(coach);
        await _db.SaveChangesAsync();
        return Ok(coach);
    }

    [HttpGet("sessions/{id:int}")]
    public async Task<ActionResult<DraftSession>> GetSession(int id)
    {
        var session = await _db.DraftSessions.Include(s => s.Coaches).ThenInclude(c => c.Roster)
            .ThenInclude(r => r.Player)
            .FirstOrDefaultAsync(s => s.Id == id);
        return session is null ? NotFound() : Ok(session);
    }
}
