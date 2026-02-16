# Buteco Games

Gaming platform for Discord communities. Users log in via Discord, play games, bet with virtual currency (coins), and compete on leaderboards.

## Tech Stack

- **Monorepo**: pnpm workspaces (`packages/shared`, `packages/server`, `packages/client`)
- **Backend**: Node.js + Express 5 + Socket.io + Mongoose (MongoDB)
- **Authentication**: Better Auth with Discord OAuth2 (`better-auth`, `better-auth/adapters/mongodb`)
- **Frontend**: React 19 + Vite 6 + TailwindCSS v4 + TanStack Query + Zustand
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
docker-compose up     # MongoDB on 27017, Server on 3001, Client on 80 (nginx)
```

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Auth encryption key (min 32 chars, generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Backend base URL (e.g., `http://localhost:3001`) |
| `DISCORD_CLIENT_ID` | Discord OAuth2 client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth2 client secret |
| `DISCORD_GUILD_ID` | Discord server ID to restrict access to guild members only |
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | Environment (`development` or `production`) |
| `VITE_API_URL` | Client-side API base URL (default: `http://localhost:3001`) |
| `VITE_WS_URL` | Client-side WebSocket URL (default: `http://localhost:3001`) |

Discord redirect URL must be set to: `{BETTER_AUTH_URL}/api/auth/callback/discord`

## Architecture

### Authentication (Better Auth)

- Server: `packages/server/src/lib/auth.ts` — Better Auth instance with MongoDB adapter + Discord provider
- Client: `packages/client/src/lib/auth-client.ts` — Better Auth React client
- Better Auth handles routes at `/api/auth/*` (mounted before express.json())
- Session is cookie-based (managed by Better Auth, stored in MongoDB)
- Discord scopes: `identify`, `email`, `guilds`, `guilds.members.read`
- Guild membership validated on login — non-members are blocked with `?error=guild` redirect
- Guild nickname/display name synced to UserProfile on login
- Protected routes use `requireAuth` middleware (`packages/server/src/middleware/auth.ts`)
- Admin routes use `requireAdmin` middleware (`packages/server/src/middleware/admin.ts`)
- Socket.io auth extracts session cookie from handshake headers, blocks banned users

### Database (MongoDB / Mongoose)

Better Auth manages: `user`, `session`, `account` collections.

App models:
- `UserProfile` — Game-specific data (XP, level, role, banned status, achievements)
- `Wallet` — Balance, totalWagered, totalWon
- `Transaction` — Ledger of all balance changes (atomic with `$inc`). Types: `initial_balance`, `daily_reward`, `bet_placed`, `bet_won`, `bet_refund`, `achievement_reward`, `transfer_sent`, `transfer_received`
- `RouletteRound` — Round data (seed, hash, result, status)
- `RouletteBet` — Individual bets per round
- `EventBettingEvent` — Event data (title, category, options, pools, status, result)
- `EventBettingBet` — Individual bets per event (option, amount, potential/actual payout)
- `Settings` — App-wide configurable settings (roulette timings/limits, event betting limits, cursor size)
- `UserSettings` — Per-user preferences (cursor set selection)

### API Endpoints

