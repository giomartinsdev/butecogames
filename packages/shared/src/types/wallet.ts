export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  totalWagered: number;
  totalWon: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | "initial_balance"
  | "daily_reward"
  | "bet_placed"
  | "bet_won"
  | "bet_refund"
  | "achievement_reward"
  | "transfer_sent"
  | "transfer_received"
  | "presence_reward";

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  gameId?: string;
  roundId?: string;
  eventId?: string;
  achievementId?: string;
  relatedUserId?: string;
  relatedUserName?: string;
  createdAt: string;
}
