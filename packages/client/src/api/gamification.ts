import { apiFetch } from "./client.js";
import type { AchievementDefinition, ActiveChallenge, LevelInfo } from "@butecogames/shared";

interface AchievementsResponse {
  achievements: AchievementDefinition[];
}

interface MyAchievementsResponse {
  achievements: string[];
}

interface ChallengesResponse {
  challenges: ActiveChallenge[];
}

interface GamificationStats {
  totalBets: number;
  totalWins: number;
  totalTransfers: number;
  totalDailyRewards: number;
  totalChallengesCompleted: number;
  totalWagered: number;
  totalWon: number;
  xp: number;
  level: number;
}

export function fetchAchievements() {
  return apiFetch<AchievementsResponse>("/api/gamification/achievements");
}

export function fetchMyAchievements() {
  return apiFetch<MyAchievementsResponse>("/api/gamification/my-achievements");
}

export function fetchChallenges() {
  return apiFetch<ChallengesResponse>("/api/gamification/challenges");
}

export function fetchLevelInfo() {
  return apiFetch<LevelInfo>("/api/gamification/level-info");
}

export function fetchGamificationStats() {
  return apiFetch<GamificationStats>("/api/gamification/stats");
}
