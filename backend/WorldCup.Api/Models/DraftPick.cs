namespace WorldCup.Api.Models;

// One "scout -> pick -> place" action, recorded for replay + audit chain hashing.
public class DraftPick
{
    public int Id { get; set; }
    public int DraftSessionId { get; set; }
    public int CoachId { get; set; }
    public int ScoutedSquadId { get; set; }
    public int PickedPlayerId { get; set; }
    public string PlacedSlot { get; set; } = ""; // formation slot code, e.g. "ST", "CAM", "LB"
    public bool WasSteal { get; set; } // true if picked via steal-from-rival ability
    public bool WasAuctionWin { get; set; }
    public int? AuctionBidAmount { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
