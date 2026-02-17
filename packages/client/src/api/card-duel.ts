import { apiFetch } from "./client.js";
import type { CardDuelMatchHistory } from "@butecogames/shared";

interface MatchHistoryResponse {
  matches: CardDuelMatchHistory[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface StatsResponse {
  stats: { wins: number; losses: number; draws: number; total: number };
}

export function fetchMatchHistory(page = 1): Promise<MatchHistoryResponse> {
  return apiFetch(`/api/card-duel/history?page=${page}`);
}

export function fetchCardDuelStats(): Promise<StatsResponse> {
  return apiFetch("/api/card-duel/stats");
}
