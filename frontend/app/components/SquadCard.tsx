import type { NationalSquad } from "@/lib/types";

interface SquadCardProps {
  squad: NationalSquad;
  onScout?: () => void;
  canScout?: boolean;
  revealed?: boolean;
}

export default function SquadCard({
  squad,
  onScout,
  canScout = false,
  revealed = false,
}: SquadCardProps) {
  const avgRating =
    squad.players.length > 0
      ? Math.round(squad.players.reduce((s, p) => s + p.rating, 0) / squad.players.length)
      : null;

  return (
    <div
      className={squad.isJackpot ? "gold-border" : "glass"}
      style={{
        padding: "16px",
        position: "relative",
        background: squad.isJackpot
          ? "rgba(245, 163, 42, 0.05)"
          : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {squad.isJackpot && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "10px",
            fontWeight: 700,
            color: "#f5a32a",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            background: "rgba(245,163,42,0.15)",
            padding: "2px 8px",
            borderRadius: "4px",
            border: "1px solid rgba(245,163,42,0.3)",
          }}
        >
          ★ Jackpot
        </div>
      )}

      {/* Nation & year */}
      <div
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: "18px",
          fontWeight: 700,
          color: "#f0f4f8",
          marginBottom: "2px",
          paddingRight: squad.isJackpot ? "60px" : "0",
        }}
      >
        {squad.nation}
      </div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          color: "rgba(240,244,248,0.5)",
          marginBottom: "12px",
        }}
      >
        {squad.year} · {squad.tournament}
      </div>

      {/* Rating */}
      {avgRating !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          <span
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "20px",
              fontWeight: 700,
              color: squad.isJackpot ? "#f5a32a" : "#f0f4f8",
            }}
          >
            {avgRating}
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              color: "rgba(240,244,248,0.4)",
            }}
          >
            AVG
          </span>
        </div>
      )}

      {/* Scout button */}
      {!revealed && onScout && (
        <button
          onClick={onScout}
          disabled={!canScout}
          style={{
            width: "100%",
            padding: "9px",
            background: canScout
              ? squad.isJackpot
                ? "rgba(245,163,42,0.15)"
                : "rgba(0, 232, 122, 0.1)"
              : "rgba(255,255,255,0.04)",
            border: canScout
              ? squad.isJackpot
                ? "1px solid rgba(245,163,42,0.4)"
                : "1px solid rgba(0, 232, 122, 0.35)"
              : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "7px",
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: canScout
              ? squad.isJackpot
                ? "#f5a32a"
                : "#00e87a"
              : "rgba(240,244,248,0.3)",
            cursor: canScout ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            boxShadow:
              canScout
                ? squad.isJackpot
                  ? "0 0 12px rgba(245,163,42,0.2)"
                  : "0 0 12px rgba(0,232,122,0.2)"
                : "none",
          }}
        >
          SCOUT
        </button>
      )}

      {revealed && (
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "#00e87a",
            textAlign: "center",
            paddingTop: "4px",
          }}
        >
          ✓ Scouted
        </div>
      )}
    </div>
  );
}
