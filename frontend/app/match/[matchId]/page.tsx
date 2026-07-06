"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createHubConnection, apiGet } from "@/lib/signalr";
import type { MatchEvent, MatchState, RosterSlot, Tactic } from "@/lib/types";
import ScoreBoard from "@/app/components/ScoreBoard";
import LiveBadge from "@/app/components/LiveBadge";
import MatchEventRow from "@/app/components/MatchEventRow";

// ─── Formation positions (Team-A perspective, 0-100 coords) ─────────────────
const FORMATIONS: Record<string, Record<string, [number, number]>> = {
  "4-3-3":   { GK:[6,50], LB:[22,18], CB1:[20,37], CB2:[20,63], RB:[22,82], CDM:[40,50], CM1:[48,28], CM2:[48,72], LW:[68,14], ST:[76,50], RW:[68,86] },
  "4-4-2":   { GK:[6,50], LB:[20,14], CB1:[20,36], CB2:[20,64], RB:[20,86], CDM:[40,22], CM1:[40,42], CM2:[40,58], LW:[40,78], ST:[68,34], RW:[68,66] },
  "4-2-3-1": { GK:[6,50], LB:[20,14], CB1:[20,36], CB2:[20,64], RB:[20,86], CDM:[36,34], CM1:[36,66], LW:[54,16], CM2:[54,50], RW:[54,84], ST:[76,50] },
  "3-5-2":   { GK:[6,50], LB:[22,14], CB1:[20,37], CB2:[20,63], RB:[22,86], CDM:[42,50], CM1:[44,24], CM2:[44,76], LW:[66,22], ST:[72,50], RW:[66,78] },
};

// ─── Ball state machine ───────────────────────────────────────────────────────
type BallPhase = "play" | "corner" | "cornerKick" | "goal" | "kickoff" | "freekick";
interface Ball { x: number; y: number; phase: BallPhase; timer: number; }
// timer = ms remaining in this phase before auto-transition

