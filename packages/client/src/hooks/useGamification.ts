import { useQuery } from "@tanstack/react-query";
import {
  fetchAchievements,
  fetchMyAchievements,
  fetchChallenges,
  fetchLevelInfo,
  fetchGamificationStats,
} from "@/api/gamification.js";

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
    staleTime: 60 * 60 * 1000, // definitions don't change
  });
}

export function useMyAchievements() {
  return useQuery({
    queryKey: ["my-achievements"],
    queryFn: fetchMyAchievements,
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: fetchChallenges,
    refetchInterval: 60 * 1000, // refresh every minute for countdown
  });
}

export function useLevelInfo() {
  return useQuery({
    queryKey: ["level-info"],
    queryFn: fetchLevelInfo,
  });
}

export function useGamificationStats() {
  return useQuery({
    queryKey: ["gamification-stats"],
    queryFn: fetchGamificationStats,
  });
}
