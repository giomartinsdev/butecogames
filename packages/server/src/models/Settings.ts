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
  DEFAULT_CARD_DUEL_MIN_BET,
  DEFAULT_CARD_DUEL_MAX_BET,
  CARD_DUEL_REVENGE_TIMEOUT,
  CARD_DUEL_DISCONNECT_GRACE,
  CARD_DUEL_CARD_REVEAL_DELAY,
  DEFAULT_CARD_DUEL_BOT_BET,
  DEFAULT_UNECO_MIN_PLAYERS,
  DEFAULT_UNECO_MAX_PLAYERS,
  DEFAULT_UNECO_TURN_TIMEOUT,
  DEFAULT_UNECO_MIN_BET,
  DEFAULT_UNECO_MAX_BET,
  DEFAULT_UNECO_CATCH_WINDOW,
  DEFAULT_UNECO_DISCONNECT_GRACE,
  DEFAULT_AWAY_TIMEOUT,
  DEFAULT_RETEST_COOLDOWN_DAYS,
  MASTER_MODELS,
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
  cardDuel: {
    minBet: number;
    maxBet: number;
    revengeTimeout: number;
    disconnectGrace: number;
    cardRevealDelay: number;
    botBetAmount: number;
  };
  uneco: {
    minPlayers: number;
    maxPlayers: number;
    turnTimeout: number;
    minBet: number;
    maxBet: number;
    unecoCatchWindow: number;
    disconnectGrace: number;
  };
  general: {
    cursorSize: number;
    awayTimeout: number;
  };
  politicalCompass: {
    retestCooldownDays: number;
  };
  master: {
    models: any[];
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
    cardDuel: {
      minBet: { type: Number, default: DEFAULT_CARD_DUEL_MIN_BET },
      maxBet: { type: Number, default: DEFAULT_CARD_DUEL_MAX_BET },
      revengeTimeout: { type: Number, default: CARD_DUEL_REVENGE_TIMEOUT },
      disconnectGrace: { type: Number, default: CARD_DUEL_DISCONNECT_GRACE },
      cardRevealDelay: { type: Number, default: CARD_DUEL_CARD_REVEAL_DELAY },
      botBetAmount: { type: Number, default: DEFAULT_CARD_DUEL_BOT_BET },
    },
    uneco: {
      minPlayers: { type: Number, default: DEFAULT_UNECO_MIN_PLAYERS },
      maxPlayers: { type: Number, default: DEFAULT_UNECO_MAX_PLAYERS },
      turnTimeout: { type: Number, default: DEFAULT_UNECO_TURN_TIMEOUT },
      minBet: { type: Number, default: DEFAULT_UNECO_MIN_BET },
      maxBet: { type: Number, default: DEFAULT_UNECO_MAX_BET },
      unecoCatchWindow: { type: Number, default: DEFAULT_UNECO_CATCH_WINDOW },
      disconnectGrace: { type: Number, default: DEFAULT_UNECO_DISCONNECT_GRACE },
    },
    general: {
      cursorSize: { type: Number, default: DEFAULT_CURSOR_SIZE },
      awayTimeout: { type: Number, default: DEFAULT_AWAY_TIMEOUT },
    },
    politicalCompass: {
      retestCooldownDays: { type: Number, default: DEFAULT_RETEST_COOLDOWN_DAYS },
    },
    master: {
      models: { type: Array, default: MASTER_MODELS },
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
