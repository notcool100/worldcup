namespace WorldCup.Api.Models;

// Append-only, hash-chained ledger entry. See AuditChainService for the chaining scheme
// and README.md ("On the blockchain requirement") for why this replaces an actual blockchain.
public class AuditLogEntry
{
    public long Id { get; set; }
    public string ActionType { get; set; } = ""; // "DraftPick", "Substitution", "TacticChange", "MatchResult", ...
    public string PayloadJson { get; set; } = "";
    public string PrevHash { get; set; } = "";
    public string Hash { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
