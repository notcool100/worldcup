"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchState } from "@/lib/types";

interface ScoreBoardProps {
  state: MatchState | null;
  coachAName?: string;
  coachBName?: string;
}

export default function ScoreBoard({
  state,
  coachAName = "Coach A",
  coachBName = "Coach B",
}: ScoreBoardProps) {
  const prevScoreA = useRef<number>(0);
  const prevScoreB = useRef<number>(0);
  const [animA, setAnimA] = useState(false);
  const [animB, setAnimB] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.scoreA !== prevScoreA.current) {
      setAnimA(true);
      const t = setTimeout(() => setAnimA(false), 600);
      prevScoreA.current = state.scoreA;
      return () => clearTimeout(t);
    }
  }, [state?.scoreA]);

  useEffect(() => {
    if (!state) return;
    if (state.scoreB !== prevScoreB.current) {
      setAnimB(true);
      const t = setTimeout(() => setAnimB(false), 600);
      prevScoreB.current = state.scoreB;
      return () => clearTimeout(t);
    }
  }, [state?.scoreB]);

  const scoreA = state?.scoreA ?? 0;
  const scoreB = state?.scoreB ?? 0;
  const phase = state?.phase ?? "PreMatch";
  const minute = state?.minute ?? 0;

  const phaseLabel: Record<string, string> = {
    PreMatch: "PRE-MATCH",
    FirstHalf: "1ST HALF",
    HalfTime: "HALF TIME",
    SecondHalf: "2ND HALF",
    ExtraTime: "EXTRA TIME",
    Penalties: "PENALTIES",
    FullTime: "FULL TIME",
  };

  return (
    <div
      className="glass"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "2px solid rgba(245, 163, 42, 0.3)",
        background: "rgba(5, 11, 18, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 0,
        borderLeft: "none",
        borderRight: "none",
        borderTop: "none",
      }}
    >
      {/* Coach A */}
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "#f0f4f8",
            marginBottom: "2px",
          }}
        >
          {coachAName}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "rgba(240,244,248,0.45)",
          }}
        >
          {state?.possessionA ?? 50}% possession
        </div>
      </div>

      {/* Center: scores + phase */}
      <div style={{ textAlign: "center", padding: "0 32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <span
            className={animA ? "score-pop" : ""}
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "48px",
              fontWeight: 700,
              color: "#f0f4f8",
              lineHeight: 1,
            }}
          >
            {scoreA}
          </span>
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "28px",
              fontWeight: 600,
              color: "rgba(240,244,248,0.3)",
            }}
          >
            —
          </span>
          <span
            className={animB ? "score-pop" : ""}
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "48px",
              fontWeight: 700,
              color: "#f0f4f8",
              lineHeight: 1,
            }}
          >
            {scoreB}
          </span>
        </div>

        {state?.phase === "Penalties" && (
          <div
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "13px",
              color: "#f5a32a",
              marginTop: "4px",
            }}
          >
            ({state.penaltiesA} — {state.penaltiesB}) PKS
          </div>
        )}

        <div style={{ marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#00e87a",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
            }}
          >
            {phaseLabel[phase] ?? phase}
          </span>
          {phase !== "PreMatch" && phase !== "HalfTime" && phase !== "FullTime" && (
            <span
              style={{
                fontFamily: "Orbitron, monospace",
                fontSize: "12px",
                color: "rgba(240,244,248,0.5)",
              }}
            >
              {minute}&apos;
            </span>
          )}
        </div>
      </div>

      {/* Coach B */}
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "#f0f4f8",
            marginBottom: "2px",
          }}
        >
          {coachBName}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "rgba(240,244,248,0.45)",
          }}
        >
          {state ? 100 - state.possessionA : 50}% possession
        </div>
      </div>
    </div>
  );
}
