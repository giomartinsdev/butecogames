import type { RouletteBetDisplay, RouletteBetType, RouletteWinner } from "./roulette.js";
import type { BetOption, EventBettingEvent, EventOdds } from "./event-betting.js";

// Client → Server events
export interface ClientToServerEvents {
  "roulette:join": () => void;
  "roulette:leave": () => void;
  "roulette:place_bet": (data: { betType: RouletteBetType; amount: number }) => void;
  "chat:message": (data: { message: string }) => void;
  "event:join": () => void;
  "event:leave": () => void;
  "event:place_bet": (data: {
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
    minBet: number;
    maxBet: number;
    maxBetsPerRound: number;
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
  "event:events_update": (data: { events: EventBettingEvent[] }) => void;
  "event:odds_update": (data: {
    eventId: string;
    odds: EventOdds;
    totalPool: number;
    option1Pool: number;
    option2Pool: number;
    drawPool: number;
  }) => void;
  "event:bet_placed": (data: {
    eventId: string;
    option: BetOption;
    amount: number;
  }) => void;
  "event:event_result": (data: {
    eventId: string;
    result: BetOption;
    winners: Array<{ userId: string; displayName: string; payout: number }>;
  }) => void;
  "event:error": (data: { message: string }) => void;
  "settings:cursor_size": (data: { cursorSize: number }) => void;
  "wallet:updated": (data: { balance: number }) => void;
}
