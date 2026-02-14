// European roulette: 0-36
export const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i);

export const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
] as const;

export const BLACK_NUMBERS = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
] as const;

export function getNumberColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  if ((RED_NUMBERS as readonly number[]).includes(n)) return "red";
  return "black";
}

// Payout multipliers (bet returns amount * multiplier)
export const ROULETTE_PAYOUTS: Record<string, number> = {
  red: 2,
  black: 2,
  odd: 2,
  even: 2,
  low: 2, // 1-18
  high: 2, // 19-36
  "dozen:1": 3, // 1-12
  "dozen:2": 3, // 13-24
  "dozen:3": 3, // 25-36
  "column:1": 3,
  "column:2": 3,
  "column:3": 3,
  number: 36, // Single number
};

// Timing (milliseconds)
export const BETTING_PHASE_DURATION = 30_000;
export const SPINNING_PHASE_DURATION = 5_000;
export const RESULT_DISPLAY_DURATION = 5_000;

// Limits
export const MIN_BET = 10;
export const MAX_BET = 10_000;
export const MAX_BETS_PER_ROUND = 5;
