// === Card Types ===
export type CardSuit = "spades" | "hearts" | "diamonds" | "clubs";
export type CardRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
// 11=J, 12=Q, 13=K, 14=A

export interface Card {
  rank: CardRank;
  suit: CardSuit;
}

// === Room Types ===
export type CardDuelGameType = "classic" | "best_of_3";

export type CardDuelRoomStatus =
  | "waiting"
  | "ready"
  | "in_progress"
  | "finished"
  | "revenge_pending"
  | "revenge_declined"
  | "cancelled";

export type CardDuelRoundResult = "player1" | "player2" | "draw";
export type CardDuelMatchResult = "player1" | "player2" | "draw";

export interface CardDuelRoundData {
  roundNumber: number;
  player1Card: Card;
  player2Card: Card;
  result: CardDuelRoundResult;
}

export interface CardDuelPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  isReady: boolean;
}

// Client-facing room info (for lobby listing)
export interface CardDuelRoomInfo {
  roomId: string;
  owner: { userId: string; displayName: string; avatar: string };
  betAmount: number;
  gameType: CardDuelGameType;
  status: CardDuelRoomStatus;
  playerCount: number;
  createdAt: string;
}

// Full room state (sent to players in the room)
export interface CardDuelRoomState {
  roomId: string;
  gameType: CardDuelGameType;
  betAmount: number;
  status: CardDuelRoomStatus;
  isBot: boolean;
  player1: CardDuelPlayer | null;
  player2: CardDuelPlayer | null;
  currentRound: number;
  rounds: CardDuelRoundData[];
  player1Score: number;
  player2Score: number;
  matchResult: CardDuelMatchResult | null;
  revengeCountdown: number;
  revengeAccepted: Record<string, boolean>;
  disconnectedPlayer: string | null;
  disconnectCountdown: number;
  cardRevealCountdown: number;
}

// Match history record (for profile)
export interface CardDuelMatchHistory {
  _id: string;
  roomId: string;
  gameType: CardDuelGameType;
  betAmount: number;
  isBot: boolean;
  player1: { userId: string; displayName: string };
  player2: { userId: string; displayName: string };
  rounds: CardDuelRoundData[];
  result: CardDuelMatchResult;
  winnerId: string | null;
  createdAt: string;
}
