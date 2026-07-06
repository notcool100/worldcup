import type { Player } from "@/lib/types";
import StatBar from "./StatBar";

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

function getPositionGroup(pos: string): string {
  if (pos === "GK") return "GK";
  if (["CB", "LB", "RB", "CB1", "CB2"].some((p) => pos.startsWith(p) || pos === p)) return "DEF";
  if (["CM", "CDM", "CAM", "LM", "RM"].some((p) => pos.startsWith(p) || pos === p)) return "MID";
  return "ATT";
}

export default function PlayerCard({
  player,
  selected = false,
  compact = false,
  onClick,
}: PlayerCardProps) {
  const posGroup = getPositionGroup(player.position);

  if (compact) {
    return (
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          background: selected
            ? "rgba(0, 232, 122, 0.1)"
            : "rgba(255,255,255,0.04)",
          border: selected
            ? "1px solid #00e87a"
            : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          transition: "all 0.15s ease",
          boxShadow: selected ? "0 0 12px rgba(0,232,122,0.25)" : "none",
        }}
      >
        {/* Rating */}
        <span
          style={{
            fontFamily: "Orbitron, monospace",
            fontSize: "15px",
            fontWeight: 700,
            color: player.isJackpot ? "#f5a32a" : "#f0f4f8",
            minWidth: "28px",
          }}
        >
          {player.rating}
        </span>

        {/* Name */}
        <span
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#f0f4f8",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
          {player.isJackpot && " ★"}
        </span>

        {/* Position badge */}
        <span
          className={`pos-${posGroup}`}
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {player.position}
        </span>
      </button>
    );
  }

  // Full card
  return (
    <div
      onClick={onClick}
      style={{
        background: selected
          ? "rgba(0, 232, 122, 0.08)"
          : player.isJackpot
          ? "rgba(245, 163, 42, 0.05)"
          : "rgba(255,255,255,0.04)",
        border: selected
          ? "1px solid #00e87a"
          : player.isJackpot
          ? "1px solid rgba(245,163,42,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "14px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        boxShadow: selected
          ? "0 0 16px rgba(0,232,122,0.2)"
          : player.isJackpot
          ? "0 0 12px rgba(245,163,42,0.15)"
          : "none",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span
          style={{
            fontFamily: "Orbitron, monospace",
            fontSize: "22px",
            fontWeight: 700,
            color: player.isJackpot ? "#f5a32a" : "#f0f4f8",
            lineHeight: 1,
          }}
        >
          {player.rating}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              color: "#f0f4f8",
              lineHeight: 1.2,
            }}
          >
            {player.name}
            {player.isJackpot && (
              <span style={{ color: "#f5a32a", marginLeft: "4px" }}>★</span>
            )}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(240,244,248,0.45)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {player.nation}
          </div>
        </div>
        <span
          className={`pos-${posGroup}`}
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 7px",
            borderRadius: "4px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {player.position}
        </span>
      </div>

      {/* Stat bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <StatBar label="PAC" value={player.pace} color="#00e87a" />
        <StatBar label="SHO" value={player.shooting} color="#f5a32a" />
        <StatBar label="PAS" value={player.passing} color="#4d9fff" />
        <StatBar label="DEF" value={player.defending} color="#ff3b5c" />
        <StatBar label="PHY" value={player.physical} color="#a78bfa" />
      </div>
    </div>
  );
}
