export interface Player {
  id: number;
  name: string;
  nation: string;
  era: number;
  position: string;
  rating: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  isJackpot: boolean;
}

export interface NationalSquad {
  id: number;
  nation: string;
  year: number;
  tournament: string;
  isJackpot: boolean;
  players: Player[];
}

export interface RosterSlot {
  id: number;
  coachId: number;
  slotCode: string;
  playerId: number;
  player?: Player;
  isSuspended: boolean;
  isInjured: boolean;
}

export interface Coach {
  id: number;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  bestStreak: number;
  roster: RosterSlot[];
}

export type MatchPhase =
  | "PreMatch" | "FirstHalf" | "HalfTime" | "SecondHalf"
  | "ExtraTime" | "Penalties" | "FullTime";

export type Tactic = "Defensive" | "Balanced" | "Attacking";

export interface MatchEvent {
  id: number;
  matchStateId: number;
  minute: number;
  type: string;
  coachId?: number;
  playerId?: number;
  description: string;
}

export interface MatchState {
  id: number;
  coachAId: number;
  coachBId: number;
  phase: MatchPhase;
  minute: number;
  scoreA: number;
  scoreB: number;
  penaltiesA: number;
  penaltiesB: number;
  tacticA: Tactic;
  tacticB: Tactic;
  possessionA: number;
  shotsA: number;
  shotsB: number;
  foulsA: number;
  foulsB: number;
  subsRemainingA: number;
  subsRemainingB: number;
  events: MatchEvent[];
}

export interface BracketMatch {
  id: number;
  tournamentId: number;
  stage: string;
  coachAId: number;
  coachBId: number;
  winnerCoachId?: number;
  matchStateId: number;
  matchState?: MatchState;
}

export interface Tournament {
  id: number;
  name: string;
  stage: string;
  createdAt: string;
  matches: BracketMatch[];
}

export interface DraftSession {
  id: number;
  roomCode: string;
  mode: string;
  status: string;
  maxCoaches: number;
  currentTurnCoachId: number;
  turnTimeSeconds: number;
  coaches: Coach[];
}
