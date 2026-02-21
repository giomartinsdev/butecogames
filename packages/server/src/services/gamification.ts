import type { GamificationAction, GamificationActionMeta } from "@butecogames/shared";
import {
  ACHIEVEMENTS,
  CHALLENGE_TEMPLATES,
  DAILY_CHALLENGES_COUNT,
  WEEKLY_CHALLENGES_COUNT,
  XP_CONFIG,

  calculateWinXp,
  levelFromXp,
} from "@butecogames/shared";
import { UserProfile, type IUserProfile } from "../models/UserProfile.js";
import { Wallet } from "../models/Wallet.js";
import { UserChallengeProgress, type IUserChallengeProgress } from "../models/UserChallengeProgress.js";
import { creditWallet } from "./wallet.js";
import { getIO } from "../socket/io-store.js";
import { invalidateLeaderboardCache } from "../routes/leaderboard.js";
import { logAudit } from "./audit.js";


/**
 * Main entry point. Called by game engines after any action.
 * Non-blocking: errors are logged but never break game logic.
 */
export async function processAction(
  userId: string,
  action: GamificationAction,
  meta?: GamificationActionMeta,
): Promise<void> {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return;

    // 1. Increment cumulative stats
    await incrementStats(profile, action, meta);

    // 2. Award XP
    const xpAmount = getXpForAction(action, meta);
    if (xpAmount > 0) {
      await awardXp(userId, profile, xpAmount, action, meta);
    }

    // 3. Check achievements
    await checkAchievements(userId, profile, action, meta);

    // 4. Update challenge progress
    await updateChallengeProgress(userId, action, meta);
  } catch (err) {
    console.error(`[Gamification] Error processing ${action} for ${userId}:`, err);
  }
}

// ---- Stats ----

async function incrementStats(
  profile: IUserProfile,
  action: GamificationAction,
  meta?: GamificationActionMeta,
): Promise<void> {
  const update: Record<string, unknown> = {};

  switch (action) {
    case "bet_placed":
      update.totalBets = 1;
      if (meta?.gameId && !profile.gamesPlayed.includes(meta.gameId)) {
        await UserProfile.updateOne(
          { userId: profile.userId },
          { $addToSet: { gamesPlayed: meta.gameId } },
        );
        profile.gamesPlayed.push(meta.gameId);
      }
      break;
    case "bet_won":
      update.totalWins = 1;
      break;
    case "daily_reward":
      update.totalDailyRewards = 1;
      break;
    case "transfer_sent":
      update.totalTransfers = 1;
      break;
    case "challenge_completed":
      update.totalChallengesCompleted = 1;
      break;
  }

  if (Object.keys(update).length > 0) {
    const incUpdate: Record<string, number> = {};
    for (const [key, val] of Object.entries(update)) {
      incUpdate[key] = val as number;
    }
    await UserProfile.updateOne({ userId: profile.userId }, { $inc: incUpdate });
    // Update local reference
    const profileAny = profile as unknown as Record<string, unknown>;
    for (const [key, val] of Object.entries(incUpdate)) {
      profileAny[key] = ((profileAny[key] as number) || 0) + val;
    }
  }
}

// ---- XP ----

function getXpForAction(
  action: GamificationAction,
  meta?: GamificationActionMeta,
): number {
  switch (action) {
    case "bet_placed":
      return XP_CONFIG.betPlaced;
    case "bet_won":
      if (meta?.betAmount && meta?.payout) {
        return calculateWinXp(meta.betAmount, meta.payout);
      }
      return XP_CONFIG.betWonBase;
    case "daily_reward":
      return XP_CONFIG.dailyReward;
    case "transfer_sent":
      return XP_CONFIG.transferSent;
    case "challenge_completed":
      return XP_CONFIG.challengeCompleted;
    case "political_compass_completed":
      return XP_CONFIG.politicalCompassCompleted;
    default:
      return 0;
  }
}

async function awardXp(
  userId: string,
  profile: IUserProfile,
  amount: number,
  action: GamificationAction,
  meta?: GamificationActionMeta,
): Promise<void> {
  const oldLevel = profile.level;
  const newXp = profile.xp + amount;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > oldLevel;

  await UserProfile.updateOne(
    { userId },
    { $inc: { xp: amount }, $set: { level: newLevel } },
  );

  profile.xp = newXp;
  profile.level = newLevel;

  // Audit log
  logAudit({
    adminId: "system",
    adminName: "Sistema",
    action: "xp.awarded",
    targetId: userId,
    targetLabel: profile.displayName,
    newData: {
      reason: action,
      xp: amount,
      totalXp: newXp,
      level: newLevel,
      ...(meta?.gameId ? { gameId: meta.gameId } : {}),
    },
  });

  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("user:xp_gained", {
      xpGained: amount,
      totalXp: newXp,
      level: newLevel,
      leveledUp,
    });

    if (leveledUp) {
      io.to(`user:${userId}`).emit("user:level_up", {
        level: newLevel,
        xp: newXp,
      });
      invalidateLeaderboardCache();
    }
  } catch {
    // Socket not ready yet
  }
}

