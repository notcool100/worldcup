interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
}

export default function StatBar({
  label,
  value,
  max = 100,
  color = "#00e87a",
  showValue = true,
}: StatBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "10px",
          color: "rgba(240,244,248,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          minWidth: "28px",
          textAlign: "right",
        }}
      >
        {label}
      </span>
      <div className="stat-bar-track flex-1">
        <div
          className="stat-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showValue && (
        <span
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "rgba(240,244,248,0.7)",
            minWidth: "24px",
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
