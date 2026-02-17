import { apiFetch } from "./client.js";
import type {
  CardDuelMatchHistory,
  CardDuelMatchResult,
  CardDuelGameType,
  CardDuelRoundData,
} from "@butecogames/shared";

interface MatchHistoryResponse {
  matches: CardDuelMatchHistory[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface StatsResponse {
  stats: { wins: number; losses: number; draws: number; total: number };
}

export interface RecentMatch {
  _id: string;
  gameType: CardDuelGameType;
  betAmount: number;
  isBot: boolean;
  player1: { userId: string; displayName: string; avatar: string | null };
  player2: { userId: string; displayName: string; avatar: string | null };
  rounds: CardDuelRoundData[];
  result: CardDuelMatchResult;
  winnerId: string | null;
  completedAt: string;
}

interface RecentMatchesResponse {
  matches: RecentMatch[];
}

export function fetchMatchHistory(page = 1): Promise<MatchHistoryResponse> {
  return apiFetch(`/api/card-duel/history?page=${page}`);
}

export function fetchCardDuelStats(): Promise<StatsResponse> {
  return apiFetch("/api/card-duel/stats");
}

export function fetchRecentMatches(): Promise<RecentMatchesResponse> {
  return apiFetch("/api/card-duel/recent");
}
