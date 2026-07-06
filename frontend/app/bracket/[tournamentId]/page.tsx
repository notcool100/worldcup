"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/signalr";
import type { BracketMatch, Tournament } from "@/lib/types";
import LiveBadge from "@/app/components/LiveBadge";
import Link from "next/link";

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    GroupStage: "GROUP STAGE",
    RoundOf16: "ROUND OF 16",
    QuarterFinal: "QUARTER-FINAL",
    SemiFinal: "SEMI-FINAL",
    Final: "FINAL",
  };
  return labels[stage] ?? stage.toUpperCase();
}

function groupByStage(matches: BracketMatch[]): Record<string, BracketMatch[]> {
  const order = ["GroupStage", "RoundOf16", "QuarterFinal", "SemiFinal", "Final"];
  const grouped: Record<string, BracketMatch[]> = {};
  matches.forEach((m) => {
    if (!grouped[m.stage]) grouped[m.stage] = [];
    grouped[m.stage].push(m);
  });
  // Return in order
  const result: Record<string, BracketMatch[]> = {};
  order.forEach((s) => { if (grouped[s]) result[s] = grouped[s]; });
  Object.keys(grouped).forEach((s) => { if (!result[s]) result[s] = grouped[s]; });
  return result;
}

export default function BracketPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = params.tournamentId;
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [myCoachId, setMyCoachId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("myCoachId");
      if (saved) setMyCoachId(Number(saved));
    }
  }, []);

  useEffect(() => {
    const poll = () =>
      apiGet<BracketMatch[]>(`/api/bracket/tournaments/${tournamentId}`)
        .then(setMatches)
        .catch(() => {});
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [tournamentId]);

  const grouped = groupByStage(matches);
  const stages = Object.keys(grouped);

  return (
    <div style={{ minHeight: "100vh", padding: "24px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px", animation: "fadeIn 0.5s ease-out" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "rgba(240,244,248,0.4)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Tournament #{params.tournamentId}
        </div>
        <h1
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "36px",
            fontWeight: 700,
            color: "#f0f4f8",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Summer Cup
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "rgba(240,244,248,0.45)",
          }}
        >
          Group stage into knockouts. Aim for a perfect 7-0 run.
        </p>
      </div>

      {matches.length === 0 ? (
        /* Empty state */
        <div
          className="glass"
          style={{
            padding: "60px 40px",
            textAlign: "center",
            animation: "fadeIn 0.5s ease-out",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>🏆</div>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "rgba(240,244,248,0.5)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            No Matches Scheduled
          </div>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "rgba(240,244,248,0.3)",
            }}
          >
            Tournament matches will appear here once the draft phase is complete.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          {/* Bracket visualization */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              minWidth: `${stages.length * 240}px`,
              paddingBottom: "16px",
            }}
          >
            {stages.map((stage) => (
              <div
                key={stage}
                className="bracket-column"
                style={{ flex: "0 0 220px" }}
              >
                {/* Stage header */}
                <div
                  style={{
                    fontFamily: "Rajdhani, sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#00e87a",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(0,232,122,0.2)",
                  }}
                >
                  {stageLabel(stage)}
                </div>

                {/* Match cards */}
                {grouped[stage].map((match) => {
                  const isMatchLive =
                    match.matchState?.phase === "FirstHalf" ||
                    match.matchState?.phase === "SecondHalf" ||
                    match.matchState?.phase === "ExtraTime";
                  const hasWinner = !!match.winnerCoachId;
                  const winnerA = match.winnerCoachId === match.coachAId;
                  const winnerB = match.winnerCoachId === match.coachBId;

                  return (
                    <div
                      key={match.id}
                      className="bracket-match glass"
                      style={{
                        padding: "14px",
                        marginBottom: "12px",
                        borderLeft: isMatchLive
                          ? "2px solid #00e87a"
                          : hasWinner
                          ? "2px solid rgba(245,163,42,0.4)"
                          : "2px solid transparent",
                      }}
                    >
                      {/* Match header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            color: "rgba(240,244,248,0.35)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Match #{match.id}
                        </span>
                        {isMatchLive ? (
                          <LiveBadge />
                        ) : hasWinner ? (
                          <span
                            style={{
                              fontFamily: "Rajdhani, sans-serif",
                              fontSize: "10px",
                              color: "#f5a32a",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            FT
                          </span>
                        ) : null}
                      </div>

                      {/* Coach A */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          background: winnerA ? "rgba(245,163,42,0.1)" : "transparent",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Rajdhani, sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: winnerA ? "#f5a32a" : "#f0f4f8",
                          }}
                        >
                          {winnerA && "★ "}Coach {match.coachAId}
                        </span>
                        {match.matchState && (
                          <span
                            style={{
                              fontFamily: "Orbitron, monospace",
                              fontSize: "16px",
                              fontWeight: 700,
                              color: winnerA ? "#f5a32a" : "#f0f4f8",
                            }}
                          >
                            {match.matchState.scoreA}
                          </span>
                        )}
                      </div>

                      {/* Coach B */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          background: winnerB ? "rgba(245,163,42,0.1)" : "transparent",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Rajdhani, sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: winnerB ? "#f5a32a" : "#f0f4f8",
                          }}
                        >
                          {winnerB && "★ "}Coach {match.coachBId}
                        </span>
                        {match.matchState && (
                          <span
                            style={{
                              fontFamily: "Orbitron, monospace",
                              fontSize: "16px",
                              fontWeight: 700,
                              color: winnerB ? "#f5a32a" : "#f0f4f8",
                            }}
                          >
                            {match.matchState.scoreB}
                          </span>
                        )}
                      </div>

                      {/* Match info */}
                      {match.matchState && (
                        <div
                          style={{
                            marginTop: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "10px",
                              color: "rgba(240,244,248,0.35)",
                            }}
                          >
                            {match.matchState.phase === "FirstHalf"
                              ? "1st Half"
                              : match.matchState.phase === "SecondHalf"
                              ? "2nd Half"
                              : match.matchState.phase}
                            {" "}· {match.matchState.minute}&apos;
                          </span>
                          {(() => {
                            const isMyMatch = myCoachId !== null &&
                              (match.coachAId === myCoachId || match.coachBId === myCoachId);
                            const href = isMyMatch
                              ? `/match/${match.matchStateId}?coachId=${myCoachId}`
                              : `/match/${match.matchStateId}?spectator=1`;
                            return (
                              <Link
                                href={href}
                                style={{
                                  fontFamily: "Rajdhani, sans-serif",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: isMyMatch ? "#050b12" : "#00e87a",
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  padding: "4px 10px",
                                  background: isMyMatch ? "#00e87a" : "rgba(0,232,122,0.08)",
                                  border: `1px solid ${isMyMatch ? "#00e87a" : "rgba(0,232,122,0.2)"}`,
                                  borderRadius: "4px",
                                  transition: "all 0.15s ease",
                                  boxShadow: isMyMatch ? "0 0 12px rgba(0,232,122,0.4)" : "none",
                                }}
                              >
                                {isMyMatch ? "▶ PLAY" : "WATCH"}
                              </Link>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
