import mongoose, { Schema, type Document } from "mongoose";
import type {
  CardDuelGameType,
  CardDuelRoomStatus,
  CardDuelMatchResult,
  CardDuelRoundData,
} from "@butecogames/shared";

export interface ICardDuelRoom extends Document {
  gameType: CardDuelGameType;
  betAmount: number;
  status: CardDuelRoomStatus;
  isBot: boolean;
  player1Id: string;
  player1Name: string;
  player2Id: string | null;
  player2Name: string | null;
  rounds: CardDuelRoundData[];
  result: CardDuelMatchResult | null;
  winnerId: string | null;
  payout: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

const cardDuelRoomSchema = new Schema<ICardDuelRoom>(
  {
    gameType: {
      type: String,
      enum: ["classic", "best_of_3"],
      required: true,
    },
    betAmount: { type: Number, required: true, min: 1 },
    isBot: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "waiting",
        "ready",
        "in_progress",
        "finished",
        "revenge_pending",
        "revenge_declined",
        "cancelled",
      ],
      default: "waiting",
      index: true,
    },
    player1Id: { type: String, required: true },
    player1Name: { type: String, required: true },
    player2Id: { type: String, default: null },
    player2Name: { type: String, default: null },
    rounds: { type: Schema.Types.Mixed, default: [] },
    result: {
      type: String,
      enum: ["player1", "player2", "draw", null],
      default: null,
    },
    winnerId: { type: String, default: null },
    payout: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

cardDuelRoomSchema.index({ player1Id: 1, status: 1 });
cardDuelRoomSchema.index({ player2Id: 1, status: 1 });
cardDuelRoomSchema.index({ status: 1, createdAt: -1 });

export const CardDuelRoom = mongoose.model<ICardDuelRoom>(
  "CardDuelRoom",
  cardDuelRoomSchema,
);
