interface CountdownTimerProps {
  seconds: number;
}

export default function CountdownTimer({ seconds }: CountdownTimerProps) {
  const isRed = seconds <= 5;
  const isAmber = seconds > 5 && seconds <= 10;

  const color = isRed ? "#ff3b5c" : isAmber ? "#f5a32a" : "#f0f4f8";
  const shouldPulse = isRed;

  return (
    <div
      style={{
        fontFamily: "Orbitron, monospace",
        fontSize: "36px",
        fontWeight: 700,
        color,
        lineHeight: 1,
        transition: "color 0.3s ease",
        animation: shouldPulse ? "timerPulse 0.6s ease-in-out infinite" : "none",
        textShadow: isRed
          ? "0 0 20px rgba(255,59,92,0.6)"
          : isAmber
          ? "0 0 20px rgba(245,163,42,0.4)"
          : "none",
        letterSpacing: "0.05em",
        minWidth: "60px",
        textAlign: "center",
      }}
    >
      {String(seconds).padStart(2, "0")}
    </div>
  );
}
