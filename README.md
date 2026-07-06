# World Cup Draft Arena (working title)

A multiplayer take on "7a0 - World Cup Simulator": live drafting against other coaches, a
Winning-Eleven-style live match phase, brackets, spectator mode, ladder, and a tamper-evident
audit ledger so match/draft results can't be silently edited in the DB.

## Stack

- Frontend: Next.js (TypeScript, App Router) + @microsoft/signalr client
- Backend: ASP.NET Core 8 Web API + SignalR + EF Core (Npgsql)
- DB: PostgreSQL
- Integrity: SHA-256 hash-chained audit log (see "On the blockchain requirement" below)

## On the blockchain requirement

A real smart-contract/blockchain layer (e.g. writing every draft pick or match tick on-chain)
adds seconds of latency and gas-style cost per write, which is incompatible with a live,
tick-by-tick match engine. Instead, `AuditChainService` implements the property you actually
want — **no one can quietly edit a row without it being detectable** — using a hash chain
stored in Postgres:

- Every meaningful action (draft pick, sub, tactic change, match result) is appended to
  `audit_log` as `hash = SHA256(prevHash + payload + timestamp)`.
- The chain can be independently re-verified end to end via `GET /api/audit/verify`.
- If any historical row is edited, every hash after it breaks, and verification fails.

This gives tamper-evidence without the latency/cost problems of a real blockchain. If you
later want fully decentralized/public verifiability (e.g. anchoring the final chain hash to a
public chain periodically), that can be layered on top without changing the live game path.

## Running locally

```bash
docker compose up --build
```

- Postgres: localhost:5432
- Backend API/SignalR: http://localhost:8080
- Frontend: http://localhost:3000

## Project layout

```
backend/WorldCup.Api/
  Models/       EF Core entities (Player, NationalSquad, DraftSession, MatchState, AuditLogEntry, ...)
  Data/         AppDbContext + seed data (historical squads)
  Services/     DraftService, ChemistryCalculator, MatchEngine, AuditChainService, BracketService
  Hubs/         DraftHub (live draft), MatchHub (live match + spectator broadcast)
  Controllers/  Lobby, Leaderboard, Audit (REST)

frontend/app/
  page.tsx                     Lobby
  draft/[sessionId]/page.tsx   Live draft room
  match/[matchId]/page.tsx     Live match HUD (subs, tactics, cards)
  bracket/[tournamentId]/page.tsx  Tournament bracket
  spectate/page.tsx            Browse + watch other ongoing matches
```

## Status

Core vertical slice: draft engine, chemistry, match engine (subs/tactics/cards/injuries/ETs/
penalties), brackets, spectator broadcast, ladder, and the audit chain are implemented.
Cosmetics/store and the full auction-bidding UI are stubbed as follow-ups — see task list.

No .NET SDK was available in the build sandbox, so the backend could not be compiled here.
Run `dotnet build` locally after `dotnet restore` to verify before first run.
