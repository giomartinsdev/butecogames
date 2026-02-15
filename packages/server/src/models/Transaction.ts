import mongoose, { Schema, type Document } from "mongoose";
import type { TransactionType } from "@butecogames/shared";

export interface ITransaction extends Document {
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  gameId?: string;
  roundId?: string;
  eventId?: string;
  achievementId?: string;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["initial_balance", "daily_reward", "bet_placed", "bet_won", "achievement_reward"],
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    gameId: String,
    roundId: String,
    eventId: String,
    achievementId: String,
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);
