import mongoose, { Schema, type Document } from "mongoose";
import type { UnecoRoomStatus } from "@butecogames/shared";

export interface IUnecoRoom extends Document {
  creatorId: string;
  betAmount: number;
  maxPlayers: number;
  status: UnecoRoomStatus;
  players: Array<{
    userId: string;
    displayName: string;
    cardsLeft: number;
  }>;
  winnerId: string | null;
  winnerName: string | null;
  payout: number;
  duration: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

const unecoRoomSchema = new Schema<IUnecoRoom>(
  {
    creatorId: { type: String, required: true, index: true },
    betAmount: { type: Number, required: true, min: 1 },
    maxPlayers: { type: Number, required: true, min: 2, max: 10 },
    status: {
      type: String,
      enum: ["waiting", "starting", "playing", "finished", "cancelled"],
      default: "waiting",
      index: true,
    },
    players: [
      {
        userId: { type: String, required: true },
        displayName: { type: String, required: true },
        cardsLeft: { type: Number, default: 0 },
      },
    ],
    winnerId: { type: String, default: null },
    winnerName: { type: String, default: null },
    payout: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

unecoRoomSchema.index({ "players.userId": 1, status: 1 });
unecoRoomSchema.index({ status: 1, createdAt: -1 });

export const UnecoRoom = mongoose.model<IUnecoRoom>("UnecoRoom", unecoRoomSchema);