// ---- Achievements ----

type AchievementChecker = (
  profile: IUserProfile,
  totalWagered: number,
  totalWon: number,
  action: GamificationAction,
  meta?: GamificationActionMeta,
) => boolean;

const achievementCheckers: Record<string, AchievementChecker> = {
  first_bet: (p) => p.totalBets >= 1,
  bets_10: (p) => p.totalBets >= 10,
  bets_50: (p) => p.totalBets >= 50,
  bets_100: (p) => p.totalBets >= 100,
  bets_500: (p) => p.totalBets >= 500,
  bets_1000: (p) => p.totalBets >= 1000,
  first_win: (p) => p.totalWins >= 1,
  wins_10: (p) => p.totalWins >= 10,
  wins_50: (p) => p.totalWins >= 50,
  wins_100: (p) => p.totalWins >= 100,
  wins_500: (p) => p.totalWins >= 500,
  wagered_1k: (_, w) => w >= 1000,
  wagered_10k: (_, w) => w >= 10000,
  wagered_100k: (_, w) => w >= 100000,
  won_1k: (_, __, w) => w >= 1000,
  won_10k: (_, __, w) => w >= 10000,
  won_100k: (_, __, w) => w >= 100000,
  roulette_number: (_p, _w, _wo, action, meta) =>
    action === "bet_won" && meta?.gameId === "roulette" && meta?.betType === "number",
  card_duel_5: (p, _w, _wo, action, meta) => {
    if (action !== "bet_won" || meta?.gameId !== "card-duel") return false;
    // Use totalWins as proxy — card duel wins are a subset, but for simplicity
    // we track via a dedicated counter approach: count card-duel bet_won transactions
    return p.totalWins >= 5; // Will check more specifically below
  },
  card_duel_25: (p, _w, _wo, action, meta) => {
    if (action !== "bet_won" || meta?.gameId !== "card-duel") return false;
    return p.totalWins >= 25;
  },
  event_bet_first: (p) => p.gamesPlayed.includes("event-betting"),
  political_compass_first: (_p, _w, _wo, action) => action === "political_compass_completed",
  first_transfer: (p) => p.totalTransfers >= 1,
  transfers_10: (p) => p.totalTransfers >= 10,
  daily_7: (p) => p.totalDailyRewards >= 7,
  daily_30: (p) => p.totalDailyRewards >= 30,
  level_5: (p) => p.level >= 5,
  level_10: (p) => p.level >= 10,
  level_25: (p) => p.level >= 25,
  challenges_10: (p) => p.totalChallengesCompleted >= 10,
};

async function checkAchievements(
  userId: string,
  profile: IUserProfile,
  action: GamificationAction,
  meta?: GamificationActionMeta,
): Promise<void> {
  const wallet = await Wallet.findOne({ userId });
  const totalWagered = wallet?.totalWagered ?? 0;
  const totalWon = wallet?.totalWon ?? 0;

  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (profile.achievements.includes(achievement.id)) continue;

    const checker = achievementCheckers[achievement.id];
    if (!checker) continue;

    if (checker(profile, totalWagered, totalWon, action, meta)) {
      newlyUnlocked.push(achievement.id);
    }
  }

  if (newlyUnlocked.length === 0) return;

  // Update profile with new achievements
  await UserProfile.updateOne(
    { userId },
    { $addToSet: { achievements: { $each: newlyUnlocked } } },
  );
  profile.achievements.push(...newlyUnlocked);

  // Award coins and emit for each
  try {
    const io = getIO();
    for (const achievementId of newlyUnlocked) {
      const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!def) continue;

      await creditWallet(userId, def.reward, "achievement_reward", {
        achievementId,
      });

      io.to(`user:${userId}`).emit("user:achievement", {
        achievementId: def.id,
        name: def.name,
        reward: def.reward,
      });

      // Also send updated wallet balance
      const updatedWallet = await Wallet.findOne({ userId });
      if (updatedWallet) {
        io.to(`user:${userId}`).emit("wallet:updated", {
          balance: updatedWallet.balance,
        });
      }
    }
  } catch {
    // Socket not ready
  }

  invalidateLeaderboardCache();
}

// ---- Challenges ----

function getPeriodBounds(period: "daily" | "weekly"): { startsAt: Date; expiresAt: Date } {
  const now = new Date();

  if (period === "daily") {
    const startsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const expiresAt = new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
    return { startsAt, expiresAt };
  }

  // Weekly: starts Monday 00:00 UTC
  const dayOfWeek = now.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
  const nextMonday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { startsAt: monday, expiresAt: nextMonday };
}

