import type { MatchEvent } from "@/lib/types";

interface MatchEventRowProps {
  event: MatchEvent;
  isNew?: boolean;
}

function getEventIcon(type: string): string {
  switch (type.toLowerCase()) {
    case "goal": return "⚽";
    case "yellowcard": return "🟨";
    case "redcard": return "🟥";
    case "injury": return "🤕";
    case "substitution": return "↕";
    case "penaltygoal": return "⚽";
    case "miss": return "💨";
    default: return "•";
  }
}

function isGoalEvent(type: string): boolean {
  return type.toLowerCase() === "goal" || type.toLowerCase() === "penaltygoal";
}

export default function MatchEventRow({ event, isNew = false }: MatchEventRowProps) {
  const isGoal = isGoalEvent(event.type);

  return (
    <div
      className={isNew ? "event-slide-in" : ""}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "8px",
        background: isGoal
          ? "rgba(0, 232, 122, 0.12)"
          : "rgba(255,255,255,0.03)",
        border: isGoal
          ? "1px solid rgba(0, 232, 122, 0.25)"
          : "1px solid transparent",
        marginBottom: "6px",
        transition: "background 0.3s ease",
        boxShadow: isGoal ? "0 0 16px rgba(0, 232, 122, 0.15)" : "none",
      }}
    >
      {/* Minute badge */}
      <span
        style={{
          fontFamily: "Orbitron, monospace",
          fontSize: "11px",
          fontWeight: 700,
          color: isGoal ? "#00e87a" : "rgba(240,244,248,0.4)",
          minWidth: "28px",
          textAlign: "right",
        }}
      >
        {event.minute}&apos;
      </span>

      {/* Icon */}
      <span style={{ fontSize: "14px", minWidth: "18px", textAlign: "center" }}>
        {getEventIcon(event.type)}
      </span>

      {/* Description */}
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          color: isGoal ? "#f0f4f8" : "rgba(240,244,248,0.7)",
          flex: 1,
          fontWeight: isGoal ? 500 : 400,
        }}
      >
        {event.description}
      </span>
    </div>
  );
}
