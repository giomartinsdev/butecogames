import { apiFetch } from "./client.js";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  image: string | null;
  level: number;
  value: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  type: string;
}

export function fetchLeaderboard(type: "coins" | "xp" | "wins" = "coins") {
  return apiFetch<LeaderboardResponse>(`/api/leaderboard?type=${type}`);
}