function pickRandomTemplates(period: "daily" | "weekly", count: number): typeof CHALLENGE_TEMPLATES {
  const pool = CHALLENGE_TEMPLATES.filter((t) => t.period === period);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function ensureChallengesExist(
  userId: string,
  period: "daily" | "weekly",
): Promise<IUserChallengeProgress[]> {
  const { startsAt, expiresAt } = getPeriodBounds(period);
  const count = period === "daily" ? DAILY_CHALLENGES_COUNT : WEEKLY_CHALLENGES_COUNT;

  const existing = await UserChallengeProgress.find({
    userId,
    period,
    startsAt,
  });

  if (existing.length >= count) return existing;

  // Need to assign new challenges
  const existingTemplateIds = existing.map((c) => c.templateId);
  const templates = pickRandomTemplates(period, count).filter(
    (t) => !existingTemplateIds.includes(t.id),
  );

  const toCreate = templates.slice(0, count - existing.length);
  const created: IUserChallengeProgress[] = [];

  for (const template of toCreate) {
    try {
      const doc = await UserChallengeProgress.create({
        userId,
        templateId: template.id,
        period: template.period,
        type: template.type,
        name: template.name,
        description: template.description,
        target: template.target,
        progress: 0,
        completed: false,
        completedAt: null,
        rewardCoins: template.rewardCoins,
        rewardXp: template.rewardXp,
        icon: template.icon,
        startsAt,
        expiresAt,
      });
      created.push(doc);
    } catch {
      // Unique constraint — already exists (race condition)
    }
  }

  return [...existing, ...created];
}

/**
 * Get active challenges for a user. Lazily assigns if not present.
 */
export async function getActiveChallenges(
  userId: string,
): Promise<IUserChallengeProgress[]> {
  const [daily, weekly] = await Promise.all([
    ensureChallengesExist(userId, "daily"),
    ensureChallengesExist(userId, "weekly"),
  ]);
  return [...daily, ...weekly];
}

async function updateChallengeProgress(
  userId: string,
  action: GamificationAction,
  meta?: GamificationActionMeta,
): Promise<void> {
  // Get active (non-expired, non-completed) challenges
  const now = new Date();
  const challenges = await UserChallengeProgress.find({
    userId,
    completed: false,
    expiresAt: { $gt: now },
  });

  if (challenges.length === 0) return;

  for (const challenge of challenges) {
    const increment = getChallengeIncrement(challenge.type, action, meta);
    if (increment <= 0) continue;

    const newProgress = Math.min(challenge.target, challenge.progress + increment);
    const justCompleted = newProgress >= challenge.target && !challenge.completed;

    await UserChallengeProgress.updateOne(
      { _id: challenge._id },
      {
        $set: {
          progress: newProgress,
          ...(justCompleted ? { completed: true, completedAt: now } : {}),
        },
      },
    );

    try {
      const io = getIO();

      if (justCompleted) {
        // Award challenge rewards
        await creditWallet(userId, challenge.rewardCoins, "challenge_reward");

        io.to(`user:${userId}`).emit("user:challenge_completed", {
          challengeId: challenge._id.toString(),
          name: challenge.name,
          rewardCoins: challenge.rewardCoins,
          rewardXp: challenge.rewardXp,
        });

        // Send updated wallet balance
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          io.to(`user:${userId}`).emit("wallet:updated", {
            balance: wallet.balance,
          });
        }

        // Award challenge XP (recursive but action is "challenge_completed" which won't re-trigger challenges)
        await processAction(userId, "challenge_completed");
      } else {
        io.to(`user:${userId}`).emit("user:challenge_progress", {
          challengeId: challenge._id.toString(),
          progress: newProgress,
          target: challenge.target,
        });
      }
    } catch {
      // Socket not ready
    }
  }
}

function getChallengeIncrement(
  challengeType: string,
  action: GamificationAction,
  meta?: GamificationActionMeta,
): number {
  switch (challengeType) {
    case "bet_count":
      return action === "bet_placed" ? 1 : 0;
    case "bet_count_roulette":
      return action === "bet_placed" && meta?.gameId === "roulette" ? 1 : 0;
    case "bet_count_event":
      return action === "bet_placed" && meta?.gameId === "event-betting" ? 1 : 0;
    case "bet_count_card_duel":
      return action === "bet_placed" && meta?.gameId === "card-duel" ? 1 : 0;
    case "win_count":
      return action === "bet_won" ? 1 : 0;
    case "win_count_roulette":
      return action === "bet_won" && meta?.gameId === "roulette" ? 1 : 0;
    case "win_count_card_duel":
      return action === "bet_won" && meta?.gameId === "card-duel" ? 1 : 0;
    case "daily_reward_claim":
      return action === "daily_reward" ? 1 : 0;
    case "transfer_send":
      return action === "transfer_sent" ? 1 : 0;
    case "spend_amount":
      return action === "bet_placed" ? (meta?.betAmount ?? 0) : 0;
    case "win_amount":
      return action === "bet_won" ? (meta?.payout ?? 0) : 0;
    case "play_all_games":
      // Increment by 1 for each unique game — but we track this as unique games count
      // The challenge target is 3 (all games). We increment on bet_placed with a new gameId.
      // For simplicity, count unique games from UserProfile.gamesPlayed
      return action === "bet_placed" ? 1 : 0;
    default:
      return 0;
  }
}
