using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Models;

namespace WorldCup.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Player> Players => Set<Player>();
    public DbSet<NationalSquad> NationalSquads => Set<NationalSquad>();
    public DbSet<DraftSession> DraftSessions => Set<DraftSession>();
    public DbSet<Coach> Coaches => Set<Coach>();
    public DbSet<DraftPick> DraftPicks => Set<DraftPick>();
    public DbSet<RosterSlot> RosterSlots => Set<RosterSlot>();
    public DbSet<Tournament> Tournaments => Set<Tournament>();
    public DbSet<BracketMatch> BracketMatches => Set<BracketMatch>();
    public DbSet<MatchState> MatchStates => Set<MatchState>();
    public DbSet<MatchEvent> MatchEvents => Set<MatchEvent>();
    public DbSet<AuditLogEntry> AuditLog => Set<AuditLogEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NationalSquad>()
            .HasMany(s => s.Players)
            .WithOne(p => p.NationalSquad)
            .HasForeignKey(p => p.NationalSquadId);

        modelBuilder.Entity<DraftSession>()
            .HasMany(d => d.Coaches)
            .WithOne(c => c.DraftSession)
            .HasForeignKey(c => c.DraftSessionId);

        modelBuilder.Entity<Coach>()
            .HasMany(c => c.Roster)
            .WithOne(r => r.Coach)
            .HasForeignKey(r => r.CoachId);

        modelBuilder.Entity<MatchState>()
            .HasMany(m => m.Events)
            .WithOne()
            .HasForeignKey(e => e.MatchStateId);

        // Audit log must be strictly append-only at the app layer; DB-level protection
        // (a trigger revoking UPDATE/DELETE) is documented in Data/audit_protect.sql.
        modelBuilder.Entity<AuditLogEntry>()
            .HasIndex(a => a.Timestamp);
    }
}
