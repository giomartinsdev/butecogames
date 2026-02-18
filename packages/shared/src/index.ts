// Types
export type { UserProfile, PublicPlayer, OnlineUser, PresenceStatus } from "./types/user.js";
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
  EventBettingEvent,
  EventBettingBet,
  EventOdds,
} from "./types/event-betting.js";
export type {
  RouletteSettings,
  EventBettingSettings,
  CardDuelSettings,
  GeneralSettings,
  AppSettings,
} from "./types/settings.js";
export type { UserSettings } from "./types/user-settings.js";
export type {
  XpConfig,
  LevelInfo,
  AchievementCategory,
  AchievementDefinition,
  ChallengeType,
  ChallengePeriod,
  ChallengeTemplate,
  ActiveChallenge,
  GamificationAction,
  GamificationActionMeta,
} from "./types/gamification.js";
export type {
  Card,
  CardSuit,
  CardRank,
  CardDuelGameType,
  CardDuelRoomStatus,
  CardDuelRoundResult,
  CardDuelMatchResult,
  CardDuelRoundData,
  CardDuelPlayer,
  CardDuelRoomInfo,
  CardDuelRoomState,
  CardDuelMatchHistory,
} from "./types/card-duel.js";

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
  DEFAULT_MIN_BET,
  DEFAULT_MAX_BET,
  DEFAULT_MAX_BETS_PER_ROUND,
} from "./constants/roulette.js";
export {
  DEFAULT_EVENT_BETTING_HOUSE_EDGE,
  DEFAULT_EVENT_BETTING_MIN_BET,
  DEFAULT_EVENT_BETTING_MAX_BET,
  DEFAULT_EVENT_BETTING_MAX_BETS_PER_EVENT,
  EVENT_CATEGORIES,
} from "./constants/event-betting.js";
export {
  CURSOR_SETS,
  DEFAULT_CURSOR_SET_ID,
  DEFAULT_CURSOR_SIZE,
  type CursorSet,
} from "./constants/cursors.js";
export {
  CARD_RANKS,
  RANK_NAMES,
  SUIT_NAMES,
  SUIT_SYMBOLS,
  DEFAULT_CARD_DUEL_MIN_BET,
  DEFAULT_CARD_DUEL_MAX_BET,
  CARD_DUEL_REVENGE_TIMEOUT,
  CARD_DUEL_DISCONNECT_GRACE,
  CARD_DUEL_ROUND_REVEAL_DELAY,
  CARD_DUEL_RESULT_DISPLAY_DURATION,
  CARD_DUEL_CARD_REVEAL_DELAY,
  DEFAULT_CARD_DUEL_BOT_BET,
} from "./constants/card-duel.js";
export {
  XP_CONFIG,
  MAX_CHAT_XP_PER_DAY,
  xpForLevel,
  cumulativeXpForLevel,
  levelFromXp,
  getLevelInfo,
  calculateWinXp,
  ACHIEVEMENTS,
  CHALLENGE_TEMPLATES,
  DAILY_CHALLENGES_COUNT,
  WEEKLY_CHALLENGES_COUNT,
} from "./constants/gamification.js";

export {
  DEFAULT_AWAY_TIMEOUT,
  getRouteLabel,
} from "./constants/presence.js";

// Political Compass
export type {
  PoliticalAxis,
  LikertAnswer,
  PoliticalCompassQuestion,
  PoliticalCompassAnswer,
  PoliticalCompassResult,
  PoliticalCompassPage,
} from "./political-compass/index.js";
export {
  LIKERT_OPTIONS,
  POLITICAL_COMPASS_QUESTIONS,
  POLITICAL_COMPASS_PAGES,
  calculatePoliticalCompass,
} from "./political-compass/index.js";
