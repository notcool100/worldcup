import type { RosterSlot } from "@/lib/types";

interface FormationSlot {
  code: string;
  x: number;
  y: number;
}

interface FormationPitchProps {
  slots: FormationSlot[];
  roster: RosterSlot[];
  selectedSlotCode?: string | null;
  onSlotClick?: (code: string) => void;
  canPlace?: boolean;
}

export default function FormationPitch({
  slots,
  roster,
  selectedSlotCode,
  onSlotClick,
  canPlace = false,
}: FormationPitchProps) {
  return (
    <div
      className="pitch-container"
      style={{ paddingBottom: "62%", position: "relative", minHeight: "300px" }}
    >
      {/* Pitch SVG background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #0d3d1a 0%, #0f4a1f 50%, #0d3d1a 100%)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Pitch stripes */}
          {Array.from({ length: 7 }).map((_, i) => (
            <rect
              key={i}
              x={i * 57}
              y={0}
              width={57}
              height={260}
              fill={i % 2 === 0 ? "rgba(0,0,0,0.1)" : "transparent"}
            />
          ))}

          {/* Outer border */}
          <rect x="10" y="8" width="380" height="244" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

          {/* Halfway line */}
          <line x1="10" y1="130" x2="390" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Center circle */}
          <circle cx="200" cy="130" r="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <circle cx="200" cy="130" r="2" fill="rgba(255,255,255,0.3)" />

          {/* Top penalty box */}
          <rect x="110" y="8" width="180" height="50" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          {/* Top 6-yard box */}
          <rect x="155" y="8" width="90" height="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

          {/* Bottom penalty box */}
          <rect x="110" y="202" width="180" height="50" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          {/* Bottom 6-yard box */}
          <rect x="155" y="232" width="90" height="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

          {/* Corner arcs */}
          <path d="M 10 8 Q 18 8 18 16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <path d="M 390 8 Q 382 8 382 16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <path d="M 10 252 Q 18 252 18 244" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <path d="M 390 252 Q 382 252 382 244" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        </svg>

        {/* Player slots */}
        {slots.map((slot) => {
          const filled = roster.find((r) => r.slotCode === slot.code);
          const isClickable = canPlace && !filled;

          return (
            <div
              key={slot.code}
              className="pitch-slot"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
              }}
              onClick={() => isClickable && onSlotClick?.(slot.code)}
            >
              <div
                className={`pitch-slot-circle ${
                  filled
                    ? "pitch-slot-filled"
                    : isClickable
                    ? "pitch-slot-empty pitch-slot-clickable"
                    : "pitch-slot-empty"
                }`}
              >
                {filled ? (
                  <div style={{ textAlign: "center", padding: "2px" }}>
                    <div
                      style={{
                        fontFamily: "Orbitron, monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#00e87a",
                      }}
                    >
                      {filled.player?.rating ?? "?"}
                    </div>
                  </div>
                ) : (
                  <span
                    style={{
                      fontFamily: "Rajdhani, sans-serif",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {slot.code}
                  </span>
                )}
              </div>
              <span className="pitch-slot-label">
                {filled ? (filled.player?.name?.split(" ").pop() ?? slot.code) : slot.code}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
