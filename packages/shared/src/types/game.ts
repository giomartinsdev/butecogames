export type GameId = "roulette" | "event-betting" | "card-duel" | "uno";

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  available: boolean;
  requiresRoom: boolean;
  thumbnail: string;
}
