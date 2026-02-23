import type { AppSettings } from "@butecogames/shared";
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
} from "@butecogames/shared";
import { Settings } from "../models/Settings.js";

let cache: AppSettings | null = null;

export async function initSettings(): Promise<void> {
  const doc = await Settings.findById("app_settings");
  if (doc) {
    cache = toAppSettings(doc);
  } else {
    const created = await Settings.create({ _id: "app_settings" });
    cache = toAppSettings(created);
  }
  console.log("[Settings] Initialized", cache);
}

export function getSettings(): AppSettings {
  if (!cache) {
    throw new Error("Settings not initialized. Call initSettings() first.");
  }
  return cache;
}

export async function updateSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  const update: Record<string, unknown> = {};

  if (partial.roulette) {
    for (const [key, value] of Object.entries(partial.roulette)) {
      update[`roulette.${key}`] = value;
    }
  }

  if (partial.eventBetting) {
    for (const [key, value] of Object.entries(partial.eventBetting)) {
      update[`eventBetting.${key}`] = value;
    }
  }

  if (partial.cardDuel) {
    for (const [key, value] of Object.entries(partial.cardDuel)) {
      update[`cardDuel.${key}`] = value;
    }
  }

  if (partial.uneco) {
    for (const [key, value] of Object.entries(partial.uneco)) {
      update[`uneco.${key}`] = value;
    }
  }

  if (partial.general) {
    for (const [key, value] of Object.entries(partial.general)) {
      update[`general.${key}`] = value;
    }
  }

  if (partial.politicalCompass) {
    for (const [key, value] of Object.entries(partial.politicalCompass)) {
      update[`politicalCompass.${key}`] = value;
    }
  }

  const doc = await Settings.findByIdAndUpdate(
    "app_settings",
    { $set: update },
    { new: true, runValidators: true },
  );

  if (!doc) {
    throw new Error("Settings document not found");
  }

  cache = toAppSettings(doc);
  return cache;
}

function toAppSettings(doc: InstanceType<typeof Settings>): AppSettings {
  return {
    roulette: {
      bettingDuration: doc.roulette.bettingDuration,
      spinningDuration: doc.roulette.spinningDuration,
      resultDuration: doc.roulette.resultDuration,
      minBet: doc.roulette.minBet ?? DEFAULT_MIN_BET,
      maxBet: doc.roulette.maxBet ?? DEFAULT_MAX_BET,
      maxBetsPerRound: doc.roulette.maxBetsPerRound ?? DEFAULT_MAX_BETS_PER_ROUND,
    },
    eventBetting: {
      houseEdge: doc.eventBetting?.houseEdge ?? DEFAULT_EVENT_BETTING_HOUSE_EDGE,
      minBet: doc.eventBetting?.minBet ?? DEFAULT_EVENT_BETTING_MIN_BET,
      maxBet: doc.eventBetting?.maxBet ?? DEFAULT_EVENT_BETTING_MAX_BET,
      maxBetsPerEvent: doc.eventBetting?.maxBetsPerEvent ?? DEFAULT_EVENT_BETTING_MAX_BETS_PER_EVENT,
    },
    cardDuel: {
      minBet: doc.cardDuel?.minBet ?? DEFAULT_CARD_DUEL_MIN_BET,
      maxBet: doc.cardDuel?.maxBet ?? DEFAULT_CARD_DUEL_MAX_BET,
      revengeTimeout: doc.cardDuel?.revengeTimeout ?? CARD_DUEL_REVENGE_TIMEOUT,
      disconnectGrace: doc.cardDuel?.disconnectGrace ?? CARD_DUEL_DISCONNECT_GRACE,
      cardRevealDelay: doc.cardDuel?.cardRevealDelay ?? CARD_DUEL_CARD_REVEAL_DELAY,
      botBetAmount: doc.cardDuel?.botBetAmount ?? DEFAULT_CARD_DUEL_BOT_BET,
    },
    uneco: {
      minPlayers: doc.uneco?.minPlayers ?? DEFAULT_UNECO_MIN_PLAYERS,
      maxPlayers: doc.uneco?.maxPlayers ?? DEFAULT_UNECO_MAX_PLAYERS,
      turnTimeout: doc.uneco?.turnTimeout ?? DEFAULT_UNECO_TURN_TIMEOUT,
      minBet: doc.uneco?.minBet ?? DEFAULT_UNECO_MIN_BET,
      maxBet: doc.uneco?.maxBet ?? DEFAULT_UNECO_MAX_BET,
      unecoCatchWindow: doc.uneco?.unecoCatchWindow ?? DEFAULT_UNECO_CATCH_WINDOW,
      disconnectGrace: doc.uneco?.disconnectGrace ?? DEFAULT_UNECO_DISCONNECT_GRACE,
    },
    general: {
      cursorSize: doc.general?.cursorSize ?? DEFAULT_CURSOR_SIZE,
      awayTimeout: doc.general?.awayTimeout ?? DEFAULT_AWAY_TIMEOUT,
    },
    politicalCompass: {
      retestCooldownDays: doc.politicalCompass?.retestCooldownDays ?? DEFAULT_RETEST_COOLDOWN_DAYS,
    },
  };
}
