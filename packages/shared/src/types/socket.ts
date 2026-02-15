import type { RouletteBetDisplay, RouletteBetType, RouletteWinner } from "./roulette.js";
import type { BetOption, SportsBettingEvent, EventOdds } from "./event-betting.js";

// Client → Server events
export interface ClientToServerEvents {
  "roulette:join": () => void;
  "roulette:leave": () => void;
  "roulette:place_bet": (data: { betType: RouletteBetType; amount: number }) => void;
  "chat:message": (data: { message: string }) => void;
  "sports:join": () => void;
  "sports:leave": () => void;
  "sports:place_bet": (data: {
    eventId: string;
    option: BetOption;
    amount: number;
  }) => void;
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
  "sports:events_update": (data: { events: SportsBettingEvent[] }) => void;
  "sports:odds_update": (data: { eventId: string; odds: EventOdds }) => void;
  "sports:bet_placed": (data: {
    eventId: string;
    option: BetOption;
    amount: number;
  }) => void;
  "sports:event_result": (data: {
    eventId: string;
    result: BetOption;
    winners: Array<{ userId: string; displayName: string; payout: number }>;
  }) => void;
  "sports:error": (data: { message: string }) => void;
}
