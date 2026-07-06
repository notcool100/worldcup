"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  // Don't show nav on the lobby page
  if (pathname === "/") return null;

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6"
      style={{
        height: "52px",
        background: "rgba(5, 11, 18, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span style={{ fontSize: "20px" }}>⚽</span>
        <span
          className="font-rajdhani text-white tracking-widest"
          style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.15em" }}
        >
          DRAFT ARENA
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="font-rajdhani text-sm tracking-widest uppercase transition-colors duration-200"
          style={{
            color: pathname === "/" ? "#00e87a" : "rgba(240,244,248,0.6)",
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          Lobby
        </Link>
        <Link
          href="/spectate"
          className="font-rajdhani text-sm tracking-widest uppercase transition-colors duration-200 flex items-center gap-2"
          style={{
            color: pathname === "/spectate" ? "#00e87a" : "rgba(240,244,248,0.6)",
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#ff3b5c",
              display: "inline-block",
              animation: "livePulse 1.5s ease-in-out infinite",
            }}
          />
          Spectate
        </Link>
      </div>
    </nav>
  );
}
