interface LiveBadgeProps {
  className?: string;
}

export default function LiveBadge({ className = "" }: LiveBadgeProps) {
  return (
    <span className={`live-badge ${className}`}>
      <span className="live-dot" />
      LIVE
    </span>
  );
}
