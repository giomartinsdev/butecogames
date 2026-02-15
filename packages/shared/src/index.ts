// Types
export type { UserProfile, PublicPlayer } from "./types/user.js";
export type { GameId, GameInfo } from "./types/game.js";
export type { Wallet, Transaction, TransactionType } from "./types/wallet.js";
export type {
  RouletteStatus,
  RouletteBetType,
  RouletteRound,
  RouletteBet,
  RouletteState,
  RouletteBetDisplay,
  RouletteWinner,
} from "./types/roulette.js";
export type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types/socket.js";
export type {
  BetOption,
  EventStatus,
  EventCategory,
  SportsBettingEvent,
  SportsBettingBet,
  EventOdds,
} from "./types/event-betting.js";

// Constants
export {
  GAMES,
  INITIAL_BALANCE,
  DAILY_REWARD_AMOUNT,
  DAILY_REWARD_COOLDOWN_MS,
} from "./constants/games.js";
export {
  ROULETTE_NUMBERS,
  RED_NUMBERS,
  BLACK_NUMBERS,
  getNumberColor,
  ROULETTE_PAYOUTS,
  BETTING_PHASE_DURATION,
  SPINNING_PHASE_DURATION,
  RESULT_DISPLAY_DURATION,
  MIN_BET,
  MAX_BET,
  MAX_BETS_PER_ROUND,
} from "./constants/roulette.js";
export {
  SPORTS_BETTING_HOUSE_EDGE,
  SPORTS_BETTING_MIN_BET,
  SPORTS_BETTING_MAX_BET,
  SPORTS_BETTING_MAX_BETS_PER_EVENT,
  EVENT_CATEGORIES,
} from "./constants/event-betting.js";
