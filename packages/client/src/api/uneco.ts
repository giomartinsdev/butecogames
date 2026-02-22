import { apiFetch } from "./client.js";

export function fetchUnecoHistory(page = 1) {
  return apiFetch<{
    matches: Array<{
      _id: string;
      roomId: string;
      betAmount: number;
      playerCount: number;
      players: Array<{ userId: string; displayName: string; cardsLeft: number }>;
      winnerId: string;
      winnerName: string;
      payout: number;
      duration: number;
      createdAt: string;
    }>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/uneco/history?page=${page}`);
}

export function fetchUnecoStats() {
  return apiFetch<{
    stats: { wins: number; losses: number; total: number };
  }>("/api/uneco/stats");
}

export function fetchUnecoRecent() {
  return apiFetch<{
    matches: Array<{
      _id: string;
      betAmount: number;
      playerCount: number;
      players: Array<{
        userId: string;
        displayName: string;
        cardsLeft: number;
        avatar?: string | null;
      }>;
      winnerId: string;
      winnerName: string;
      payout: number;
      duration: number;
      completedAt: string;
    }>;
  }>("/api/uneco/recent");
}
