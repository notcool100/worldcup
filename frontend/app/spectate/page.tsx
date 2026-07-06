"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/signalr";
import type { BracketMatch } from "@/lib/types";
import LiveBadge from "@/app/components/LiveBadge";
import Link from "next/link";

export default function SpectatePage() {
  const [live, setLive] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const poll = () =>
      apiGet<BracketMatch[]>("/api/bracket/live")
        .then((data) => {
          setLive(data);
          setLoading(false);
        })
        .catch(() => { setLoading(false); });
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", padding: "24px 20px" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          animation: "fadeIn 0.5s ease-out",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "36px",
              fontWeight: 700,
              color: "#f0f4f8",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            LIVE NOW
            <LiveBadge />
            {live.length > 0 && (
              <span
                style={{
                  fontFamily: "Orbitron, monospace",
                  fontSize: "16px",
                  background: "rgba(255,59,92,0.15)",
                  border: "1px solid rgba(255,59,92,0.3)",
                  color: "#ff3b5c",
                  borderRadius: "6px",
                  padding: "2px 10px",
                }}
              >
                {live.length}
              </span>
            )}
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "rgba(240,244,248,0.45)",
              marginTop: "4px",
            }}
          >
            All matches currently being played, across every room.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid rgba(0,232,122,0.2)",
              borderTopColor: "#00e87a",
              borderRadius: "50%",
              animation: "spinSlow 1s linear infinite",
            }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && live.length === 0 && (
        <div
          className="glass"
          style={{
            padding: "80px 40px",
            textAlign: "center",
            animation: "fadeIn 0.5s ease-out",
          }}
        >
          {/* Stadium SVG illustration */}
          <div style={{ marginBottom: "24px" }}>
            <svg
              width="120"
              height="80"
              viewBox="0 0 120 80"
              style={{ opacity: 0.2 }}
            >
              {/* Simple stadium outline */}
              <ellipse cx="60" cy="50" rx="55" ry="25" fill="none" stroke="#f0f4f8" strokeWidth="1.5" />
              <ellipse cx="60" cy="50" rx="35" ry="16" fill="none" stroke="#f0f4f8" strokeWidth="1" />
              <ellipse cx="60" cy="50" rx="15" ry="7" fill="none" stroke="#f0f4f8" strokeWidth="0.8" />
              {/* Flood lights */}
              <line x1="10" y1="50" x2="5" y2="10" stroke="#f0f4f8" strokeWidth="1" />
              <line x1="110" y1="50" x2="115" y2="10" stroke="#f0f4f8" strokeWidth="1" />
              <circle cx="5" cy="9" r="3" fill="#f5a32a" opacity="0.6" />
              <circle cx="115" cy="9" r="3" fill="#f5a32a" opacity="0.6" />
            </svg>
          </div>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "rgba(240,244,248,0.4)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            No Matches in Progress
          </div>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "rgba(240,244,248,0.25)",
              maxWidth: "280px",
              margin: "0 auto 24px",
            }}
          >
            The arena is quiet right now. Check back soon or start a draft room.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "rgba(0,232,122,0.1)",
              border: "1px solid rgba(0,232,122,0.25)",
              borderRadius: "8px",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "#00e87a",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
            }}
          >
            GO TO LOBBY →
          </Link>
        </div>
      )}

      {/* Match grid */}
      {!loading && live.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px",
            animation: "fadeIn 0.4s ease-out",
          }}
        >
          {live.map((match) => {
            const isMatchLive =
              match.matchState?.phase === "FirstHalf" ||
              match.matchState?.phase === "SecondHalf" ||
              match.matchState?.phase === "ExtraTime";
            const possA = match.matchState?.possessionA ?? 50;
            const possB = 100 - possA;

            return (
              <div
                key={match.id}
                className="glass"
                style={{
                  padding: "20px",
                  borderLeft: isMatchLive ? "2px solid #00e87a" : "2px solid transparent",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  animation: "slideIn 0.3s ease-out",
                }}
              >
                {/* Match header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Rajdhani, sans-serif",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "rgba(240,244,248,0.35)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    {match.stage.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  {isMatchLive ? (
                    <LiveBadge />
                  ) : (
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "11px",
                        color: "rgba(240,244,248,0.3)",
                      }}
                    >
                      {match.matchState?.phase ?? "Scheduled"}
                    </span>
                  )}
                </div>

                {/* Mini scoreboard */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  {/* Team A */}
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#f0f4f8",
                        marginBottom: "2px",
                      }}
                    >
                      Coach {match.coachAId}
                    </div>
                    {match.matchState && (
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          color: "rgba(240,244,248,0.4)",
                        }}
                      >
                        {possA}% poss
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "Orbitron, monospace",
                        fontSize: "28px",
                        fontWeight: 700,
                        color: "#f0f4f8",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {match.matchState
                        ? `${match.matchState.scoreA} — ${match.matchState.scoreB}`
                        : "— —"}
                    </div>
                    {match.matchState && (
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "10px",
                          color: isMatchLive ? "#00e87a" : "rgba(240,244,248,0.35)",
                          marginTop: "3px",
                        }}
                      >
                        {match.matchState.phase === "FirstHalf"
                          ? "1st Half"
                          : match.matchState.phase === "SecondHalf"
                          ? "2nd Half"
                          : match.matchState.phase}{" "}
                        · {match.matchState.minute}&apos;
                      </div>
                    )}
                  </div>

                  {/* Team B */}
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#f0f4f8",
                        marginBottom: "2px",
                      }}
                    >
                      Coach {match.coachBId}
                    </div>
                    {match.matchState && (
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          color: "rgba(240,244,248,0.4)",
                        }}
                      >
                        {possB}% poss
                      </div>
                    )}
                  </div>
                </div>

                {/* Possession bar */}
                {match.matchState && (
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "2px",
                        overflow: "hidden",
                        background: "rgba(77, 159, 255, 0.25)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${possA}%`,
                          background: "#00e87a",
                          borderRadius: "2px 0 0 2px",
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Watch button */}
                <Link
                  href={`/match/${match.matchStateId}?spectator=1`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px",
                    background: isMatchLive
                      ? "rgba(0, 232, 122, 0.1)"
                      : "rgba(255,255,255,0.04)",
                    border: isMatchLive
                      ? "1px solid rgba(0, 232, 122, 0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    fontFamily: "Rajdhani, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: isMatchLive ? "#00e87a" : "rgba(240,244,248,0.6)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isMatchLive ? "▶ WATCH LIVE" : "VIEW MATCH"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
