import mongoose, { Schema, type Document } from "mongoose";
import type { RouletteBetType } from "@butecogames/shared";

export interface IRouletteBet extends Document {
  roundId: mongoose.Types.ObjectId;
  userId: string;
  betType: RouletteBetType;
  amount: number;
  payout: number | null;
  won: boolean | null;
  createdAt: Date;
}

const rouletteBetSchema = new Schema<IRouletteBet>(
  {
    roundId: { type: Schema.Types.ObjectId, required: true, ref: "RouletteRound", index: true },
    userId: { type: String, required: true, index: true },
    betType: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    payout: { type: Number, default: null },
    won: { type: Boolean, default: null },
  },
  { timestamps: true },
);

rouletteBetSchema.index({ roundId: 1, userId: 1 });

export const RouletteBet = mongoose.model<IRouletteBet>("RouletteBet", rouletteBetSchema);
