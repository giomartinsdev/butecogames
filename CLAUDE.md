# Buteco Games Unleashed

Gaming platform for Discord communities. Users log in via Discord, play games, bet with virtual currency (coins), and compete on leaderboards.

## Tech Stack

- **Monorepo**: pnpm workspaces (`packages/shared`, `packages/server`, `packages/client`)
- **Backend**: Node.js + Express 5 + Socket.io + Mongoose (MongoDB)
- **Authentication**: Better Auth with Discord OAuth2 (`better-auth`, `better-auth/adapters/mongodb`)
- **Frontend**: React 19 + Vite + TailwindCSS v4 + TanStack Query + Zustand
- **Real-time**: Socket.io (typed with shared interfaces)
- **Language**: TypeScript (strict mode) across all packages
- **Package Manager**: pnpm

## Project Structure

```
packages/
  shared/    → Types, constants, shared between client and server
  server/    → Express API + Socket.io + game engines
  client/    → React SPA (Vite)
```

## How to Run

### Local Development (requires MongoDB running)

```bash
pnpm install
cp .env.example .env  # Fill in Discord credentials and BETTER_AUTH_SECRET
pnpm run build:shared
pnpm run dev           # Starts both server (3001) and client (5173)
```

### Docker

```bash
cp .env.example .env  # Fill in credentials
docker-compose up     # MongoDB on 27017, Server on 3001, Client on 5173
```

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Auth encryption key (min 32 chars, generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Backend base URL (e.g., `http://localhost:3001`) |
| `DISCORD_CLIENT_ID` | Discord OAuth2 client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth2 client secret |
| `CLIENT_URL` | Frontend URL for CORS (e.g., `http://localhost:5173`) |
| `PORT` | Server port (default: 3001) |

Discord redirect URL must be set to: `{BETTER_AUTH_URL}/api/auth/callback/discord`

## Architecture

### Authentication (Better Auth)

- Server: `packages/server/src/lib/auth.ts` — Better Auth instance with MongoDB adapter + Discord provider
- Client: `packages/client/src/lib/auth-client.ts` — Better Auth React client
- Better Auth handles routes at `/api/auth/*` (mounted before express.json())
- Session is cookie-based (managed by Better Auth, stored in MongoDB)
- Protected routes use `requireAuth` middleware (`packages/server/src/middleware/auth.ts`)
- Socket.io auth extracts session cookie from handshake headers

### Database (MongoDB / Mongoose)

Better Auth manages: `user`, `session`, `account` collections.

App models:
- `UserProfile` — Game-specific data (XP, level, role, achievements)
- `Wallet` — Balance, totalWagered, totalWon
- `Transaction` — Ledger of all balance changes (atomic with `$inc`)
- `RouletteRound` — Round data (seed, hash, result, status)
- `RouletteBet` — Individual bets per round

### API Endpoints

| Method | Path | Description |
|---|---|---|
| ALL | `/api/auth/*` | Better Auth (login, callback, session) |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/users/:userId` | User profile by ID |
| GET | `/api/wallet` | Wallet balance |
| GET | `/api/wallet/transactions` | Transaction history (paginated) |
| POST | `/api/wallet/daily-reward` | Claim daily reward |
| GET | `/api/games` | List available games |
| GET | `/api/leaderboard?type=coins\|xp\|wins` | Leaderboard |
| GET | `/api/health` | Health check |

### Socket Events

**Client → Server:**
- `roulette:join` — Join roulette room
- `roulette:leave` — Leave roulette room
- `roulette:place_bet` `{ betType, amount }` — Place a bet
- `chat:message` `{ message }` — Send chat message

**Server → Client:**
- `roulette:state` — Full roulette state on join
- `roulette:betting_open` `{ roundNumber, seedHash, timeRemaining }` — New round
- `roulette:bet_placed` `{ userId, displayName, betType, amount }` — Someone bet
- `roulette:betting_closed` — No more bets
- `roulette:result` `{ result, seed, winners }` — Round result
- `roulette:error` `{ message }` — Error
- `chat:new_message` `{ userId, displayName, message, timestamp }` — Chat message
- `user:level_up` `{ level, xp }` — Level up notification
- `user:achievement` `{ achievementId, name, reward }` — Achievement unlocked

## Games

### Roulette (Active)

- European roulette: numbers 0-36
- Bet types: Red/Black (2x), Odd/Even (2x), Low/High (2x), Dozens (3x), Single number (36x)
- Round cycle: 30s betting → 5s spinning → 5s result display → repeat
- Provably fair: seed hash committed before betting, seed revealed after spin
- Min bet: 10 coins, Max bet: 10,000 coins, Max 5 bets per round
- All players share one global room (no room creation needed)
- Engine: `packages/server/src/services/roulette.ts`

### Sports Betting (Planned)

- Bet on sporting events and eSports
- Rooms created by admins only
- Status: Not yet implemented

## Currency System

- Initial balance: 1,000 coins on first login
- Daily reward: 100 coins (24h cooldown)
- Achievement rewards: variable
- All wallet operations use atomic MongoDB `$inc` with balance guards to prevent overdraw
- Wallet service: `packages/server/src/services/wallet.ts`

## Coding Conventions

- TypeScript strict mode everywhere
- ESM (`"type": "module"`) in all packages
- Import paths use `.js` extension (TypeScript ESM resolution)
- Shared types/constants go in `packages/shared`
- Server state management: Zustand not used (only client-side)
- Client state: Zustand for socket/local state, TanStack Query for server data (never mix)
- Integer coins only (no floating point for currency)
- All text in Portuguese (pt-BR) in the UI
