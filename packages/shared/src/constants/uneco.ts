import type { UnecoCardColor } from "../types/uneco.js";

// Deck composition
export const UNECO_COLORS: readonly UnecoCardColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
] as const;

export const UNECO_NUMBER_VALUES = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;

export const UNECO_ACTION_VALUES = ["skip", "reverse", "+2"] as const;
export const UNECO_WILD_VALUES = ["wild", "+4"] as const;

// Card point values (for pot calculation from remaining cards)
export const UNECO_CARD_POINTS: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  skip: 20,
  reverse: 20,
  "+2": 20,
  wild: 50,
  "+4": 50,
};

// UI color hex values
export const UNECO_COLOR_HEX: Record<string, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#EAB308",
  wild: "#8B5CF6",
};

// Default settings
export const DEFAULT_UNECO_MIN_PLAYERS = 2;
export const DEFAULT_UNECO_MAX_PLAYERS = 10;
export const DEFAULT_UNECO_TURN_TIMEOUT = 30; // seconds
export const DEFAULT_UNECO_MIN_BET = 10;
export const DEFAULT_UNECO_MAX_BET = 10_000;
export const DEFAULT_UNECO_CATCH_WINDOW = 5; // seconds after playing
export const DEFAULT_UNECO_DISCONNECT_GRACE = 60; // seconds
export const DEFAULT_UNECO_START_CARDS = 7;
