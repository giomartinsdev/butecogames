import mongoose, { Schema } from "mongoose";
import {
  DEFAULT_MIN_BET,
  DEFAULT_MAX_BET,
  DEFAULT_MAX_BETS_PER_ROUND,
} from "@butecogames/shared";

export interface ISettings {
  _id: string;
  roulette: {
    bettingDuration: number;
    spinningDuration: number;
    resultDuration: number;
    minBet: number;
    maxBet: number;
    maxBetsPerRound: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

const settingsSchema = new Schema(
  {
    _id: { type: String, default: "app_settings" },
    roulette: {
      bettingDuration: { type: Number, default: 10 },
      spinningDuration: { type: Number, default: 5 },
      resultDuration: { type: Number, default: 5 },
      minBet: { type: Number, default: DEFAULT_MIN_BET },
      maxBet: { type: Number, default: DEFAULT_MAX_BET },
      maxBetsPerRound: { type: Number, default: DEFAULT_MAX_BETS_PER_ROUND },
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
