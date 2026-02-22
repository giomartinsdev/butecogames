// === Card Types ===
export type UnoCardColor = "red" | "blue" | "green" | "yellow";
export type WildColor = "wild";
export type AnyCardColor = UnoCardColor | WildColor;
export type UnoCardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "+2"
  | "wild"
  | "+4";

export interface UnoCard {
  id: string;
  color: AnyCardColor;
  value: UnoCardValue;
}

// === Player Types ===
export interface UnoPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  cardCount: number;
  isReady: boolean;
  saidUno: boolean;
  connected: boolean;
}

export type UnoDirection = "clockwise" | "counterclockwise";

export type UnoRoomStatus =
  | "waiting"
  | "starting"
  | "playing"
  | "finished"
  | "cancelled";

// === Room Info (lobby listing) ===
export interface UnoRoomInfo {
  roomId: string;
  owner: { userId: string; displayName: string; avatar: string };
  betAmount: number;
  maxPlayers: number;
  playerCount: number;
  status: UnoRoomStatus;
  createdAt: string;
}

// === Game State (sent to a specific player) ===
export interface UnoGameState {
  roomId: string;
  status: UnoRoomStatus;
  betAmount: number;
  maxPlayers: number;
  players: UnoPlayer[];
  currentPlayerIndex: number;
  direction: UnoDirection;
  discardTop: UnoCard | null;
  currentColor: UnoCardColor;
  deckCount: number;
  hand: UnoCard[];
  turnTimeRemaining: number;
  winner: string | null;
  spectatorCount: number;
  unoCatchable: string | null;
  drawStack: number;
}

// === Match History ===
export interface UnoMatchHistory {
  _id: string;
  roomId: string;
  betAmount: number;
  playerCount: number;
  players: Array<{
    userId: string;
    displayName: string;
    cardsLeft: number;
  }>;
  winnerId: string;
  winnerName: string;
  payout: number;
  duration: number;
  createdAt: string;
}
