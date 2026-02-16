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

  if (partial.general) {
    for (const [key, value] of Object.entries(partial.general)) {
      update[`general.${key}`] = value;
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
    general: {
      cursorSize: doc.general?.cursorSize ?? DEFAULT_CURSOR_SIZE,
    },
  };
}
