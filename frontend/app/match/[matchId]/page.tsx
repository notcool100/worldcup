"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createHubConnection, apiGet } from "@/lib/signalr";
import type { MatchEvent, MatchState, RosterSlot, Tactic } from "@/lib/types";
import ScoreBoard from "@/app/components/ScoreBoard";
import LiveBadge from "@/app/components/LiveBadge";
import MatchEventRow from "@/app/components/MatchEventRow";

// ─── Formation base positions ─────────────────────────────────────────────────
// x=0..100 (0=Team-A goal, 100=Team-B goal), y=0..100 (top..bottom)
// These are Team A's positions. Team B = mirrorX(x).
const FORMATIONS: Record<string, Record<string, [number, number]>> = {
  "4-3-3": {
    GK:[6,50], LB:[22,18], CB1:[20,37], CB2:[20,63], RB:[22,82],
    CDM:[40,50], CM1:[46,28], CM2:[46,72],
    LW:[68,14], ST:[76,50], RW:[68,86],
  },
  "4-4-2": {
    GK:[6,50], LB:[20,14], CB1:[20,36], CB2:[20,64], RB:[20,86],
    CDM:[40,22], CM1:[40,42], CM2:[40,58], LW:[40,78],
    ST:[68,34], RW:[68,66],
  },
  "4-2-3-1": {
    GK:[6,50], LB:[20,14], CB1:[20,36], CB2:[20,64], RB:[20,86],
    CDM:[36,34], CM1:[36,66],
    LW:[54,16], CM2:[54,50], RW:[54,84],
    ST:[76,50],
  },
  "3-5-2": {
    GK:[6,50], LB:[22,14], CB1:[20,37], CB2:[20,63], RB:[22,86],
    CDM:[42,50], CM1:[44,24], CM2:[44,76],
    LW:[66,22], ST:[74,50], RW:[66,78],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const W = 960, H = 580;
const px = (v: number) => (v / 100) * W;
const py = (v: number) => (v / 100) * H;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function initials(name: string) {
  return name.split(" ").map(w => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}
function surname(name: string) {
  return name.split(" ").at(-1) ?? name;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnimPos { x: number; y: number }
interface BallState { x: number; y: number; phase: string }

// ─── Live Pitch Component ─────────────────────────────────────────────────────
interface PitchProps {
  teamASlots: RosterSlot[];
  teamBSlots: RosterSlot[];
  animPos: Map<string, AnimPos>;
  ball: BallState;
  highlightedPlayerId: number | null;
  scoringCoachId: number | null;
  stateCoachAId: number;
}

function LivePitch({ teamASlots, teamBSlots, animPos, ball, highlightedPlayerId, scoringCoachId, stateCoachAId }: PitchProps) {
  const bx = px(ball.x);
  const by = py(ball.y);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b4219" />
          <stop offset="50%" stopColor="#0e5220" />
          <stop offset="100%" stopColor="#0b4219" />
        </linearGradient>
        <radialGradient id="ballG" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d0d0d0" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.4"/>
        </filter>
      </defs>

      {/* ── Grass ── */}
      <rect width={W} height={H} fill="url(#grass)" rx={10} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={i * 96} y={0} width={96} height={H}
          fill={i % 2 === 0 ? "rgba(0,0,0,0.07)" : "transparent"} />
      ))}

      {/* ── Pitch markings ── */}
      {/* Border */}
      <rect x={22} y={18} width={W-44} height={H-36}
        fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={2} rx={3}/>
      {/* Halfway */}
      <line x1={W/2} y1={18} x2={W/2} y2={H-18}
        stroke="rgba(255,255,255,0.22)" strokeWidth={1.5}/>
      {/* Centre circle */}
      <circle cx={W/2} cy={H/2} r={72}
        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}/>
      <circle cx={W/2} cy={H/2} r={4} fill="rgba(255,255,255,0.45)"/>
      {/* Left penalty box */}
      <rect x={22} y={H/2-106} width={138} height={212}
        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}/>
      <rect x={22} y={H/2-54} width={54} height={108}
        fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1}/>
      {/* Right penalty box */}
      <rect x={W-160} y={H/2-106} width={138} height={212}
        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}/>
      <rect x={W-76} y={H/2-54} width={54} height={108}
        fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1}/>
      {/* Goals */}
      <rect x={4} y={H/2-38} width={18} height={76}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.35)" strokeWidth={2}/>
      <rect x={W-22} y={H/2-38} width={18} height={76}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.35)" strokeWidth={2}/>
      {/* Penalty spots */}
      <circle cx={110} cy={H/2} r={3.5} fill="rgba(255,255,255,0.35)"/>
      <circle cx={W-110} cy={H/2} r={3.5} fill="rgba(255,255,255,0.35)"/>
      {/* Corner arcs */}
      {[[22,18],[W-22,18],[22,H-18],[W-22,H-18]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r={14}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      ))}

      {/* ── Team B players (blue, right side) ── */}
      {teamBSlots.map(slot => {
        if (!slot.player) return null;
        const key = `b-${slot.player.id}`;
        const pos = animPos.get(key) ?? { x: 75, y: 50 };
        const isHL = highlightedPlayerId === slot.player.id;
        const isScorer = scoringCoachId !== null && scoringCoachId !== stateCoachAId && highlightedPlayerId === slot.player.id;
        const cx2 = px(pos.x), cy2 = py(pos.y);
        return (
          <g key={key}
            transform={`translate(${cx2},${cy2})`}
            style={{ transition: "transform 0.8s cubic-bezier(0.25,0.1,0.25,1)" }}>
            {isHL && <circle r={26} fill="rgba(77,159,255,0.28)" filter="url(#softGlow)"/>}
            {isScorer && <circle r={30} fill="rgba(0,232,122,0.3)" filter="url(#softGlow)"/>}
            <circle r={18}
              fill={isHL ? "#3a8fd4" : "#164f8a"}
              stroke={isHL ? "#7cc4ff" : "rgba(77,159,255,0.55)"}
              strokeWidth={isHL ? 2.5 : 1.5}
              filter={isHL ? "url(#glow)" : "url(#shadow)"}>
              {isHL && <animate attributeName="r" values="18;20;18" dur="0.5s" repeatCount="3"/>}
            </circle>
            {/* Rating */}
            <circle cx={13} cy={-13} r={10} fill="#050b12" stroke="rgba(77,159,255,0.5)" strokeWidth={1}/>
            <text x={13} y={-9} textAnchor="middle" fontSize={8} fontWeight="800"
              fill="#4d9fff" fontFamily="Orbitron,monospace">{slot.player.rating}</text>
            {/* Initials */}
            <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight="700"
              fill="white" fontFamily="Rajdhani,sans-serif">{initials(slot.player.name)}</text>
            {/* Name */}
            <text x={0} y={32} textAnchor="middle" fontSize={9.5} fill="rgba(255,255,255,0.75)"
              fontFamily="Inter,sans-serif">{surname(slot.player.name)}</text>
            <text x={0} y={42} textAnchor="middle" fontSize={7.5}
              fill="rgba(77,159,255,0.65)" fontFamily="Rajdhani,sans-serif">{slot.slotCode}</text>
          </g>
        );
      })}

      {/* ── Team A players (green, left side) ── */}
      {teamASlots.map(slot => {
        if (!slot.player) return null;
        const key = `a-${slot.player.id}`;
        const pos = animPos.get(key) ?? { x: 25, y: 50 };
        const isHL = highlightedPlayerId === slot.player.id;
        const isScorer = scoringCoachId === stateCoachAId && highlightedPlayerId === slot.player.id;
        const cx2 = px(pos.x), cy2 = py(pos.y);
        return (
          <g key={key}
            transform={`translate(${cx2},${cy2})`}
            style={{ transition: "transform 0.8s cubic-bezier(0.25,0.1,0.25,1)" }}>
            {isHL && <circle r={26} fill="rgba(0,232,122,0.25)" filter="url(#softGlow)"/>}
            {isScorer && <circle r={30} fill="rgba(245,163,42,0.3)" filter="url(#softGlow)"/>}
            <circle r={18}
              fill={isHL ? "#00c967" : "#0a5928"}
              stroke={isHL ? "#00e87a" : "rgba(0,232,122,0.55)"}
              strokeWidth={isHL ? 2.5 : 1.5}
              filter={isHL ? "url(#glow)" : "url(#shadow)"}>
              {isHL && <animate attributeName="r" values="18;20;18" dur="0.5s" repeatCount="3"/>}
            </circle>
            <circle cx={13} cy={-13} r={10} fill="#050b12" stroke="rgba(0,232,122,0.5)" strokeWidth={1}/>
            <text x={13} y={-9} textAnchor="middle" fontSize={8} fontWeight="800"
              fill="#00e87a" fontFamily="Orbitron,monospace">{slot.player.rating}</text>
            <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight="700"
              fill="white" fontFamily="Rajdhani,sans-serif">{initials(slot.player.name)}</text>
            <text x={0} y={32} textAnchor="middle" fontSize={9.5} fill="rgba(255,255,255,0.75)"
              fontFamily="Inter,sans-serif">{surname(slot.player.name)}</text>
            <text x={0} y={42} textAnchor="middle" fontSize={7.5}
              fill="rgba(0,232,122,0.65)" fontFamily="Rajdhani,sans-serif">{slot.slotCode}</text>
          </g>
        );
      })}

      {/* ── Ball shadow ── */}
      <ellipse cx={bx} cy={by + 16} rx={9} ry={4}
        fill="rgba(0,0,0,0.35)"
        style={{ transition: "cx 0.6s ease, cy 0.6s ease" }}/>

      {/* ── Ball ── */}
      <g transform={`translate(${bx},${by})`}
        style={{ transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)" }}>
        <circle r={11} fill="url(#ballG)" stroke="rgba(255,255,255,0.7)" strokeWidth={1}
          filter="url(#glow)">
          <animateTransform attributeName="transform" type="rotate"
            values="0;360" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        {/* Pentagon pattern on ball */}
        <circle r={4} fill="rgba(0,0,0,0.15)" cx={-3} cy={-2}/>
        <circle r={3} fill="rgba(0,0,0,0.12)" cx={4} cy={3}/>
      </g>

      {/* ── Goal net flash ── */}
      {ball.phase === "goal" && (
        <>
          <rect x={ball.x > 50 ? W-22 : 4} y={H/2-38} width={18} height={76}
            fill="rgba(0,232,122,0.5)" rx={2}>
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.4s" repeatCount="4"/>
          </rect>
        </>
      )}

      {/* ── Team watermarks ── */}
      <text x={70} y={H-8} textAnchor="middle" fontSize={11} fontWeight="700"
        fill="rgba(0,232,122,0.5)" fontFamily="Rajdhani,sans-serif" letterSpacing="0.12em">
        YOUR TEAM
      </text>
      <text x={W-70} y={H-8} textAnchor="middle" fontSize={11} fontWeight="700"
        fill="rgba(77,159,255,0.5)" fontFamily="Rajdhani,sans-serif" letterSpacing="0.12em">
        OPPONENT
      </text>
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MatchPage() {
  const params = useParams<{ matchId: string }>();
  const search = useSearchParams();
  const matchId = Number(params.matchId);
  const isSpectator = search.get("spectator") === "1";
  const myCoachId = Number(search.get("coachId") ?? "0");

  const [state, setState] = useState<MatchState | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [teamASlots, setTeamASlots] = useState<RosterSlot[]>([]);
  const [teamBSlots, setTeamBSlots] = useState<RosterSlot[]>([]);

  // Animation state
  const [animPos, setAnimPos] = useState<Map<string, AnimPos>>(new Map());
  const [ball, setBall] = useState<BallState>({ x: 50, y: 50, phase: "idle" });
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<number | null>(null);
  const [scoringCoachId, setScoringCoachId] = useState<number | null>(null);
  const [goalCelebration, setGoalCelebration] = useState<{ scorer: string; side: "A"|"B" } | null>(null);

  const [formation, setFormation] = useState("4-3-3");
  const [viewers, setViewers] = useState(0);
  const connRef = useRef<ReturnType<typeof createHubConnection> | null>(null);
  const lastEventIdRef = useRef<number | null>(null);
  const stateRef = useRef<MatchState | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived
  const formationMap = FORMATIONS[formation] ?? FORMATIONS["4-3-3"];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("myFormation");
      if (saved) setFormation(saved);
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const s = await apiGet<MatchState>(`/api/match/${matchId}`);
      setState(s);
      stateRef.current = s;
      const sorted = (s.events ?? []).slice().sort((a, b) => b.id - a.id);
      setEvents(sorted);
    } catch { /* not ready */ }
  }, [matchId]);

  // Load rosters once
  useEffect(() => {
    apiGet<{ coachA: RosterSlot[]; coachB: RosterSlot[] }>(`/api/match/${matchId}/rosters`)
      .then(({ coachA, coachB }) => {
        setTeamASlots(coachA);
        setTeamBSlots(coachB);
        // Immediately place players at formation positions (no 750ms wait)
        const init = new Map<string, AnimPos>();
        coachA.forEach(sl => {
          if (!sl.player) return;
          const [x, y] = FORMATIONS["4-3-3"][sl.slotCode] ?? [25, 50];
          init.set(`a-${sl.player.id}`, { x, y });
        });
        coachB.forEach(sl => {
          if (!sl.player) return;
          const [bx, by] = FORMATIONS["4-3-3"][sl.slotCode] ?? [25, 50];
          init.set(`b-${sl.player.id}`, { x: 100 - bx, y: by });
        });
        setAnimPos(init);
      })
      .catch(() => {});
  }, [matchId]);

  // SignalR
  useEffect(() => {
    refreshState();
    const conn = createHubConnection("match");
    connRef.current = conn;

    conn.on("MatchTick", (id: number, newEvents: MatchEvent[]) => {
      if (id !== matchId) return;
      refreshState();
      if (!newEvents.length) return;
      const latest = newEvents.sort((a,b) => b.id - a.id)[0];
      if (latest.id === lastEventIdRef.current) return;
      lastEventIdRef.current = latest.id;
      handleEvent(latest);
    });

    conn.on("ViewerJoined", () => setViewers(v => v + 1));
    conn.on("TacticChanged", (coachId: number, tactic: string) => {
      setState(prev => {
        if (!prev) return prev;
        if (coachId === prev.coachAId) return { ...prev, tacticA: tactic as Tactic };
        if (coachId === prev.coachBId) return { ...prev, tacticB: tactic as Tactic };
        return prev;
      });
    });
    conn.on("SubstitutionMade", () => refreshState());

    let active = true;
    conn.start()
      .then(() => { if (active) conn.invoke("JoinMatch", matchId, myCoachId, isSpectator).catch(() => {}); })
      .catch(() => {});

    return () => { active = false; conn.stop(); };
  }, [matchId, myCoachId, isSpectator, refreshState]);

  // ── Event handler: drives ball + player highlights ──────────────────────────
  function handleEvent(ev: MatchEvent) {
    const s = stateRef.current;
    if (!s) return;

    const isTeamAEvent = ev.coachId === s.coachAId;

    // Highlight player
    if (ev.playerId) {
      setHighlightedPlayerId(ev.playerId);
      setTimeout(() => setHighlightedPlayerId(null), 2200);
    }

    // Ball position based on event type
    const type = ev.type ?? "";
    if (type === "Goal") {
      const gx = isTeamAEvent ? 94 : 6;
      const gy = 44 + Math.random() * 12;
      setBall({ x: gx, y: gy, phase: "goal" });
      setScoringCoachId(ev.coachId ?? null);
      // Find scorer name
      const slots = isTeamAEvent ? teamASlots : teamBSlots;
      const scored = slots.find(sl => sl.player?.id === ev.playerId);
      const scorerName = scored?.player?.name ?? (isTeamAEvent ? `Coach ${s.coachAId}` : `Coach ${s.coachBId}`);
      setGoalCelebration({ scorer: scorerName, side: isTeamAEvent ? "A" : "B" });
      setTimeout(() => {
        setGoalCelebration(null);
        setScoringCoachId(null);
        setBall(prev => ({ ...prev, phase: "idle" }));
        // Reset to kick-off
        setBall({ x: 50, y: 50, phase: "idle" });
      }, 2800);
    } else if (type === "Corner") {
      const side = isTeamAEvent;
      const corners = side
        ? [[96, 8], [96, 92]]  // Team A attacking corner (right side)
        : [[4, 8], [4, 92]];   // Team B attacking corner
      const [cx, cy] = corners[Math.floor(Math.random() * 2)];
      setBall({ x: cx, y: cy as number, phase: "corner" });
    } else if (type === "YellowCard" || type === "RedCard" || type === "Foul") {
      // Ball stops near middle
      setBall({ x: 30 + Math.random() * 40, y: 25 + Math.random() * 50, phase: "foul" });
    } else if (type === "KickOff") {
      setBall({ x: 50, y: 50, phase: "kickoff" });
    } else if (type === "Injury") {
      setBall(prev => ({ ...prev, phase: "injury" }));
    }
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  // Updates every 900ms. CSS transition 0.8s means full smooth movement between frames.
  // Ball snaps to a real player position so it looks like passing, not drifting.
  useEffect(() => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    if (!teamASlots.length && !teamBSlots.length) return;

    animTimerRef.current = setInterval(() => {
      const s = stateRef.current;
      const possA = s ? s.possessionA / 100 : 0.5;
      const possB = 1 - possA;
      const tA = s?.tacticA ?? "Balanced";
      const tB = s?.tacticB ?? "Balanced";

      // How far forwards each team pushes (based on possession + tactic)
      const pushMultA = tA === "Attacking" ? 1.6 : tA === "Defensive" ? 0.4 : 1.0;
      const pushMultB = tB === "Attacking" ? 1.6 : tB === "Defensive" ? 0.4 : 1.0;

      const nextPos = new Map<string, AnimPos>();

      // ── Team A (left→right attack) ──────────────────────────────────────────
      teamASlots.forEach(slot => {
        if (!slot.player) return;
        const key = `a-${slot.player.id}`;
        const base = formationMap[slot.slotCode] ?? [25, 50];
        const [bx, by] = base;
        const isGK = slot.slotCode === "GK";
        const isFwd = bx > 55; // striker / wingers
        const isMid = bx > 30 && bx <= 55;

        // Possession push: A has ball → push forward (rightward)
        // Larger push for forwards (12%), medium for mids (7%), none for GK
        const pushMag = isGK ? 0 : isFwd ? 12 : isMid ? 7 : 3;
        const pushX = (possA - 0.5) * pushMag * pushMultA;

        // Running jitter — larger than before so it's visible (±8-12%)
        const jitter = isGK ? 1.5 : isFwd ? 9 : 7;
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * (jitter * 1.2);

        // Defensive: compact shape (pull back toward own half)
        const defensivePull = tA === "Defensive" && !isGK ? -5 : 0;

        nextPos.set(key, {
          x: clamp(bx + pushX + jx + defensivePull, isGK ? 3 : 5, isGK ? 12 : 88),
          y: clamp(by + jy, 5, 95),
        });
      });

      // ── Team B (right→left attack) ──────────────────────────────────────────
      teamBSlots.forEach(slot => {
        if (!slot.player) return;
        const key = `b-${slot.player.id}`;
        const base = formationMap[slot.slotCode] ?? [25, 50];
        const [bx, by] = base;
        const mx = 100 - bx; // mirrored base x
        const isGK = slot.slotCode === "GK";
        const isFwd = bx > 55;
        const isMid = bx > 30 && bx <= 55;

        // B has ball → push leftward (lower x)
        const pushMag = isGK ? 0 : isFwd ? 12 : isMid ? 7 : 3;
        const pushX = -(possB - 0.5) * pushMag * pushMultB;

        const jitter = isGK ? 1.5 : isFwd ? 9 : 7;
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * (jitter * 1.2);

        const defensivePull = tB === "Defensive" && !isGK ? 5 : 0;

        nextPos.set(key, {
          x: clamp(mx + pushX + jx + defensivePull, isGK ? 88 : 12, isGK ? 97 : 95),
          y: clamp(by + jy, 5, 95),
        });
      });

      setAnimPos(nextPos);

      // ── Ball: snap to a random player from the possessing team ────────────────
      setBall(prev => {
        if (prev.phase === "goal" || prev.phase === "corner") return prev;

        const possTeamSlots = possA >= 0.5 ? teamASlots : teamBSlots;
        const prefix = possA >= 0.5 ? "a" : "b";
        const nonGK = possTeamSlots.filter(sl => sl.slotCode !== "GK" && sl.player);
        if (nonGK.length === 0) return prev;

        // Pick a random outfield player from the possessing team
        const carrier = nonGK[Math.floor(Math.random() * nonGK.length)];
        const carrierKey = `${prefix}-${carrier.player!.id}`;
        const carrierPos = nextPos.get(carrierKey);
        if (!carrierPos) return prev;

        // Ball is near the carrier with small offset
        const bx = clamp(carrierPos.x + (Math.random() - 0.5) * 3, 5, 95);
        const by = clamp(carrierPos.y + (Math.random() - 0.5) * 3, 5, 95);
        return { x: bx, y: by, phase: "play" };
      });

    }, 900);

    return () => { if (animTimerRef.current) clearInterval(animTimerRef.current); };
  }, [teamASlots, teamBSlots, formationMap]);


  // ── Tactic change ──────────────────────────────────────────────────────────
  function changeTactic(tactic: Tactic) {
    if (isSpectator) return;
    connRef.current?.invoke("ChangeTactic", matchId, myCoachId, tactic).catch(() => {});
    setState(prev => {
      if (!prev) return prev;
      return prev.coachAId === myCoachId
        ? { ...prev, tacticA: tactic }
        : { ...prev, tacticB: tactic };
    });
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const isCoachA = state?.coachAId === myCoachId;
  const myTactic: Tactic = state ? (isCoachA ? state.tacticA : state.tacticB) : "Balanced";
  const mySubsRemaining = state ? (isCoachA ? state.subsRemainingA : state.subsRemainingB) : 3;
  const possession = state?.possessionA ?? 50;
  const isLive = ["FirstHalf", "SecondHalf", "ExtraTime"].includes(state?.phase ?? "");

  const TACTICS: { key: Tactic; icon: string; desc: string }[] = [
    { key: "Defensive", icon: "🛡", desc: "Hold shape, absorb pressure" },
    { key: "Balanced",  icon: "⚖", desc: "Control and possession" },
    { key: "Attacking", icon: "⚔", desc: "High press, all-out attack" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#050b12" }}>

      <ScoreBoard
        state={state}
        coachAName={`Coach ${state?.coachAId ?? "A"}`}
        coachBName={`Coach ${state?.coachBId ?? "B"}`}
      />

      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 310px",
        gap: "12px",
        padding: "12px 16px 16px",
        maxWidth: "1440px",
        margin: "0 auto",
        width: "100%",
      }}>

        {/* ── Left: Pitch ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isLive && <LiveBadge />}
              <span style={{
                fontFamily: "Rajdhani, sans-serif", fontSize: "14px", fontWeight: 700,
                color: "rgba(240,244,248,0.55)", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {state?.phase?.replace(/([A-Z])/g, " $1").trim() ?? "PRE MATCH"}
                {state?.minute ? ` · ${state.minute}'` : ""}
              </span>
            </div>
            {/* Possession */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "Orbitron,monospace", fontSize: "13px", color: "#00e87a", fontWeight: 700 }}>
                {possession}%
              </span>
              <div style={{ width: "130px", height: "5px", borderRadius: "3px", background: "rgba(77,159,255,0.25)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${possession}%`, background: "linear-gradient(90deg, #00e87a, #00cc6a)", borderRadius: "3px 0 0 3px", transition: "width 1s ease" }}/>
              </div>
              <span style={{ fontFamily: "Orbitron,monospace", fontSize: "13px", color: "#4d9fff", fontWeight: 700 }}>
                {100 - possession}%
              </span>
            </div>
          </div>

          {/* Pitch container */}
          <div style={{
            borderRadius: "10px", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}>
            {/* Goal celebration overlay */}
            {goalCelebration && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 20,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.65)",
                animation: "fadeIn 0.2s ease-out",
              }}>
                <div style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: "clamp(56px, 8vw, 88px)",
                  fontWeight: 700,
                  color: "#00e87a",
                  textShadow: "0 0 50px rgba(0,232,122,0.9), 0 0 100px rgba(0,232,122,0.4)",
                  letterSpacing: "0.08em",
                  animation: "scorePop 0.35s ease-out",
                  lineHeight: 1,
                }}>⚽ GOAL!</div>
                <div style={{
                  fontFamily: "Orbitron, monospace", fontSize: "clamp(14px, 2vw, 20px)",
                  color: "rgba(240,244,248,0.8)", marginTop: "12px", letterSpacing: "0.06em",
                }}>
                  {goalCelebration.scorer} scores!
                </div>
                <div style={{
                  marginTop: "8px",
                  width: "120px", height: "3px", borderRadius: "2px",
                  background: "linear-gradient(90deg, transparent, #00e87a, transparent)",
                  animation: "slideIn 0.4s ease-out",
                }}/>
              </div>
            )}

            <LivePitch
              teamASlots={teamASlots}
              teamBSlots={teamBSlots}
              animPos={animPos}
              ball={ball}
              highlightedPlayerId={highlightedPlayerId}
              scoringCoachId={scoringCoachId}
              stateCoachAId={state?.coachAId ?? -1}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
            {[
              { label: "SHOTS",    a: state?.shotsA ?? 0,          b: state?.shotsB ?? 0 },
              { label: "FOULS",    a: state?.foulsA ?? 0,          b: state?.foulsB ?? 0 },
              { label: "SUBS",     a: state?.subsRemainingA ?? 3,  b: state?.subsRemainingB ?? 3 },
              { label: "POSS %",   a: possession,                  b: 100 - possession },
            ].map(({ label, a, b }) => (
              <div key={label} className="glass" style={{ padding: "10px 14px" }}>
                <div style={{ fontFamily: "Inter,sans-serif", fontSize: "9px", color: "rgba(240,244,248,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: "6px" }}>{label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "Orbitron,monospace", fontSize: "20px", fontWeight: 700, color: "#00e87a" }}>{a}</span>
                  <span style={{ fontSize: "10px", color: "rgba(240,244,248,0.2)" }}>—</span>
                  <span style={{ fontFamily: "Orbitron,monospace", fontSize: "20px", fontWeight: 700, color: "#4d9fff" }}>{b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Tactic */}
          <div className="glass" style={{ padding: "16px" }}>
            <div style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "11px", fontWeight: 700, color: "rgba(240,244,248,0.35)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px" }}>
              {isSpectator ? "👁 SPECTATING" : "⚙ TACTIC"}
            </div>
            {isSpectator ? (
              <div style={{ fontFamily: "Inter,sans-serif", fontSize: "12px", color: "rgba(240,244,248,0.35)", textAlign: "center", padding: "8px 0" }}>
                {viewers} viewer{viewers !== 1 ? "s" : ""} watching
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {TACTICS.map(({ key, icon, desc }) => {
                  const active = myTactic === key;
                  return (
                    <button key={key} onClick={() => changeTactic(key)} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                      border: active ? "1.5px solid #00e87a" : "1px solid rgba(255,255,255,0.08)",
                      background: active ? "rgba(0,232,122,0.1)" : "rgba(255,255,255,0.03)",
                      boxShadow: active ? "0 0 18px rgba(0,232,122,0.18)" : "none",
                      transition: "all 0.18s ease", width: "100%", textAlign: "left",
                    }}>
                      <span style={{ fontSize: "18px" }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "14px", fontWeight: 700, color: active ? "#00e87a" : "#f0f4f8", letterSpacing: "0.05em" }}>{key.toUpperCase()}</div>
                        <div style={{ fontFamily: "Inter,sans-serif", fontSize: "10px", color: "rgba(240,244,248,0.38)" }}>{desc}</div>
                      </div>
                      {active && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00e87a", boxShadow: "0 0 8px rgba(0,232,122,0.9)", flexShrink: 0 }}/>}
                    </button>
                  );
                })}
                <div style={{ fontFamily: "Inter,sans-serif", fontSize: "10px", color: "rgba(240,244,248,0.28)", textAlign: "center", marginTop: "4px" }}>
                  {mySubsRemaining} sub{mySubsRemaining !== 1 ? "s" : ""} remaining
                </div>
              </div>
            )}
          </div>

          {/* Formation switcher */}
          <div className="glass" style={{ padding: "12px 16px" }}>
            <div style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "11px", fontWeight: 700, color: "rgba(240,244,248,0.35)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>Formation</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Object.keys(FORMATIONS).map(f => (
                <button key={f} onClick={() => {
                  setFormation(f);
                  if (typeof window !== "undefined") localStorage.setItem("myFormation", f);
                }} style={{
                  fontFamily: "Rajdhani,sans-serif", fontSize: "13px", fontWeight: 700,
                  padding: "4px 10px", borderRadius: "6px", cursor: "pointer",
                  border: formation === f ? "1.5px solid #00e87a" : "1px solid rgba(255,255,255,0.1)",
                  background: formation === f ? "rgba(0,232,122,0.1)" : "transparent",
                  color: formation === f ? "#00e87a" : "rgba(240,244,248,0.45)",
                  transition: "all 0.15s ease",
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Event feed */}
          <div className="glass" style={{ padding: "14px 16px", flex: 1, minHeight: "220px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "11px", fontWeight: 700, color: "rgba(240,244,248,0.35)", letterSpacing: "0.14em", textTransform: "uppercase" }}>LIVE FEED</span>
              {isLive && <LiveBadge />}
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
              {events.length === 0
                ? <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(240,244,248,0.22)", fontFamily: "Inter,sans-serif", fontSize: "12px" }}>⏳ Waiting for kick-off…</div>
                : events.map((ev, i) => <MatchEventRow key={ev.id ?? i} event={ev} isNew={i === 0} />)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
