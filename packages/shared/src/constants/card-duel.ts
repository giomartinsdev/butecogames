import type { CardRank } from "../types/card-duel.js";

export const CARD_RANKS: readonly CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const RANK_NAMES: Record<number, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

export const SUIT_NAMES: Record<string, string> = {
  spades: "Espadas",
  hearts: "Copas",
  diamonds: "Ouros",
  clubs: "Paus",
};

export const SUIT_SYMBOLS: Record<string, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

// Game defaults (admin-configurable via Settings)
export const DEFAULT_CARD_DUEL_MIN_BET = 10;
export const DEFAULT_CARD_DUEL_MAX_BET = 10_000;
export const CARD_DUEL_REVENGE_TIMEOUT = 15; // seconds
export const CARD_DUEL_DISCONNECT_GRACE = 60; // seconds
export const CARD_DUEL_ROUND_REVEAL_DELAY = 2_000; // ms between rounds in best-of-3
export const CARD_DUEL_RESULT_DISPLAY_DURATION = 5_000; // ms to show result before revenge
