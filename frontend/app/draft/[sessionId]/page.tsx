"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createHubConnection, apiGet, apiPost } from "@/lib/signalr";
import type { NationalSquad, Player, RosterSlot, DraftSession, Tournament } from "@/lib/types";
import FormationPitch from "@/app/components/FormationPitch";
import PlayerCard from "@/app/components/PlayerCard";
import CountdownTimer from "@/app/components/CountdownTimer";

const FORMATION_SLOTS = [
  { code: "GK", x: 50, y: 92 },
  { code: "LB", x: 15, y: 72 },
  { code: "CB1", x: 38, y: 78 },
  { code: "CB2", x: 62, y: 78 },
  { code: "RB", x: 85, y: 72 },
  { code: "CDM", x: 50, y: 58 },
  { code: "CM1", x: 30, y: 45 },
  { code: "CM2", x: 70, y: 45 },
  { code: "LW", x: 15, y: 22 },
  { code: "RW", x: 85, y: 22 },
  { code: "ST", x: 50, y: 12 },
];

export default function DraftRoomPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = Number(params.sessionId);

  const [coachId] = useState(() => Number(searchParams.get("coachId") ?? "1"));
  const [session, setSession] = useState<DraftSession | null>(null);
  const [scouted, setScouted] = useState<NationalSquad | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [roster, setRoster] = useState<RosterSlot[]>([]);
  // Global set of player IDs already drafted by ANY coach in this session
  const [takenPlayerIds, setTakenPlayerIds] = useState<Set<number>>(new Set());
  const [log, setLog] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(30);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const connRef = useRef<ReturnType<typeof createHubConnection> | null>(null);

  useEffect(() => {
    apiGet<DraftSession>(`/api/lobby/sessions/${sessionId}`)
      .then((s) => {
        setSession(s);
        setIsMyTurn(s.currentTurnCoachId === coachId);
        setCountdown(s.turnTimeSeconds);
      })
      .catch(() => {});

    const conn = createHubConnection("draft");
    connRef.current = conn;

    conn.on("SquadScouted", (fromCoach: number, squad: NationalSquad) => {
      setScouted(squad);
      setLog((l) => [`Coach ${fromCoach} scouted ${squad.nation} ${squad.year}`, ...l]);
    });

    conn.on("PlayerPlaced", (fromCoach: number, slot: RosterSlot) => {
      const playerName = slot.player?.name ?? `Player #${slot.playerId}`;
      setLog((l) => [`Coach ${fromCoach} drafted ${playerName} → ${slot.slotCode}`, ...l]);
      // Mark player as taken globally (for all coaches)
      setTakenPlayerIds((prev) => new Set(prev).add(slot.playerId));
      if (fromCoach === coachId)
        setRoster((r) => [...r.filter((s) => s.slotCode !== slot.slotCode), slot]);
    });

    conn.on("PlayerStolen", (stealer: number, target: number) => {
      setLog((l) => [`Coach ${stealer} STOLE a player from Coach ${target}!`, ...l]);
    });

    // Opponent scouted a team — show in log but don't reveal which squad
    conn.on("OpponentScouted", (fromCoach: number, squadLabel: string) => {
      setLog((l) => [`Coach ${fromCoach} is scouting ${squadLabel}…`, ...l]);
    });

    conn.on("TurnChanged", (newTurnCoachId: number, timeSeconds: number) => {
      setIsMyTurn(newTurnCoachId === coachId);
      setCountdown(timeSeconds);
    });

    // When the host starts the cup, ALL coaches in the room get redirected together
    conn.on("TournamentStarted", (tournamentId: number) => {
      router.push(`/bracket/${tournamentId}`);
    });

    let active = true;
    conn.start()
      .then(() => { if (active) conn.invoke("JoinSession", sessionId, coachId).catch(() => {}); })
      .catch(() => {});

    return () => {
      active = false;
      conn.stop();
    };
  }, [sessionId, coachId]);

  // Local countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function scout() {
    connRef.current?.invoke("Scout", sessionId, coachId);
    setSelectedPlayer(null);
  }

  function placeOnSlot(slotCode: string) {
    if (!selectedPlayer) return;
    if (roster.some((s) => s.slotCode === slotCode)) return;
    connRef.current?.invoke("PickAndPlace", sessionId, coachId, selectedPlayer.id, slotCode);
    setSelectedPlayer(null);
    setScouted(null);
  }

  const filledCount = roster.length;
  // Only the room creator (first coach in the session, lowest ID) can start the cup
  const hostCoachId = session?.coaches[0]?.id ?? -1;
  const isHost = coachId === hostCoachId;
  const canPlayCup = filledCount >= 11 && isHost;
  const [startingCup, setStartingCup] = useState(false);
  const [formation, setFormation] = useState("4-3-3");

  async function startCup() {
    if (!isHost) return;
    setStartingCup(true);
    try {
      if (typeof window !== "undefined") localStorage.setItem("myFormation", formation);
      const tournament = await apiPost<Tournament>("/api/bracket/start", {
        draftSessionId: sessionId,
        tournamentName: "World Cup",
      });
      // Broadcast to all coaches in the room — they will all navigate together
      await connRef.current?.invoke("NotifyTournamentStarted", sessionId, tournament.id);
    } catch {
      setStartingCup(false);
    }
  }
  const currentTurnCoach = session?.coaches.find((c) => c.id === session.currentTurnCoachId);

  return (
    <div style={{ minHeight: "100vh", padding: "0 0 32px" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "12px 20px",
          background: "rgba(5, 11, 18, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexWrap: "wrap",
        }}
      >
        {/* Room code */}
        <div
          style={{
            fontFamily: "Orbitron, monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: "#00e87a",
            background: "rgba(0, 232, 122, 0.08)",
            border: "1px solid rgba(0, 232, 122, 0.2)",
            borderRadius: "6px",
            padding: "6px 14px",
            letterSpacing: "0.12em",
          }}
        >
          {session?.roomCode ?? "------"}
        </div>

        {/* Current turn indicator */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isMyTurn ? "#00e87a" : "#f5a32a",
              boxShadow: isMyTurn
                ? "0 0 8px rgba(0,232,122,0.8)"
                : "0 0 8px rgba(245,163,42,0.6)",
            }}
          />
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "rgba(240,244,248,0.7)",
              letterSpacing: "0.05em",
            }}
          >
            {isMyTurn
              ? "YOUR TURN"
              : `${currentTurnCoach?.displayName ?? "Coach"} IS PICKING`}
          </span>
          {isMyTurn && (
            <span
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "12px",
                color: "#00e87a",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                animation: "livePulse 1.5s ease-in-out infinite",
              }}
            >
              ◆ YOUR PICK
            </span>
          )}
        </div>

        {/* Countdown timer */}
        <CountdownTimer seconds={countdown} />

        {/* Progress */}
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "rgba(240,244,248,0.5)",
            letterSpacing: "0.06em",
          }}
        >
          <span style={{ color: "#f0f4f8" }}>{filledCount}</span>/11 PLACED
        </div>

        {/* Formation selector + Play Cup */}
        {canPlayCup && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                color: "#f0f4f8",
                padding: "7px 10px",
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              {["4-3-3", "4-4-2", "4-2-3-1", "3-5-2"].map((f) => (
                <option key={f} value={f} style={{ background: "#0a1628" }}>{f}</option>
              ))}
            </select>
            <button
              className="btn-primary"
              onClick={startCup}
              disabled={startingCup}
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              {startingCup ? "STARTING…" : "PLAY CUP →"}
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: "20px",
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* LEFT: Squad pool / scouted players */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Scout action */}
          {!scouted && (
            <div className="glass" style={{ padding: "20px" }}>
              <div
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#f0f4f8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                Squad Pool
              </div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "rgba(240,244,248,0.45)",
                  marginBottom: "16px",
                }}
              >
                Scout a random historical squad from the pool.
              </p>
              <button
                className="btn-primary"
                onClick={scout}
                disabled={!isMyTurn}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isMyTurn ? "SCOUT A SQUAD" : "WAIT YOUR TURN"}
              </button>
            </div>
          )}

          {/* Scouted squad */}
          {scouted && (
            <div style={{ animation: "slideIn 0.3s ease-out" }}>
              <div
                className={scouted.isJackpot ? "gold-border" : "glass"}
                style={{
                  padding: "16px",
                  background: scouted.isJackpot
                    ? "rgba(245, 163, 42, 0.06)"
                    : "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: scouted.isJackpot ? "#f5a32a" : "#f0f4f8",
                      }}
                    >
                      {scouted.nation} {scouted.isJackpot && "★"}
                    </div>
                    <div
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        color: "rgba(240,244,248,0.45)",
                      }}
                    >
                      {scouted.year} · {scouted.tournament}
                    </div>
                  </div>
                  {scouted.isJackpot && (
                    <span
                      style={{
                        background: "rgba(245,163,42,0.15)",
                        border: "1px solid rgba(245,163,42,0.3)",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#f5a32a",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      ★ JACKPOT
                    </span>
                  )}
                </div>

                {selectedPlayer && (
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#00e87a",
                      marginBottom: "10px",
                      padding: "8px 12px",
                      background: "rgba(0, 232, 122, 0.08)",
                      borderRadius: "6px",
                      border: "1px solid rgba(0, 232, 122, 0.2)",
                    }}
                  >
                    ✓ {selectedPlayer.name} selected — click a pitch slot to place
                  </div>
                )}
              </div>

              {/* Player list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {scouted.players.map((p) => {
                  const isTaken = takenPlayerIds.has(p.id);
                  return (
                    <div key={p.id} style={{ position: "relative" }}>
                      <div style={{ opacity: isTaken ? 0.4 : 1, pointerEvents: isTaken ? "none" : "auto" }}>
                        <PlayerCard
                          player={p}
                          selected={selectedPlayer?.id === p.id}
                          compact
                          onClick={() => !isTaken && setSelectedPlayer(selectedPlayer?.id === p.id ? null : p)}
                        />
                      </div>
                      {isTaken && (
                        <div style={{
                          position: "absolute",
                          top: "50%",
                          right: "10px",
                          transform: "translateY(-50%)",
                          fontFamily: "Rajdhani, sans-serif",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          color: "#ff3b5c",
                          background: "rgba(255,59,92,0.12)",
                          border: "1px solid rgba(255,59,92,0.4)",
                          borderRadius: "4px",
                          padding: "2px 7px",
                        }}>TAKEN</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Formation Pitch */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="glass" style={{ padding: "16px" }}>
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                color: "#f0f4f8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "12px",
              }}
            >
              Formation
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "rgba(240,244,248,0.4)",
                  fontWeight: 400,
                  marginLeft: "8px",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                4-3-3
              </span>
            </div>
            <FormationPitch
              slots={FORMATION_SLOTS}
              roster={roster}
              canPlace={!!selectedPlayer}
              onSlotClick={placeOnSlot}
            />
          </div>

          {/* Coach roster strip */}
          {session && session.coaches.length > 0 && (
            <div className="glass" style={{ padding: "14px 16px" }}>
              <div
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "rgba(240,244,248,0.4)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Coaches
              </div>
              <div className="coach-strip">
                {session.coaches.map((coach) => (
                  <div
                    key={coach.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 14px",
                      background:
                        session.currentTurnCoachId === coach.id
                          ? "rgba(0, 232, 122, 0.1)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        session.currentTurnCoachId === coach.id
                          ? "1px solid rgba(0, 232, 122, 0.3)"
                          : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "8px",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background:
                          session.currentTurnCoachId === coach.id
                            ? "#00e87a"
                            : "rgba(255,255,255,0.2)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color:
                          session.currentTurnCoachId === coach.id
                            ? "#00e87a"
                            : "#f0f4f8",
                      }}
                    >
                      {coach.displayName}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "11px",
                        color: "rgba(240,244,248,0.4)",
                      }}
                    >
                      {coach.roster?.length ?? 0} picks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draft log */}
      {log.length > 0 && (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <div className="glass" style={{ padding: "16px" }}>
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "rgba(240,244,248,0.5)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Draft Log
            </div>
            <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {log.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: i === 0 ? "rgba(240,244,248,0.8)" : "rgba(240,244,248,0.4)",
                    padding: "4px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    animation: i === 0 ? "slideIn 0.3s ease-out" : "none",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
