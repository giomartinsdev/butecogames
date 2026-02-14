export type RouletteStatus = "betting" | "spinning" | "completed";

export type RouletteBetType =
  | "red"
  | "black"
  | "odd"
  | "even"
  | "low"
  | "high"
  | `number:${number}`
  | `dozen:${1 | 2 | 3}`
  | `column:${1 | 2 | 3}`;

export interface RouletteRound {
  _id: string;
  roundNumber: number;
  seedHash: string;
  seed: string | null;
  result: number | null;
  status: RouletteStatus;
  startedAt: string;
  completedAt: string | null;
}

export interface RouletteBet {
  _id: string;
  roundId: string;
  userId: string;
  betType: RouletteBetType;
  amount: number;
  payout: number | null;
  won: boolean | null;
  createdAt: string;
}

export interface RouletteState {
  round: RouletteRound | null;
  timeRemaining: number;
  status: RouletteStatus;
  recentResults: number[];
  currentBets: RouletteBetDisplay[];
}

export interface RouletteBetDisplay {
  userId: string;
  displayName: string;
  betType: RouletteBetType;
  amount: number;
}

export interface RouletteWinner {
  userId: string;
  displayName: string;
  payout: number;
}
