# UNO Game Implementation Prompt

Implement a fully functional UNO card game for the Buteco Games platform. The game should follow standard UNO rules with multiplayer support.

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
- Each player starts with 7 cards
- Match card by color OR value (or play wild cards)
- Draw one card if can't play (or draw two if challenged on +4, implement basic version first)
- First to empty hand wins
- Say "UNO" when down to 1 card (automatic for simplicity, or add button to call out)
- Special cards:
  - Skip: Next player misses turn
  - Reverse: Change direction (for 2 players, acts as skip)
  - +2: Next player draws 2 cards and misses turn
  - Wild: Player chooses next color
  - +4: Player chooses next color, next player draws 4 and misses turn

**Game Flow:**
1. Players join lobby (min 2, max 10)
2. When ready, deal 7 cards to each, flip one card from deck as discard pile
3. Play continues clockwise (initially), each player plays a valid card or draws
4. Wild card players choose color via UI
5. Round ends when a player plays their last card
6. Winner earns coins based on sum of other players' remaining cards

**Scoring (coins):**
- Winner gets sum of all other players' card values
- Card values: 0-9 = face value, Action cards = 20, Wild cards = 50
- Optional: Multiplier based on number of players

## Implementation Requirements

### Shared Package (`packages/shared/`)

1. **Types** in `packages/shared/src/types/uno.ts`:
```typescript
export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | '+2' | 'wild' | '+4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface UnoPlayer {
  userId: string;
  displayName: string;
  hand: Card[];
  saidUno: boolean;
}

export type UnoDirection = 'clockwise' | 'counterclockwise';

export interface UnoGameState {
  gameId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: UnoPlayer[];
  currentPlayerIndex: number;
  direction: UnoDirection;
  deck: Card[];
  discardPile: Card[];
  currentColor: CardColor; // For wild cards
  currentCard: Card | null;
  winner: string | null;
  turnExpiresAt: number; // Timestamp for turn timeout
}
```

2. **Socket Events** in `packages/shared/src/socket.ts` (extend existing):
```typescript
// Client → Server
'uno:join': { roomId: string }
'uno:leave': {}
'uno:play_card': { cardId: string; chosenColor?: CardColor }
'uno:draw_card': {}
'uno:call_uno': { call: boolean }

// Server → Client
'uno:state': UnoGameState
'uno:card_played': { userId: string; card: Card; chosenColor?: CardColor }
'uno:card_drawn': { userId: string; card: Card | null }
'uno:player_joined': { userId: string; displayName: string }
'uno:player_left': { userId: string }
'uno:game_started': { gameState: UnoGameState }
'uno:turn_changed': { currentPlayerIndex: number; direction: UnoDirection }
'uno:color_changed': { color: CardColor }
'uno:round_ended': { winnerId: string; winnings: Record<string, number> }
'uno:error': { message: string }
```

### Server Package (`packages/server/`)

1. **Game Engine** in `packages/server/src/services/uno.ts`:
   - Create full deck function
   - Shuffle function
   - Deal initial hands
   - Validate playable cards (color match, value match, wild)
   - Play card with special card logic
   - Draw card from deck
   - Handle turn progression with direction
   - Handle turn timeout (auto-draw after 30s)
   - Handle player leaving mid-game (return cards to deck, adjust turn)

2. **Routes** in `packages/server/src/routes/uno.ts`:
   - GET `/api/uno/rooms` - List available rooms
   - POST `/api/uno/rooms` - Create new room
   - GET `/api/uno/rooms/:roomId` - Room details

3. **Socket Handlers** in `packages/server/src/socket/uno.ts`:
   - Join/leave room handlers
   - Play card handler with validation
   - Draw card handler
   - Turn timeout timer
   - Start game (when enough players ready)

4. **Migrate to MongoDB** (optional for UNO):
   - `UnoRound` model for game history/scoring records

### Client Package (`packages/client/`)

1. **UI Components** in `packages/client/src/components/uno/`:
   - `UnoGame.tsx` - Main game container
   - `UnoCard.tsx` - Card display with color/value
   - `UnoHand.tsx` - Player's hand
   - `UnoOpponent.tsx` - Other players (show card count)
   - `UnoPile.tsx` - Draw pile + discard pile
   - `UnoColorPicker.tsx` - Color selection for wild cards
   - `UnoTurnIndicator.tsx` - Show current player & direction
   - `UnoLobby.tsx` - Waiting room with player list

2. **State** in `packages/client/src/stores/uno.ts` (Zustand):
   - Current game state
   - Local player hand
   - Turn countdown

3. **Pages** in `packages/client/src/pages/uno.tsx`:
   - Full game page

4. **Visual Design:**
   - Cards: Colored rectangles with large numbers/symbols
   - Colors: Red (#FF5555), Blue (#5555FF), Green (#55AA55), Yellow (#FFAA00)
   - Wild cards: Multi-colored or rainbow gradient
   - Animations: Card play, draw, turn change
   - Responsive layout for 2-10 players

5. **Add to navigation:**
   - Update `packages/client/src/App.tsx` to include UNO in game list
   - Add UNO icon/link

### Admin Configuration

Add UNO settings to `Settings` model:
- `uno.minPlayers` (default 2)
- `uno.maxPlayers` (default 10)
- `uno.turnTimeout` (default 30000ms)
- `uno.initialCoins` (optional base bet to join)

## Additional Features

- **Sound effects**: Card flip, play, win
- **Chat integration**: Reuse existing chat system
- **Spectator mode**: Watch ongoing games
- **Game history**: Past games leaderboard
- **Achievements**: First win, fast win, +4 revenge
- **XP system**: Earn XP based on game participation

## Testing Considerations

- Test special card behaviors (skip, reverse, +2, wild, +4)
- Test with 2 players (reverse acts as skip)
- Test with 10 players
- Test turn timeout auto-draw
- Test player leaving mid-game
- Test concurrent card plays (validate turn)

Use this prompt to implement the UNO game following the existing project architecture patterns (Roulette and Event Betting as references).
