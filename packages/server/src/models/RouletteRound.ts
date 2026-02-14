import mongoose, { Schema, type Document } from "mongoose";
import type { RouletteStatus } from "@butecogames/shared";

export interface IRouletteRound extends Document {
  roundNumber: number;
  seedHash: string;
  seed: string | null;
  result: number | null;
  status: RouletteStatus;
  startedAt: Date;
  completedAt: Date | null;
}

const rouletteRoundSchema = new Schema<IRouletteRound>({
  roundNumber: { type: Number, required: true, unique: true, index: true },
  seedHash: { type: String, required: true },
  seed: { type: String, default: null },
  result: { type: Number, default: null, min: 0, max: 36 },
  status: {
    type: String,
    required: true,
    enum: ["betting", "spinning", "completed"],
    default: "betting",
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

rouletteRoundSchema.index({ status: 1 });
rouletteRoundSchema.index({ completedAt: -1 });

export const RouletteRound = mongoose.model<IRouletteRound>(
  "RouletteRound",
  rouletteRoundSchema,
);
