# UNECO Game Implementation Spec

Fully functional UNECO (formerly UNO) card game for the Buteco Games platform. Standard UNO-style rules with multiplayer support, coin betting, and forfeit mechanics.

## Core Game Mechanics

**Deck Composition (108 cards):**
- Number cards (0-9): 4 colors (Red, Blue, Green, Yellow), one 0 per color, two of each 1-9 per color = 76 cards
- Action cards (20 total): Skip, Reverse, Draw Two (2 of each per color)
- Wild cards (12 total): Wild (4), Wild Draw Four (4)

**Card Types & Colors:**
- Colors: `red`, `blue`, `green`, `yellow`, `wild`
- Values: `0-9`, `skip`, `reverse`, `+2`, `wild`, `+4`

**Rules:**
- 2-10 players per game
- Each player starts with 7 cards (configurable via `DEFAULT_UNECO_START_CARDS`)
- Match card by color OR value (or play wild cards)
- Draw one card if can't play
- First to empty hand wins
- Players must press "UNECO!" button before playing when at 2 cards — failing to do so incurs a 1-card penalty and skips their turn
- Other players can "catch" someone who didn't say UNECO within a configurable catch window
- **Draw stacking**: +2 and +4 cards can be stacked; if a player has no +2/+4 to stack, they draw the accumulated total
- Special cards:
  - Skip: Next player misses turn
  - Reverse: Change direction (for 2 players, acts as skip)
  - +2: Adds 2 to draw stack, next player must stack or draw accumulated total
  - Wild: Player chooses next color
  - +4: Adds 4 to draw stack, player chooses next color

**Betting System:**
- Players bet coins to join a room (configurable min/max bet)
- All players' bets are debited at game start
- Winner receives the full pot (betAmount × playerCount)
- If a player can't afford the bet at game start, all bets are refunded and the room is cancelled

**Forfeit System:**
- Players can forfeit mid-game via a "Desistir" button with confirmation modal
- **2-player match**: Forfeiting player loses, opponent wins immediately and receives the full pot
- **3+ player match**: Forfeiting player is removed from the game; play continues with remaining players. If only 1 player remains, they win

**Game Flow:**
1. Player creates a room (sets bet amount + max players)
2. Other players join the room in lobby
3. All players mark ready; room owner starts the game
4. Coins are debited from all players
5. Deal 7 cards to each, flip one card from deck as discard pile (re-draw if wild/+4)
6. If starting card is an action card, its effect is applied to the first player
7. Play continues clockwise (initially) with turn timer
8. Wild card players choose color via color picker UI
9. Round ends when a player plays their last card
10. Winner receives the full pot; results screen shown for 10 seconds

**Disconnect Handling:**
- During play: disconnect timer starts (configurable grace period)
- Countdown is broadcast to all players
- If player reconnects, timer is cancelled and they resume
- If timer expires, treated as forfeit (player removed, same logic as forfeit for remaining player count)
- During waiting: 10-second grace period for page refreshes

## Implementation Structure

### Shared Package (`packages/shared/`)

**Types** in `packages/shared/src/types/uneco.ts`:
- `UnecoCardColor`, `UnecoCardValue`, `UnecoCard` — card data
- `UnecoPlayer` — player state (userId, displayName, avatar, cardCount, isReady, saidUneco, connected)
- `UnecoDirection` — `clockwise` | `counterclockwise`
- `UnecoRoomStatus` — `waiting` | `starting` | `playing` | `finished` | `cancelled`
- `UnecoRoomInfo` — lobby listing data
- `UnecoGameState` — full game state sent to each player (personalized hand)
- `UnecoMatchHistory` — match history record

**Constants** in `packages/shared/src/constants/uneco.ts`:
- `UNECO_COLORS`, `UNECO_NUMBER_VALUES`, `UNECO_ACTION_VALUES`, `UNECO_WILD_VALUES`
- `UNECO_CARD_POINTS` — point values per card type
- `UNECO_COLOR_HEX` — hex colors for rendering
- `DEFAULT_UNECO_*` — default settings (min/max players, turn timeout, bet limits, catch window, disconnect grace, start cards)

**Socket Events** in `packages/shared/src/types/socket.ts`:

