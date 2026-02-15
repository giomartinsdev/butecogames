import type { AppSettings } from "@butecogames/shared";
import {
  DEFAULT_MIN_BET,
  DEFAULT_MAX_BET,
  DEFAULT_MAX_BETS_PER_ROUND,
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
  };
}
