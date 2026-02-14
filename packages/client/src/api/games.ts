import { apiFetch } from "./client.js";
import type { GameInfo } from "@butecogames/shared";

interface GamesResponse {
  games: GameInfo[];
}

export function fetchGames() {
  return apiFetch<GamesResponse>("/api/games");
}
