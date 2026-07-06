using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WorldCup.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLog",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ActionType = table.Column<string>(type: "text", nullable: false),
                    PayloadJson = table.Column<string>(type: "text", nullable: false),
                    PrevHash = table.Column<string>(type: "text", nullable: false),
                    Hash = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLog", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DraftSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoomCode = table.Column<Guid>(type: "uuid", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    MaxCoaches = table.Column<int>(type: "integer", nullable: false),
                    CurrentTurnCoachId = table.Column<int>(type: "integer", nullable: false),
                    TurnTimeSeconds = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DraftSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MatchStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CoachAId = table.Column<int>(type: "integer", nullable: false),
                    CoachBId = table.Column<int>(type: "integer", nullable: false),
                    Phase = table.Column<int>(type: "integer", nullable: false),
                    Minute = table.Column<int>(type: "integer", nullable: false),
                    ScoreA = table.Column<int>(type: "integer", nullable: false),
                    ScoreB = table.Column<int>(type: "integer", nullable: false),
                    PenaltiesA = table.Column<int>(type: "integer", nullable: false),
                    PenaltiesB = table.Column<int>(type: "integer", nullable: false),
                    TacticA = table.Column<int>(type: "integer", nullable: false),
                    TacticB = table.Column<int>(type: "integer", nullable: false),
                    PossessionA = table.Column<int>(type: "integer", nullable: false),
                    ShotsA = table.Column<int>(type: "integer", nullable: false),
                    ShotsB = table.Column<int>(type: "integer", nullable: false),
                    FoulsA = table.Column<int>(type: "integer", nullable: false),
                    FoulsB = table.Column<int>(type: "integer", nullable: false),
                    SubsRemainingA = table.Column<int>(type: "integer", nullable: false),
                    SubsRemainingB = table.Column<int>(type: "integer", nullable: false),
                    IsSpectatable = table.Column<bool>(type: "boolean", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchStates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NationalSquads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nation = table.Column<string>(type: "text", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Tournament = table.Column<string>(type: "text", nullable: false),
                    IsJackpot = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NationalSquads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tournaments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Stage = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tournaments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Coaches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DisplayName = table.Column<string>(type: "text", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Wins = table.Column<int>(type: "integer", nullable: false),
                    Losses = table.Column<int>(type: "integer", nullable: false),
                    BestStreak = table.Column<int>(type: "integer", nullable: false),
                    DraftSessionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Coaches_DraftSessions_DraftSessionId",
                        column: x => x.DraftSessionId,
                        principalTable: "DraftSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DraftPicks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DraftSessionId = table.Column<int>(type: "integer", nullable: false),
                    CoachId = table.Column<int>(type: "integer", nullable: false),
                    ScoutedSquadId = table.Column<int>(type: "integer", nullable: false),
                    PickedPlayerId = table.Column<int>(type: "integer", nullable: false),
                    PlacedSlot = table.Column<string>(type: "text", nullable: false),
                    WasSteal = table.Column<bool>(type: "boolean", nullable: false),
                    WasAuctionWin = table.Column<bool>(type: "boolean", nullable: false),
                    AuctionBidAmount = table.Column<int>(type: "integer", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DraftPicks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DraftPicks_DraftSessions_DraftSessionId",
                        column: x => x.DraftSessionId,
                        principalTable: "DraftSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatchStateId = table.Column<int>(type: "integer", nullable: false),
                    Minute = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CoachId = table.Column<int>(type: "integer", nullable: true),
                    PlayerId = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchEvents_MatchStates_MatchStateId",
                        column: x => x.MatchStateId,
                        principalTable: "MatchStates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Nation = table.Column<string>(type: "text", nullable: false),
                    Era = table.Column<int>(type: "integer", nullable: false),
                    Position = table.Column<string>(type: "text", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Pace = table.Column<int>(type: "integer", nullable: false),
                    Shooting = table.Column<int>(type: "integer", nullable: false),
                    Passing = table.Column<int>(type: "integer", nullable: false),
                    Defending = table.Column<int>(type: "integer", nullable: false),
                    Physical = table.Column<int>(type: "integer", nullable: false),
                    IsJackpot = table.Column<bool>(type: "boolean", nullable: false),
                    NationalSquadId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Players_NationalSquads_NationalSquadId",
                        column: x => x.NationalSquadId,
                        principalTable: "NationalSquads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BracketMatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TournamentId = table.Column<int>(type: "integer", nullable: false),
                    Stage = table.Column<int>(type: "integer", nullable: false),
                    RoundIndex = table.Column<int>(type: "integer", nullable: false),
                    CoachAId = table.Column<int>(type: "integer", nullable: false),
                    CoachBId = table.Column<int>(type: "integer", nullable: false),
                    WinnerCoachId = table.Column<int>(type: "integer", nullable: true),
                    MatchStateId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BracketMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BracketMatches_MatchStates_MatchStateId",
                        column: x => x.MatchStateId,
                        principalTable: "MatchStates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BracketMatches_Tournaments_TournamentId",
                        column: x => x.TournamentId,
                        principalTable: "Tournaments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RosterSlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CoachId = table.Column<int>(type: "integer", nullable: false),
                    SlotCode = table.Column<string>(type: "text", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    IsSuspended = table.Column<bool>(type: "boolean", nullable: false),
                    IsInjured = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RosterSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RosterSlots_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RosterSlots_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_Timestamp",
                table: "AuditLog",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_BracketMatches_MatchStateId",
                table: "BracketMatches",
                column: "MatchStateId");

            migrationBuilder.CreateIndex(
                name: "IX_BracketMatches_TournamentId",
                table: "BracketMatches",
                column: "TournamentId");

            migrationBuilder.CreateIndex(
                name: "IX_Coaches_DraftSessionId",
                table: "Coaches",
                column: "DraftSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_DraftPicks_DraftSessionId",
                table: "DraftPicks",
                column: "DraftSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchEvents_MatchStateId",
                table: "MatchEvents",
                column: "MatchStateId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_NationalSquadId",
                table: "Players",
                column: "NationalSquadId");

            migrationBuilder.CreateIndex(
                name: "IX_RosterSlots_CoachId",
                table: "RosterSlots",
                column: "CoachId");

            migrationBuilder.CreateIndex(
                name: "IX_RosterSlots_PlayerId",
                table: "RosterSlots",
                column: "PlayerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLog");

            migrationBuilder.DropTable(
                name: "BracketMatches");

            migrationBuilder.DropTable(
                name: "DraftPicks");

            migrationBuilder.DropTable(
                name: "MatchEvents");

            migrationBuilder.DropTable(
                name: "RosterSlots");

            migrationBuilder.DropTable(
                name: "Tournaments");

            migrationBuilder.DropTable(
                name: "MatchStates");

            migrationBuilder.DropTable(
                name: "Coaches");

            migrationBuilder.DropTable(
                name: "Players");

            migrationBuilder.DropTable(
                name: "DraftSessions");

            migrationBuilder.DropTable(
                name: "NationalSquads");
        }
    }
}
