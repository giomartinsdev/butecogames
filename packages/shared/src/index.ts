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
  UfcFight,
  UfcEventData,
} from "./types/event-betting.js";
export type {
  RouletteSettings,
  EventBettingSettings,
  CardDuelSettings,
  UnecoSettings,
  GeneralSettings,
  PoliticalCompassSettings,
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
export type {
  UnecoCardColor,
  WildColor,
  AnyCardColor,
  UnecoCardValue,
  UnecoCard,
  UnecoPlayer,
  UnecoDirection,
  UnecoRoomStatus,
  UnecoRoomInfo,
  UnecoGameState,
  UnecoMatchHistory,
} from "./types/uneco.js";

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
  EVENT_CATEGORY_COLORS,
  DEFAULT_DRAW_IMAGE,
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
  UNECO_COLORS,
  UNECO_NUMBER_VALUES,
  UNECO_ACTION_VALUES,
  UNECO_WILD_VALUES,
  UNECO_CARD_POINTS,
  UNECO_COLOR_HEX,
  DEFAULT_UNECO_MIN_PLAYERS,
  DEFAULT_UNECO_MAX_PLAYERS,
  DEFAULT_UNECO_TURN_TIMEOUT,
  DEFAULT_UNECO_MIN_BET,
  DEFAULT_UNECO_MAX_BET,
  DEFAULT_UNECO_CATCH_WINDOW,
  DEFAULT_UNECO_DISCONNECT_GRACE,
  DEFAULT_UNECO_START_CARDS,
} from "./constants/uneco.js";
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
  DEFAULT_RETEST_COOLDOWN_DAYS,
} from "./political-compass/index.js";
