// ---- XP ----

export interface XpConfig {
  betPlaced: number;
  betWonBase: number;
  betWonScaleFactor: number;
  dailyReward: number;
  challengeCompleted: number;
  transferSent: number;
  chatMessage: number;
}

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number;
}

// ---- Achievements ----

export type AchievementCategory =
  | "betting"
  | "winning"
  | "social"
  | "milestone"
  | "challenge";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  reward: number;
  hidden?: boolean;
}

// ---- Challenges ----

export type ChallengeType =
  | "bet_count"
  | "bet_count_roulette"
  | "bet_count_event"
  | "bet_count_card_duel"
  | "win_count"
  | "win_count_roulette"
  | "win_count_card_duel"
  | "daily_reward_claim"
  | "transfer_send"
  | "spend_amount"
  | "win_amount"
  | "play_all_games"
  | "chat_messages";

export type ChallengePeriod = "daily" | "weekly";

export interface ChallengeTemplate {
  id: string;
  type: ChallengeType;
  period: ChallengePeriod;
  name: string;
  description: string;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  icon: string;
}

export interface ActiveChallenge {
  _id: string;
  templateId: string;
  name: string;
  description: string;
  type: ChallengeType;
  period: ChallengePeriod;
  target: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  rewardCoins: number;
  rewardXp: number;
  icon: string;
  startsAt: string;
  expiresAt: string;
}

// ---- Action types for the gamification service ----

export type GamificationAction =
  | "bet_placed"
  | "bet_won"
  | "daily_reward"
  | "transfer_sent"
  | "chat_message"
  | "challenge_completed";

export interface GamificationActionMeta {
  gameId?: string;
  betAmount?: number;
  payout?: number;
  betType?: string;
  roundId?: string;
  eventId?: string;
  matchId?: string;
}