const PHASE_DURATION: Partial<Record<BallPhase, number>> = {
  corner:     2400,   // ball sits at corner flag
  cornerKick: 1200,   // ball in air into box
  goal:       3000,   // celebration
  kickoff:    800,    // center spot pause
  freekick:   1400,   // ball stopped for free kick
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const W = 960, H = 580;
const px = (v: number) => (v / 100) * W;
const py = (v: number) => (v / 100) * H;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const initials = (n: string) => n.split(" ").map(w => w[0] ?? "").join("").toUpperCase().slice(0, 2);
const surname  = (n: string) => n.split(" ").at(-1) ?? n;

type Role = "GK" | "DEF" | "CDM" | "CM" | "FWD";
function getRole(code: string): Role {
  if (code === "GK") return "GK";
  if (["LB","CB1","CB2","RB"].includes(code)) return "DEF";
  if (code === "CDM") return "CDM";
  if (["CM1","CM2"].includes(code)) return "CM";
  return "FWD";
}

// ─── Role-based tactical AI ──────────────────────────────────────────────────
// Returns [targetX, targetY] in 0-100 pitch coords.
function getTarget(
  slotCode: string,
  side: "A" | "B",
  formX: number, formY: number,     // formation position (always A-side)
  ballX: number, ballY: number,
  possA: number,
  phase: BallPhase,
  tactic: Tactic,
): [number, number] {
  const role = getRole(slotCode);
  const hasBall = side === "A" ? possA >= 50 : possA < 50;
  const dir = side === "A" ? 1 : -1;                        // attack direction
  const baseX = side === "A" ? formX : 100 - formX;         // mirrored base
  const baseY = formY;
  const tacBonus = tactic === "Attacking" ? 8 : tactic === "Defensive" ? -7 : 0;

  // ── Goalkeeper: tracks ball Y, glued to goal line ────────────────────────
  if (role === "GK") {
    const gkX = side === "A" ? 6 : 94;
    const nearness = ballX < 30 && side === "A" ? 0.6 : ballX > 70 && side === "B" ? 0.6 : 0.2;
    return [gkX, clamp(lerp(50, ballY, nearness), 22, 78)];
  }

  // ── Corner: pack the box ─────────────────────────────────────────────────
  if (phase === "corner" || phase === "cornerKick") {
    if (hasBall && (role === "FWD" || role === "CM")) {
      const bx = side === "A" ? rand(76, 90) : rand(10, 24);
      return [clamp(bx, 5, 95), clamp(rand(22, 78), 10, 90)];
    }
    if (!hasBall && role !== ("GK" as Role)) {
      const bx = side === "A" ? rand(74, 92) : rand(8, 26);
      return [clamp(bx, 5, 95), clamp(rand(18, 82), 10, 90)];
    }
  }

  // ── Kickoff: snap to formation ────────────────────────────────────────────
  if (phase === "kickoff") {
    return [baseX + rand(-1.5, 1.5), baseY + rand(-2, 2)];
  }

  let tx = baseX;
  let ty = baseY;

  if (hasBall) {
    // ── In Possession ───────────────────────────────────────────────────────
    const push: Record<Role, number> = { GK:0, DEF:5, CDM:3, CM:9, FWD:14 };
    tx = baseX + dir * (push[role] + tacBonus * 0.6);

    // Vertical gravity toward ball
    const yGrav: Record<Role, number> = { GK:0, DEF:0.12, CDM:0.22, CM:0.35, FWD:0.48 };
    ty = lerp(baseY, ballY, yGrav[role]);

    // ST: runs at goal, stays ahead of ball
    if (slotCode === "ST") {
      const goalX = side === "A" ? 90 : 10;
      tx = lerp(ballX, goalX, 0.4) + dir * 5;
      ty = lerp(50, ballY, 0.7);
    }
    // LW/RW: hug touchlines and make forward runs
    if (slotCode === "LW") { ty = lerp(baseY, 12, 0.55); tx = baseX + dir * 16; }
    if (slotCode === "RW") { ty = lerp(baseY, 88, 0.55); tx = baseX + dir * 16; }
    // LB/RB: overlap the winger's channel when attacking
    if ((slotCode === "LB" || slotCode === "RB") && tactic !== "Defensive") {
      const wingY = slotCode === "LB" ? 14 : 86;
      ty = lerp(baseY, wingY, 0.38);
      tx = baseX + dir * 9;
    }

  } else {
    // ── Defending ────────────────────────────────────────────────────────────
    const pullback: Record<Role, number> = { GK:0, DEF:0, CDM:-1, CM:-7, FWD:-12 };
    tx = baseX + dir * (pullback[role] - tacBonus * 0.4);

    // Press toward ball if close; otherwise track (stay goal-side)
    const dist = Math.hypot(tx - ballX, ty - ballY);
    const pressR: Record<Role, number> = { GK:0, DEF:0.1, CDM:0.15, CM:0.22, FWD:0.32 };
    if (dist < 28) {
      tx = lerp(tx, ballX, pressR[role]);
      ty = lerp(ty, ballY, pressR[role] * 1.3);
    } else {
      // Track ball laterally, stay goal-side
      ty = lerp(baseY, ballY, 0.18);
    }
  }

  // Small positional noise — makes it look like running not teleporting
  tx += rand(-2.5, 2.5);
  ty += rand(-3.5, 3.5);

  const xMin = side === "A" ? 5 : 11;
  const xMax = side === "A" ? 89 : 95;
  return [clamp(tx, xMin, xMax), clamp(ty, 5, 95)];
}

// ─── Pitch SVG ────────────────────────────────────────────────────────────────
interface AnimPos { x: number; y: number; }

interface PitchProps {
  teamASlots: RosterSlot[];
  teamBSlots: RosterSlot[];
  animPos: Map<string, AnimPos>;
  ball: Ball;
  highlightId: number | null;
}

function PitchSVG({ teamASlots, teamBSlots, animPos, ball, highlightId }: PitchProps) {
  const bpx = px(ball.x), bpy = py(ball.y);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b4219"/><stop offset="50%" stopColor="#0e5220"/><stop offset="100%" stopColor="#0b4219"/>
        </linearGradient>
        <radialGradient id="ballG" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#ccc"/>
        </radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="softglow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.4"/></filter>
      </defs>

      {/* Grass + stripes */}
      <rect width={W} height={H} fill="url(#grass)" rx={8}/>
      {Array.from({length: 10}).map((_,i)=>(
        <rect key={i} x={i*96} y={0} width={96} height={H} fill={i%2===0?"rgba(0,0,0,0.07)":"transparent"}/>
      ))}

      {/* Markings */}
      <rect x={22} y={18} width={W-44} height={H-36} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={2} rx={3}/>
      <line x1={W/2} y1={18} x2={W/2} y2={H-18} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}/>
      <circle cx={W/2} cy={H/2} r={72} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}/>
      <circle cx={W/2} cy={H/2} r={4} fill="rgba(255,255,255,0.45)"/>
      {/* Penalty boxes */}
      <rect x={22} y={H/2-106} width={138} height={212} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}/>
      <rect x={22} y={H/2-54}  width={54}  height={108} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={1}/>
      <rect x={W-160} y={H/2-106} width={138} height={212} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}/>
      <rect x={W-76} y={H/2-54}  width={54}  height={108} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={1}/>
      {/* Goals */}
      <rect x={4}   y={H/2-38} width={18} height={76} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.35)" strokeWidth={2}/>
      <rect x={W-22} y={H/2-38} width={18} height={76} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.35)" strokeWidth={2}/>
      {/* Penalty spots */}
      <circle cx={110}   cy={H/2} r={3.5} fill="rgba(255,255,255,0.35)"/>
      <circle cx={W-110} cy={H/2} r={3.5} fill="rgba(255,255,255,0.35)"/>
      {/* Corner arcs */}
      {[[22,18],[W-22,18],[22,H-18],[W-22,H-18]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r={14} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
      ))}

      {/* Goal net flash during goal phase */}
      {ball.phase === "goal" && (
        <rect x={ball.x > 50 ? W-22 : 4} y={H/2-38} width={18} height={76}
          fill="rgba(0,232,122,0.55)" rx={2}>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.4s" repeatCount="indefinite"/>
        </rect>
      )}

      {/* ── Team B (blue, right side) ── */}
      {teamBSlots.map(sl => {
        if (!sl.player) return null;
        const key = `b-${sl.player.id}`;
        const pos = animPos.get(key) ?? { x: 75, y: 50 };
        const isHL = highlightId === sl.player.id;
        return (
          <g key={key} transform={`translate(${px(pos.x)},${py(pos.y)})`}
            style={{ transition: "transform 0.55s cubic-bezier(0.25,0.1,0.25,1)" }}>
            {isHL && <circle r={26} fill="rgba(77,159,255,0.3)" filter="url(#softglow)"/>}
            <circle r={18}
              fill={isHL ? "#3a8fd4" : "#163f70"}
              stroke={isHL ? "#7cc4ff" : "rgba(77,159,255,0.5)"}
              strokeWidth={isHL ? 2.5 : 1.5}
              filter={isHL ? "url(#glow)" : "url(#shadow)"}>
              {isHL && <animate attributeName="r" values="18;21;18" dur="0.4s" repeatCount="3"/>}
            </circle>
            <circle cx={13} cy={-13} r={10} fill="#050b12" stroke="rgba(77,159,255,0.45)" strokeWidth={1}/>
            <text x={13} y={-9} textAnchor="middle" fontSize={8} fontWeight="800" fill="#4d9fff" fontFamily="Orbitron,monospace">{sl.player.rating}</text>
            <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight="700" fill="white" fontFamily="Rajdhani,sans-serif">{initials(sl.player.name)}</text>
            <text x={0} y={32} textAnchor="middle" fontSize={9.5} fill="rgba(255,255,255,0.75)" fontFamily="Inter,sans-serif">{surname(sl.player.name)}</text>
            <text x={0} y={42} textAnchor="middle" fontSize={7.5} fill="rgba(77,159,255,0.65)" fontFamily="Rajdhani,sans-serif">{sl.slotCode}</text>
          </g>
        );
      })}

      {/* ── Team A (green, left side) ── */}
      {teamASlots.map(sl => {
        if (!sl.player) return null;
        const key = `a-${sl.player.id}`;
        const pos = animPos.get(key) ?? { x: 25, y: 50 };
        const isHL = highlightId === sl.player.id;
        return (
          <g key={key} transform={`translate(${px(pos.x)},${py(pos.y)})`}
            style={{ transition: "transform 0.55s cubic-bezier(0.25,0.1,0.25,1)" }}>
            {isHL && <circle r={26} fill="rgba(0,232,122,0.28)" filter="url(#softglow)"/>}
            <circle r={18}
              fill={isHL ? "#00c967" : "#0a5928"}
              stroke={isHL ? "#00e87a" : "rgba(0,232,122,0.5)"}
              strokeWidth={isHL ? 2.5 : 1.5}
              filter={isHL ? "url(#glow)" : "url(#shadow)"}>
              {isHL && <animate attributeName="r" values="18;21;18" dur="0.4s" repeatCount="3"/>}
            </circle>
            <circle cx={13} cy={-13} r={10} fill="#050b12" stroke="rgba(0,232,122,0.45)" strokeWidth={1}/>
            <text x={13} y={-9} textAnchor="middle" fontSize={8} fontWeight="800" fill="#00e87a" fontFamily="Orbitron,monospace">{sl.player.rating}</text>
            <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight="700" fill="white" fontFamily="Rajdhani,sans-serif">{initials(sl.player.name)}</text>
            <text x={0} y={32} textAnchor="middle" fontSize={9.5} fill="rgba(255,255,255,0.75)" fontFamily="Inter,sans-serif">{surname(sl.player.name)}</text>
            <text x={0} y={42} textAnchor="middle" fontSize={7.5} fill="rgba(0,232,122,0.65)" fontFamily="Rajdhani,sans-serif">{sl.slotCode}</text>
          </g>
        );
      })}

      {/* ── Ball shadow ── */}
      <ellipse cx={bpx} cy={bpy+15} rx={9} ry={4} fill="rgba(0,0,0,0.38)"
        style={{ transition: "cx 0.28s ease, cy 0.28s ease" }}/>

      {/* ── Ball ── */}
      <g transform={`translate(${bpx},${bpy})`}
        style={{ transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)" }}>
        <circle r={11} fill="url(#ballG)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} filter="url(#glow)">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1.4s" repeatCount="indefinite"/>
        </circle>
        {/* Pentagon patches */}
        <circle r={4}  fill="rgba(0,0,0,0.18)" cx={-3} cy={-2}/>
        <circle r={3}  fill="rgba(0,0,0,0.14)" cx={4}  cy={3}/>
      </g>

      {/* Team labels */}
      <text x={70}   y={H-8} textAnchor="middle" fontSize={11} fontWeight="700" fill="rgba(0,232,122,0.5)"  fontFamily="Rajdhani,sans-serif" letterSpacing="0.12em">YOUR TEAM</text>
      <text x={W-70} y={H-8} textAnchor="middle" fontSize={11} fontWeight="700" fill="rgba(77,159,255,0.5)" fontFamily="Rajdhani,sans-serif" letterSpacing="0.12em">OPPONENT</text>
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MatchPage() {
  const params = useParams<{ matchId: string }>();
  const search = useSearchParams();
  const matchId   = Number(params.matchId);
  const isSpec    = search.get("spectator") === "1";
  const myCoachId = Number(search.get("coachId") ?? "0");

  const [state,       setState]       = useState<MatchState | null>(null);
  const [events,      setEvents]      = useState<MatchEvent[]>([]);
  const [teamASlots,  setTeamASlots]  = useState<RosterSlot[]>([]);
  const [teamBSlots,  setTeamBSlots]  = useState<RosterSlot[]>([]);
  const [animPos,     setAnimPos]     = useState<Map<string, AnimPos>>(new Map());
  const [ball,        setBall]        = useState<Ball>({ x:50, y:50, phase:"kickoff", timer:800 });
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<{ name: string } | null>(null);
  const [formation,   setFormation]   = useState("4-3-3");
  const [viewers,     setViewers]     = useState(0);

  const stateRef     = useRef<MatchState | null>(null);
  const teamARef     = useRef<RosterSlot[]>([]);
  const teamBRef     = useRef<RosterSlot[]>([]);
  const animPosRef   = useRef<Map<string, AnimPos>>(new Map());
  const ballRef      = useRef<Ball>({ x:50, y:50, phase:"kickoff", timer:800 });
  const connRef      = useRef<ReturnType<typeof createHubConnection> | null>(null);
  const lastEvIdRef  = useRef<number | null>(null);
  const formationRef = useRef("4-3-3");

  // Keep refs in sync
  const syncBall = (b: Ball) => { ballRef.current = b; setBall(b); };
  const syncPos  = (m: Map<string, AnimPos>) => { animPosRef.current = m; setAnimPos(new Map(m)); };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("myFormation");
      if (s) { setFormation(s); formationRef.current = s; }
    }
  }, []);

  // ── Refresh state ──────────────────────────────────────────────────────────
  const refreshState = useCallback(async () => {
    try {
      const s = await apiGet<MatchState>(`/api/match/${matchId}`);
      setState(s); stateRef.current = s;
      const sorted = (s.events ?? []).slice().sort((a,b) => b.id - a.id);
      setEvents(sorted);
    } catch { /* not ready */ }
  }, [matchId]);

  // ── Load rosters ───────────────────────────────────────────────────────────
  useEffect(() => {
    apiGet<{ coachA: RosterSlot[]; coachB: RosterSlot[] }>(`/api/match/${matchId}/rosters`)
      .then(({ coachA, coachB }) => {
        setTeamASlots(coachA); teamARef.current = coachA;
        setTeamBSlots(coachB); teamBRef.current = coachB;
        // Place players at formation positions immediately
        const fm = FORMATIONS[formationRef.current] ?? FORMATIONS["4-3-3"];
        const m = new Map<string, AnimPos>();
        coachA.forEach(sl => {
          if (!sl.player) return;
          const [x, y] = fm[sl.slotCode] ?? [25, 50];
          m.set(`a-${sl.player.id}`, { x, y });
        });
        coachB.forEach(sl => {
          if (!sl.player) return;
          const [bx, by] = fm[sl.slotCode] ?? [25, 50];
          m.set(`b-${sl.player.id}`, { x: 100 - bx, y: by });
        });
        syncPos(m);
      })
      .catch(() => {});
  }, [matchId]);

  // ── SignalR ────────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshState();
    const conn = createHubConnection("match");
    connRef.current = conn;

    conn.on("MatchTick", (id: number, newEvents: MatchEvent[]) => {
      if (id !== matchId) return;
      refreshState();
      if (!newEvents.length) return;
      const latest = [...newEvents].sort((a,b) => b.id - a.id)[0];
      if (latest.id === lastEvIdRef.current) return;
      lastEvIdRef.current = latest.id;
      handleEvent(latest);
    });
    conn.on("ViewerJoined",  () => setViewers(v => v+1));
    conn.on("TacticChanged", (coachId: number, tactic: string) => {
      setState(prev => {
        if (!prev) return prev;
        if (coachId === prev.coachAId) return { ...prev, tacticA: tactic as Tactic };
        if (coachId === prev.coachBId) return { ...prev, tacticB: tactic as Tactic };
        return prev;
      });
    });

    let active = true;
    conn.start()
      .then(() => { if (active) conn.invoke("JoinMatch", matchId, myCoachId, isSpec).catch(() => {}); })
      .catch(() => {});
    return () => { active = false; conn.stop(); };
  }, [matchId, myCoachId, isSpec, refreshState]);

  // ── Event handler: drives ball phase ──────────────────────────────────────
  function handleEvent(ev: MatchEvent) {
    const s = stateRef.current;
    if (!s) return;
    const isTeamA = ev.coachId === s.coachAId;
    const type = ev.type ?? "";

    if (ev.playerId) {
      setHighlightId(ev.playerId);
      setTimeout(() => setHighlightId(null), 2000);
    }

    if (type === "Goal") {
      const gx = isTeamA ? 93 : 7;
      const gy = rand(40, 60);
      syncBall({ x: gx, y: gy, phase: "goal", timer: PHASE_DURATION.goal! });
      const slots = isTeamA ? teamARef.current : teamBRef.current;
      const scorer = slots.find(sl => sl.player?.id === ev.playerId)?.player?.name
        ?? `Coach ${ev.coachId}`;
      setCelebration({ name: scorer });
      setTimeout(() => setCelebration(null), 2800);
    } else if (type === "Corner") {
      // Ball goes to the corner flag
      const cx = isTeamA ? (Math.random() > 0.5 ? 97 : 97) : (Math.random() > 0.5 ? 3 : 3);
      const cy = Math.random() > 0.5 ? 3 : 97;
      syncBall({ x: cx, y: cy, phase: "corner", timer: PHASE_DURATION.corner! });
    } else if (type === "YellowCard" || type === "RedCard" || type === "Foul") {
      // Ball stops in the middle zone
      syncBall({ x: rand(25, 75), y: rand(20, 80), phase: "freekick", timer: PHASE_DURATION.freekick! });
    } else if (type === "KickOff") {
      syncBall({ x: 50, y: 50, phase: "kickoff", timer: PHASE_DURATION.kickoff! });
    }
  }

  // ── Main animation engine: 60ms master clock ───────────────────────────────
  useEffect(() => {
    // BALL ticks every 350ms (passing speed)
    // PLAYERS tick every 650ms (running speed)
    let ballAccum    = 0;
    let playerAccum  = 0;
    const BALL_TICK  = 350;
    const PLAYER_TICK = 650;
    let lastTime = performance.now();

    const frame = () => {
      const now = performance.now();
      const dt  = now - lastTime;
      lastTime  = now;
      ballAccum   += dt;
      playerAccum += dt;

      // ── Ball tick ──────────────────────────────────────────────────────────
      if (ballAccum >= BALL_TICK) {
        ballAccum -= BALL_TICK;
        const s   = stateRef.current;
        const cur = ballRef.current;
        const possA = s?.possessionA ?? 50;

        let next = { ...cur, timer: cur.timer - BALL_TICK };

        // Auto-transition when timer expires
        if (next.timer <= 0) {
          if (cur.phase === "corner") {
            // Ball flies into box
            const intoBoxX = cur.x > 50 ? rand(74, 90) : rand(10, 26);
            const intoBoxY = rand(24, 76);
            next = { x: intoBoxX, y: intoBoxY, phase: "cornerKick", timer: PHASE_DURATION.cornerKick! };
          } else if (cur.phase === "cornerKick") {
            next = { ...next, phase: "play", timer: 99999 };
          } else if (cur.phase === "goal") {
            next = { x: 50, y: 50, phase: "kickoff", timer: PHASE_DURATION.kickoff! };
          } else if (cur.phase === "kickoff") {
            next = { x: 50, y: 50, phase: "play", timer: 99999 };
          } else if (cur.phase === "freekick") {
            next = { ...next, phase: "play", timer: 99999 };
          }
        }

        // In play: ball snaps to a random player on the possessing team
        if (next.phase === "play" || next.phase === "cornerKick") {
          const possSide = possA >= 50 ? "a" : "b";
          const possSlots = possA >= 50 ? teamARef.current : teamBRef.current;
          const outfield = possSlots.filter(sl => sl.slotCode !== "GK" && sl.player);
          if (outfield.length > 0) {
            const carrier = outfield[Math.floor(Math.random() * outfield.length)];
            const pos = animPosRef.current.get(`${possSide}-${carrier.player!.id}`);
            if (pos) {
              next.x = clamp(pos.x + rand(-1.5, 1.5), 4, 96);
              next.y = clamp(pos.y + rand(-1.5, 1.5), 4, 96);
            }
          }
        }

        syncBall(next);
      }

      // ── Player tick ────────────────────────────────────────────────────────
      if (playerAccum >= PLAYER_TICK) {
        playerAccum -= PLAYER_TICK;
        const s = stateRef.current;
        const ballNow = ballRef.current;
        const possA = s?.possessionA ?? 50;
        const tA = s?.tacticA ?? "Balanced";
        const tB = s?.tacticB ?? "Balanced";
        const fm  = FORMATIONS[formationRef.current] ?? FORMATIONS["4-3-3"];

        const next = new Map<string, AnimPos>();

        teamARef.current.forEach(sl => {
          if (!sl.player) return;
          const base = fm[sl.slotCode] ?? [25, 50];
          const [tx, ty] = getTarget(sl.slotCode, "A", base[0], base[1], ballNow.x, ballNow.y, possA, ballNow.phase, tA);
          next.set(`a-${sl.player.id}`, { x: tx, y: ty });
        });
        teamBRef.current.forEach(sl => {
          if (!sl.player) return;
          const base = fm[sl.slotCode] ?? [25, 50];
          const [tx, ty] = getTarget(sl.slotCode, "B", base[0], base[1], ballNow.x, ballNow.y, possA, ballNow.phase, tB);
          next.set(`b-${sl.player.id}`, { x: tx, y: ty });
        });

        syncPos(next);
      }

      raf = requestAnimationFrame(frame);
    };

    let raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []); // runs once — reads everything through refs

  // ── Tactic change ──────────────────────────────────────────────────────────
  function changeTactic(t: Tactic) {
    if (isSpec) return;
    connRef.current?.invoke("ChangeTactic", matchId, myCoachId, t).catch(() => {});
    setState(prev => {
      if (!prev) return prev;
      return prev.coachAId === myCoachId ? { ...prev, tacticA: t } : { ...prev, tacticB: t };
    });
  }

  // ── Formation switch ───────────────────────────────────────────────────────
  function switchFormation(f: string) {
    setFormation(f);
    formationRef.current = f;
    if (typeof window !== "undefined") localStorage.setItem("myFormation", f);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const isCoachA = state?.coachAId === myCoachId;
  const myTactic: Tactic = state ? (isCoachA ? state.tacticA : state.tacticB) : "Balanced";
  const mySubsLeft = state ? (isCoachA ? state.subsRemainingA : state.subsRemainingB) : 3;
  const possA = state?.possessionA ?? 50;
  const isLive = ["FirstHalf","SecondHalf","ExtraTime"].includes(state?.phase ?? "");

  const TACTICS: { key: Tactic; icon: string; desc: string }[] = [
    { key:"Defensive", icon:"🛡", desc:"Hold shape, absorb pressure" },
    { key:"Balanced",  icon:"⚖", desc:"Control and possession" },
    { key:"Attacking", icon:"⚔", desc:"High press, all-out attack" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"#050b12" }}>
      <ScoreBoard
        state={state}
        coachAName={`Coach ${state?.coachAId ?? "A"}`}
        coachBName={`Coach ${state?.coachBId ?? "B"}`}
      />

      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 308px", gap:"12px",
        padding:"12px 16px 16px", maxWidth:"1440px", margin:"0 auto", width:"100%" }}>

        {/* ── Left: Pitch ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          {/* Status + possession bar */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              {isLive && <LiveBadge/>}
              <span style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"14px", fontWeight:700,
                color:"rgba(240,244,248,0.5)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                {state?.phase?.replace(/([A-Z])/g," $1").trim() ?? "PRE MATCH"}
                {state?.minute ? ` · ${state.minute}'` : ""}
              </span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span style={{ fontFamily:"Orbitron,monospace", fontSize:"13px", color:"#00e87a", fontWeight:700 }}>{possA}%</span>
              <div style={{ width:"130px", height:"5px", borderRadius:"3px", background:"rgba(77,159,255,0.22)", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${possA}%`, background:"linear-gradient(90deg,#00e87a,#00cc6a)",
                  borderRadius:"3px 0 0 3px", transition:"width 1s ease" }}/>
              </div>
              <span style={{ fontFamily:"Orbitron,monospace", fontSize:"13px", color:"#4d9fff", fontWeight:700 }}>{100-possA}%</span>
            </div>
          </div>

          {/* Pitch */}
          <div style={{ borderRadius:"10px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)",
            position:"relative", boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>

            {/* GOAL celebration */}
            {celebration && (
              <div style={{ position:"absolute", inset:0, zIndex:20, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.65)" }}>
                <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"clamp(56px,8vw,88px)", fontWeight:700,
                  color:"#00e87a", textShadow:"0 0 50px rgba(0,232,122,0.9)", letterSpacing:"0.08em",
                  animation:"scorePop 0.35s ease-out", lineHeight:1 }}>⚽ GOAL!</div>
                <div style={{ fontFamily:"Orbitron,monospace", fontSize:"18px", color:"rgba(240,244,248,0.8)",
                  marginTop:"10px", letterSpacing:"0.06em" }}>{celebration.name} scores!</div>
              </div>
            )}

            {/* Corner indicator */}
            {(ball.phase === "corner" || ball.phase === "cornerKick") && (
              <div style={{ position:"absolute", top:"8px", left:"50%", transform:"translateX(-50%)",
                zIndex:10, fontFamily:"Rajdhani,sans-serif", fontSize:"12px", fontWeight:700,
                color:"#f5a32a", letterSpacing:"0.1em", background:"rgba(245,163,42,0.12)",
                border:"1px solid rgba(245,163,42,0.3)", borderRadius:"5px", padding:"3px 10px" }}>
                {ball.phase === "corner" ? "🚩 CORNER KICK" : "🚩 BALL IN!"}
              </div>
            )}

            <PitchSVG
              teamASlots={teamASlots}
              teamBSlots={teamBSlots}
              animPos={animPos}
              ball={ball}
              highlightId={highlightId}
            />
          </div>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
            {[
              { label:"SHOTS", a:state?.shotsA??0,         b:state?.shotsB??0 },
              { label:"FOULS", a:state?.foulsA??0,         b:state?.foulsB??0 },
              { label:"SUBS",  a:state?.subsRemainingA??3, b:state?.subsRemainingB??3 },
              { label:"POSS",  a:possA,                    b:100-possA },
            ].map(({ label,a,b }) => (
              <div key={label} className="glass" style={{ padding:"10px 14px" }}>
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:"9px", color:"rgba(240,244,248,0.3)",
                  letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center", marginBottom:"6px" }}>{label}</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontFamily:"Orbitron,monospace", fontSize:"20px", fontWeight:700, color:"#00e87a" }}>{a}</span>
                  <span style={{ fontSize:"10px", color:"rgba(240,244,248,0.2)" }}>—</span>
                  <span style={{ fontFamily:"Orbitron,monospace", fontSize:"20px", fontWeight:700, color:"#4d9fff" }}>{b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          {/* Tactic */}
          <div className="glass" style={{ padding:"16px" }}>
            <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"11px", fontWeight:700,
              color:"rgba(240,244,248,0.35)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:"12px" }}>
              {isSpec ? "👁 SPECTATING" : "⚙ TACTIC"}
            </div>
            {isSpec ? (
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", color:"rgba(240,244,248,0.35)", textAlign:"center", padding:"8px 0" }}>
                {viewers} viewer{viewers!==1?"s":""} watching
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {TACTICS.map(({ key,icon,desc }) => {
                  const on = myTactic === key;
                  return (
                    <button key={key} onClick={() => changeTactic(key)} style={{
                      display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px",
                      borderRadius:"8px", cursor:"pointer", width:"100%", textAlign:"left",
                      border: on ? "1.5px solid #00e87a" : "1px solid rgba(255,255,255,0.08)",
                      background: on ? "rgba(0,232,122,0.1)" : "rgba(255,255,255,0.03)",
                      boxShadow: on ? "0 0 18px rgba(0,232,122,0.18)" : "none",
                      transition:"all 0.18s ease",
                    }}>
                      <span style={{ fontSize:"18px" }}>{icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"14px", fontWeight:700,
                          color: on ? "#00e87a" : "#f0f4f8", letterSpacing:"0.05em" }}>{key.toUpperCase()}</div>
                        <div style={{ fontFamily:"Inter,sans-serif", fontSize:"10px", color:"rgba(240,244,248,0.38)" }}>{desc}</div>
                      </div>
                      {on && <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#00e87a",
                        boxShadow:"0 0 8px rgba(0,232,122,0.9)", flexShrink:0 }}/>}
                    </button>
                  );
                })}
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:"10px", color:"rgba(240,244,248,0.28)", textAlign:"center", marginTop:"4px" }}>
                  {mySubsLeft} sub{mySubsLeft!==1?"s":""} remaining
                </div>
              </div>
            )}
          </div>

          {/* Formation */}
          <div className="glass" style={{ padding:"12px 16px" }}>
            <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"11px", fontWeight:700,
              color:"rgba(240,244,248,0.35)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:"8px" }}>Formation</div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {Object.keys(FORMATIONS).map(f => (
                <button key={f} onClick={() => switchFormation(f)} style={{
                  fontFamily:"Rajdhani,sans-serif", fontSize:"13px", fontWeight:700,
                  padding:"4px 10px", borderRadius:"6px", cursor:"pointer",
                  border: formation===f ? "1.5px solid #00e87a" : "1px solid rgba(255,255,255,0.1)",
                  background: formation===f ? "rgba(0,232,122,0.1)" : "transparent",
                  color: formation===f ? "#00e87a" : "rgba(240,244,248,0.45)",
                  transition:"all 0.15s ease",
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Live feed */}
          <div className="glass" style={{ padding:"14px 16px", flex:1, minHeight:"220px",
            display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
              <span style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"11px", fontWeight:700,
                color:"rgba(240,244,248,0.35)", letterSpacing:"0.14em", textTransform:"uppercase" }}>LIVE FEED</span>
              {isLive && <LiveBadge/>}
            </div>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"2px" }}>
              {events.length === 0
                ? <div style={{ textAlign:"center", padding:"24px 0", color:"rgba(240,244,248,0.22)",
                    fontFamily:"Inter,sans-serif", fontSize:"12px" }}>⏳ Waiting for kick-off…</div>
                : events.map((ev,i) => <MatchEventRow key={ev.id??i} event={ev} isNew={i===0}/>)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
