"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/signalr";
import type { DraftSession } from "@/lib/types";
import Link from "next/link";

export default function LobbyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [maxCoaches, setMaxCoaches] = useState(4);
  const [roomCode, setRoomCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createSession() {
    setIsCreating(true);
    setError(null);
    try {
      const session = await apiPost<DraftSession>("/api/lobby/sessions", {
        hostDisplayName: name || "Coach 1",
        mode: "SnakeDraft",
        maxCoaches,
      });
      setCreatedCode(session.roomCode);
      const hostCoach = session.coaches[0];
      if (typeof window !== "undefined" && hostCoach)
        localStorage.setItem("myCoachId", String(hostCoach.id));
      setTimeout(() => router.push(`/draft/${session.id}?coachId=${hostCoach?.id ?? 1}`), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsCreating(false);
    }
  }

  async function joinSession() {
    setIsJoining(true);
    setError(null);
    try {
      const coach = await apiPost<{ id: number; draftSessionId: number }>(
        `/api/lobby/sessions/${roomCode}/join`,
        { displayName: joinName || "Coach 2" }
      );
      if (typeof window !== "undefined")
        localStorage.setItem("myCoachId", String(coach.id));
      router.push(`/draft/${coach.draftSessionId}?coachId=${coach.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsJoining(false);
    }
  }

  function copyCode() {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floodlight rays */}
      <div className="floodlights" />

      {/* Hero section */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "48px",
          animation: "fadeIn 0.6s ease-out",
        }}
      >
        {/* Trophy + label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "28px", animation: "float 3s ease-in-out infinite" }}>🏆</span>
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.3em",
              color: "rgba(240,244,248,0.45)",
              textTransform: "uppercase",
            }}
          >
            World Cup
          </span>
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(52px, 10vw, 88px)",
            fontWeight: 700,
            letterSpacing: "0.04em",
            lineHeight: 0.95,
            textTransform: "uppercase",
            color: "#f0f4f8",
            marginBottom: "16px",
          }}
        >
          DRAFT{" "}
          <span
            style={{
              color: "#00e87a",
              textShadow: "0 0 32px rgba(0, 232, 122, 0.6)",
            }}
          >
            ARENA
          </span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            color: "rgba(240,244,248,0.5)",
            letterSpacing: "0.02em",
            maxWidth: "380px",
            margin: "0 auto",
          }}
        >
          Build your squad. Outwit your rivals. Lift the cup.
        </p>
      </div>

      {/* Room created state */}
      {createdCode && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
            animation: "slideIn 0.4s ease-out",
          }}
        >
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "rgba(240,244,248,0.5)",
              marginBottom: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Room Created — Share this code
          </div>
          <div className="room-code">{createdCode}</div>
          <div style={{ marginTop: "12px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="btn-secondary" onClick={copyCode} style={{ fontSize: "13px", padding: "8px 18px" }}>
              {copied ? "✓ Copied!" : "Copy Code"}
            </button>
          </div>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "rgba(240,244,248,0.5)",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(0,232,122,0.4)",
                borderTopColor: "#00e87a",
                borderRadius: "50%",
                animation: "spinSlow 1s linear infinite",
              }}
            />
            Entering draft room…
          </div>
        </div>
      )}

      {/* Action cards */}
      {!createdCode && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            maxWidth: "680px",
            width: "100%",
            animation: "fadeIn 0.7s ease-out 0.1s both",
          }}
        >
          {/* Create Room card */}
          <div
            className="gradient-border"
            style={{
              padding: "28px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              background: "rgba(0, 232, 122, 0.04)",
            }}
          >
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "#f0f4f8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              CREATE ROOM
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "rgba(240,244,248,0.45)",
                marginBottom: "20px",
              }}
            >
              Start a new draft battle
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                className="input-dark"
                placeholder="Your coach name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <select
                className="input-dark"
                value={maxCoaches}
                onChange={(e) => setMaxCoaches(Number(e.target.value))}
              >
                {[2, 4, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} coaches
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                onClick={createSession}
                disabled={isCreating}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isCreating ? "CREATING…" : "CREATE ROOM →"}
              </button>
            </div>
          </div>

          {/* Join Room card */}
          <div
            className="glass"
            style={{ padding: "28px" }}
          >
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "#f0f4f8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              JOIN ROOM
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "rgba(240,244,248,0.45)",
                marginBottom: "20px",
              }}
            >
              Paste the room code shared by the host
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                className="input-dark"
                placeholder="Paste room code here"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.trim())}
                style={{ fontFamily: "Orbitron, monospace", letterSpacing: "0.1em", fontSize: "13px" }}
              />
              <input
                className="input-dark"
                placeholder="Your display name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
              />
              <button
                className="btn-secondary"
                onClick={joinSession}
                disabled={isJoining || roomCode.length < 8}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isJoining ? "JOINING…" : "JOIN ROOM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            background: "rgba(255, 59, 92, 0.1)",
            border: "1px solid rgba(255, 59, 92, 0.25)",
            borderRadius: "8px",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#ff3b5c",
            maxWidth: "680px",
            width: "100%",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {error}
        </div>
      )}

      {/* Watch Live link */}
      <div
        style={{
          marginTop: "32px",
          animation: "fadeIn 0.8s ease-out 0.2s both",
        }}
      >
        <Link
          href="/spectate"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "rgba(240,244,248,0.45)",
            transition: "color 0.2s ease",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#ff3b5c",
              display: "inline-block",
              animation: "livePulse 1.5s ease-in-out infinite",
            }}
          />
          WATCH LIVE matches in spectator mode
        </Link>
      </div>
    </main>
  );
}