| Method | Path | Description |
|---|---|---|
| ALL | `/api/auth/*` | Better Auth (login, callback, session) |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/users/:userId` | User profile by ID |
| GET | `/api/wallet` | Wallet balance |
| GET | `/api/wallet/transactions` | Transaction history (paginated) |
| POST | `/api/wallet/daily-reward` | Claim daily reward |
| GET | `/api/wallet/search-users?q=` | Search users for transfer (min 2 chars) |
| POST | `/api/wallet/transfer` | Transfer coins to another user `{ recipientId, amount }` |
| GET | `/api/games` | List available games |
| GET | `/api/leaderboard?type=coins\|xp\|wins` | Leaderboard (top 50, 5min cache) |
| GET | `/api/event-betting/events` | List events with odds (optional `?status=` filter) |
| GET | `/api/event-betting/events/:eventId` | Single event with odds |
| GET | `/api/event-betting/my-bets` | User's bets (optional `?eventId=` filter) |
| POST | `/api/event-betting/events` | Create event (admin) |
| PUT | `/api/event-betting/events/:eventId/status` | Update event status (admin) |
| POST | `/api/event-betting/events/:eventId/resolve` | Resolve event and pay winners (admin) |
| GET | `/api/settings` | Get app settings (admin) |
| PUT | `/api/settings` | Update app settings (admin) |
| GET | `/api/user-settings` | Get user settings |
| PUT | `/api/user-settings` | Update user settings `{ cursorSetId }` |
| GET | `/api/admin/users` | List users with profiles (admin, paginated, searchable) |
| PUT | `/api/admin/users/:userId/role` | Toggle user role (admin) `{ role }` |
| PUT | `/api/admin/users/:userId/ban` | Ban/unban user (admin) `{ banned }` |
| GET | `/api/health` | Health check |

### Socket Events

**Client → Server:**
- `roulette:join` — Join roulette room
- `roulette:leave` — Leave roulette room
- `roulette:place_bet` `{ betType, amount }` — Place a bet
- `chat:message` `{ message }` — Send chat message (rate-limited 2s, max 500 chars)
- `event:join` — Join event betting room
- `event:leave` — Leave event betting room
- `event:place_bet` `{ eventId, option, amount }` — Place event bet

**Server → Client:**
- `roulette:state` `{ roundNumber, status, timeRemaining, seedHash, recentResults, currentBets, minBet, maxBet, maxBetsPerRound }` — Full state on join
- `roulette:betting_open` `{ roundNumber, seedHash, timeRemaining }` — New round
- `roulette:bet_placed` `{ userId, displayName, betType, amount }` — Someone bet
- `roulette:betting_closed` — No more bets
- `roulette:result` `{ result, seed, winners }` — Round result
- `roulette:error` `{ message }` — Error
- `chat:new_message` `{ userId, displayName, message, timestamp }` — Chat message
- `user:level_up` `{ level, xp }` — Level up notification
- `user:achievement` `{ achievementId, name, reward }` — Achievement unlocked
- `event:events_update` `{ events }` — Events list updated
- `event:odds_update` `{ eventId, odds, totalPool, option1Pool, option2Pool, drawPool }` — Odds changed
- `event:bet_placed` `{ eventId, option, amount }` — Someone bet on event
- `event:event_result` `{ eventId, result, winners }` — Event resolved
- `event:error` `{ message }` — Event betting error
- `presence:online_users` `{ users }` — Online users list on connect
- `presence:user_joined` `{ user }` — User came online
- `presence:user_left` `{ userId }` — User went offline
- `wallet:updated` `{ balance }` — Wallet balance changed (user-specific room)
- `settings:cursor_size` `{ cursorSize }` — Admin changed cursor size (broadcast)

## Games

### Roulette (Active)

- European roulette: numbers 0-36
- Bet types: Red/Black (2x), Odd/Even (2x), Low/High (2x), Dozens (3x), Single number (36x)
- Round cycle: 10s betting → 5s spinning → 5s result display → repeat (all durations admin-configurable)
- Provably fair: seed hash committed before betting, seed revealed after spin
- Default limits: Min bet 10, Max bet 10,000, Max 5 bets per round (all admin-configurable)
- All players share one global room (no room creation needed)
- Stale rounds from server crashes are auto-refunded on startup
- Engine: `packages/server/src/services/roulette.ts`

### Event Betting (Active)

- Parimutuel odds system with configurable house edge (default 5%)
- Categories: UFC, Sports, eSports, Entertainment, Other
- Events support two options + optional draw
- Event lifecycle: upcoming → in_progress → completed/cancelled
- Auto-closes events when startTime passes (background job every 60s)
- Admin creates events, updates status, and resolves results (triggers payouts)
- Default limits: Min bet 10, Max bet 10,000, Max 3 bets per event (all admin-configurable)
- Engine: `packages/server/src/services/event-betting.ts`

## Admin System

- Roles: `user` (default) and `admin`
- Admin panel at `/admin` with sub-pages: event management, settings, user management
- Admins can: create/manage events, configure game settings, toggle user roles, ban/unban users
- Banned users are blocked from API (requireAuth) and Socket.io connections
- Banning disconnects all active sockets for that user

## Currency System

- Initial balance: 1,000 coins on first login
- Daily reward: 100 coins (24h cooldown)
- P2P transfers: send coins to other users (with user search)
- Achievement rewards: variable
- Bet refunds: automatic on server crash (stale roulette rounds)
- All wallet operations use atomic MongoDB `$inc` with balance guards to prevent overdraw
- Real-time balance updates via `wallet:updated` socket event
- Wallet service: `packages/server/src/services/wallet.ts`

## Features

### Cursor Customization
- 16 custom cursor sets (PNG/GIF) with normal + pointer variants
- Users choose cursor in settings page, stored in UserSettings
- Admin-configurable cursor size (broadcast via socket)
- GIF cursors use JS overlay; static cursors use canvas resizing

### Presence Tracking
- Real-time online user tracking via Socket.io
- Online count + user list displayed in header
- Service: `packages/server/src/services/presence.ts`

### Configurable Settings
- All game parameters (durations, bet limits, house edge) are admin-configurable at runtime
- Stored in `Settings` model, cached in memory
- Service: `packages/server/src/services/settings.ts`

## Coding Conventions

- TypeScript strict mode everywhere
- ESM (`"type": "module"`) in all packages
- Import paths use `.js` extension (TypeScript ESM resolution)
- Shared types/constants go in `packages/shared`
- Server state management: Zustand not used (only client-side)
- Client state: Zustand for socket/local state, TanStack Query for server data (never mix)
- Integer coins only (no floating point for currency)
- All text in Portuguese (pt-BR) in the UI
