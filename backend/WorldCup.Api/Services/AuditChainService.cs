using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Data;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

// Implements a SHA-256 hash-chained, append-only ledger in Postgres. This is the practical
// substitute for "put it on a blockchain": every action's hash depends on the previous
// action's hash, so editing any historical row breaks every hash after it. Verification is
// O(n) and instant, no consensus/gas/latency involved - safe to call on the live match path.
public class AuditChainService
{
    private readonly AppDbContext _db;

    public AuditChainService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AuditLogEntry> AppendAsync(string actionType, object payload)
    {
        var last = await _db.AuditLog.OrderByDescending(a => a.Id).FirstOrDefaultAsync();
        var prevHash = last?.Hash ?? "GENESIS";
        var payloadJson = JsonSerializer.Serialize(payload);
        var timestamp = DateTime.UtcNow;

        var hash = ComputeHash(prevHash, actionType, payloadJson, timestamp);

        var entry = new AuditLogEntry
        {
            ActionType = actionType,
            PayloadJson = payloadJson,
            PrevHash = prevHash,
            Hash = hash,
            Timestamp = timestamp,
        };

        _db.AuditLog.Add(entry);
        await _db.SaveChangesAsync();
        return entry;
    }

    public async Task<(bool Valid, long? FirstBrokenId)> VerifyChainAsync()
    {
        var entries = await _db.AuditLog.OrderBy(a => a.Id).ToListAsync();
        string expectedPrev = "GENESIS";

        foreach (var entry in entries)
        {
            if (entry.PrevHash != expectedPrev)
                return (false, entry.Id);

            var recomputed = ComputeHash(entry.PrevHash, entry.ActionType, entry.PayloadJson, entry.Timestamp);
            if (recomputed != entry.Hash)
                return (false, entry.Id);

            expectedPrev = entry.Hash;
        }

        return (true, null);
    }

    private static string ComputeHash(string prevHash, string actionType, string payloadJson, DateTime timestamp)
    {
        var raw = $"{prevHash}|{actionType}|{payloadJson}|{timestamp:O}";
        var bytes = Encoding.UTF8.GetBytes(raw);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes);
    }
}
