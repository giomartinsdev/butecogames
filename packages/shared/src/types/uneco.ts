// === Card Types ===
export type UnecoCardColor = "red" | "blue" | "green" | "yellow";
export type WildColor = "wild";
export type AnyCardColor = UnecoCardColor | WildColor;
export type UnecoCardValue =
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

export interface UnecoCard {
  id: string;
  color: AnyCardColor;
  value: UnecoCardValue;
}

// === Player Types ===
export interface UnecoPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  cardCount: number;
  isReady: boolean;
  saidUneco: boolean;
  connected: boolean;
}

export type UnecoDirection = "clockwise" | "counterclockwise";

export type UnecoRoomStatus =
  | "waiting"
  | "starting"
  | "playing"
  | "finished"
  | "cancelled";

// === Room Info (lobby listing) ===
export interface UnecoRoomInfo {
  roomId: string;
  owner: { userId: string; displayName: string; avatar: string };
  betAmount: number;
  maxPlayers: number;
  playerCount: number;
  status: UnecoRoomStatus;
  createdAt: string;
}

// === Game State (sent to a specific player) ===
export interface UnecoGameState {
  roomId: string;
  status: UnecoRoomStatus;
  betAmount: number;
  maxPlayers: number;
  players: UnecoPlayer[];
  currentPlayerIndex: number;
  direction: UnecoDirection;
  discardTop: UnecoCard | null;
  currentColor: UnecoCardColor;
  deckCount: number;
  hand: UnecoCard[];
  turnTimeRemaining: number;
  winner: string | null;
  spectatorCount: number;
  unecoCatchable: string | null;
  drawStack: number;
}

// === Match History ===
export interface UnecoMatchHistory {
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
