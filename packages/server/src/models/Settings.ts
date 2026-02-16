import mongoose, { Schema } from "mongoose";
import {
  DEFAULT_MIN_BET,
  DEFAULT_MAX_BET,
  DEFAULT_MAX_BETS_PER_ROUND,
  DEFAULT_CURSOR_SIZE,
  DEFAULT_EVENT_BETTING_HOUSE_EDGE,
  DEFAULT_EVENT_BETTING_MIN_BET,
  DEFAULT_EVENT_BETTING_MAX_BET,
  DEFAULT_EVENT_BETTING_MAX_BETS_PER_EVENT,
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
  eventBetting: {
    houseEdge: number;
    minBet: number;
    maxBet: number;
    maxBetsPerEvent: number;
  };
  general: {
    cursorSize: number;
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
    eventBetting: {
      houseEdge: { type: Number, default: DEFAULT_EVENT_BETTING_HOUSE_EDGE },
      minBet: { type: Number, default: DEFAULT_EVENT_BETTING_MIN_BET },
      maxBet: { type: Number, default: DEFAULT_EVENT_BETTING_MAX_BET },
      maxBetsPerEvent: { type: Number, default: DEFAULT_EVENT_BETTING_MAX_BETS_PER_EVENT },
    },
    general: {
      cursorSize: { type: Number, default: DEFAULT_CURSOR_SIZE },
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