```
Client → Server:
  uneco:join_lobby        — Join the lobby room
  uneco:leave_lobby       — Leave the lobby room
  uneco:create_room       — Create a new room { betAmount, maxPlayers }
  uneco:join_room         — Join existing room { roomId }
  uneco:leave_room        — Leave current room
  uneco:player_ready      — Toggle ready status
  uneco:start_game        — Start the game (owner only)
  uneco:play_card         — Play a card { cardId, chosenColor? }
  uneco:draw_card         — Draw a card
  uneco:say_uneco         — Say UNECO
  uneco:catch_uneco       — Catch someone { targetUserId }
  uneco:forfeit           — Forfeit the match
  uneco:spectate          — Spectate a room { roomId }
  uneco:stop_spectating   — Stop spectating

Server → Client:
  uneco:lobby_state       — Full lobby state { rooms }
  uneco:lobby_update      — Updated lobby state { rooms }
  uneco:room_joined       — Joined a room { gameState }
  uneco:game_state        — Updated game state { gameState }
  uneco:player_joined     — Player joined { player }
  uneco:player_left       — Player left { userId }
  uneco:player_ready      — Player toggled ready { userId }
  uneco:game_started      — Game started { gameState }
  uneco:card_played       — Card was played { userId, card, chosenColor?, newCurrentPlayer, direction, cardCount }
  uneco:card_drawn        — Card was drawn { userId, cardCount, card? }
  uneco:turn_changed      — Turn changed { currentPlayerIndex, timeRemaining, drawStack }
  uneco:uneco_said        — Player said UNECO { userId }
  uneco:uneco_caught      — Player caught without UNECO { catcherId, targetId, penaltyCards }
  uneco:uneco_catchable   — Player is catchable { userId }
  uneco:uneco_penalty     — UNECO penalty applied { userId, penaltyCards }
  uneco:round_ended       — Game ended { winnerId, winnerName, payout, players }
  uneco:player_forfeited  — Player forfeited { userId, winnerId?, winnerName?, payout? }
  uneco:room_closed       — Room closed { reason }
  uneco:player_disconnected — Player disconnected { userId, countdown }
  uneco:player_reconnected  — Player reconnected { userId }
  uneco:spectator_count   — Updated spectator count { count }
  uneco:error             — Error message { message }
```

### Server Package (`packages/server/`)

**Game Engine** in `packages/server/src/services/uneco.ts`:
- Deck generation, shuffle, draw, reshuffle discard pile
- Card playability validation (color/value match, wild, draw stack)
- Room lifecycle: create → join → ready → start → play → resolve/forfeit
- Turn management with configurable timeout and auto-draw
- UNECO call & catch mechanics with catchable window timer
- Forfeit handling: `forfeitGame()` — 2-player instant win vs 3+ player removal
- Disconnect/reconnect with grace period timers
- Spectator support
- Personalized game state emission (each player sees only their own hand)
- Wallet integration: debit on game start, credit winner on resolve

**DB Model** in `packages/server/src/models/UnecoRoom.ts`:
- MongoDB model for room/match history (players, winner, payout, duration)

**Routes** in `packages/server/src/routes/uneco.ts`:
- `GET /api/uneco/history` — Match history (paginated)
- `GET /api/uneco/stats` — Player stats

**Socket Handlers** in `packages/server/src/socket/uneco.ts`:
- All socket event handlers delegating to service functions
- Reconnect detection on lobby join

### Client Package (`packages/client/`)

**Components** in `packages/client/src/components/uneco/`:
- `UnecoCard.tsx` — Card display with color backgrounds from `UNECO_COLOR_HEX`
- `UnecoHand.tsx` — Player's hand with playable card highlighting
- `UnecoOpponent.tsx` — Opponent display (avatar, card count, UNECO badge, disconnect state)
- `UnecoPile.tsx` — Draw pile + discard pile + current color indicator
- `UnecoColorPicker.tsx` — Color selection modal for wild cards
- `UnecoTurnIndicator.tsx` — Current player & direction indicator with timer
- `UnecoLobby.tsx` — Room listing & creation
- `UnecoRoom.tsx` — Waiting room (player list, ready/start) + routes to GameBoard or Results
- `UnecoGameBoard.tsx` — Main game board with opponents, pile, hand, UNECO button, forfeit button with confirmation modal
- `UnecoResults.tsx` — Round results display

**State** in `packages/client/src/stores/unecoStore.ts` (Zustand):
- Lobby rooms, game state, lobby flag, color picker state

**Hook** in `packages/client/src/hooks/useUneco.ts`:
- Socket event listeners for all server events
- Client-side turn countdown timer
- Action callbacks: createRoom, joinRoom, leaveRoom, setReady, startGame, playCard, drawCard, sayUneco, catchUneco, forfeitGame, spectate, stopSpectating
- Optimistic updates (e.g., removing played card from hand immediately)

**Page** in `packages/client/src/pages/UnecoPage.tsx`:
- Main page rendering lobby or room based on state

**API** in `packages/client/src/api/uneco.ts`:
- `fetchUnecoHistory()` — paginated match history
- `fetchUnecoStats()` — player statistics

### Admin Configuration

UNECO settings in `Settings` model (via `AdminSettingsPage`):
- `uneco.minPlayers` (default 2)
- `uneco.maxPlayers` (default 10)
- `uneco.turnTimeout` (default 30s)
- `uneco.minBet` (default 10)
- `uneco.maxBet` (default 10,000)
- `uneco.catchWindow` (default 5s)
- `uneco.disconnectGrace` (default 30s)
- `uneco.startCards` (default 7)

## Additional Features

- **Sound effects**: Win/lose sounds on game end
- **Spectator mode**: Watch ongoing games with spectator count display
- **Game history**: Match history with pagination
- **Gamification**: XP and achievements via `processAction` on bet placed/won
- **Toast notifications**: For all game events (card played, UNECO said/caught, disconnect/reconnect, forfeit, errors)
- **Presence integration**: Shows "UNECO" as current activity in online users list
