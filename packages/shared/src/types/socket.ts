import type { RouletteBetDisplay, RouletteBetType, RouletteWinner } from "./roulette.js";

// Client → Server events
export interface ClientToServerEvents {
  "roulette:join": () => void;
  "roulette:leave": () => void;
  "roulette:place_bet": (data: { betType: RouletteBetType; amount: number }) => void;
  "chat:message": (data: { message: string }) => void;
}

// Server → Client events
export interface ServerToClientEvents {
  "roulette:state": (data: {
    roundNumber: number;
    status: string;
    timeRemaining: number;
    seedHash: string;
    recentResults: number[];
    currentBets: RouletteBetDisplay[];
  }) => void;
  "roulette:betting_open": (data: {
    roundNumber: number;
    seedHash: string;
    timeRemaining: number;
  }) => void;
  "roulette:bet_placed": (data: RouletteBetDisplay) => void;
  "roulette:betting_closed": () => void;
  "roulette:result": (data: {
    result: number;
    seed: string;
    winners: RouletteWinner[];
  }) => void;
  "roulette:error": (data: { message: string }) => void;
  "chat:new_message": (data: {
    userId: string;
    displayName: string;
    message: string;
    timestamp: string;
  }) => void;
  "user:level_up": (data: { level: number; xp: number }) => void;
  "user:achievement": (data: { achievementId: string; name: string; reward: number }) => void;
}
