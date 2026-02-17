import type { RouletteBetDisplay, RouletteBetType, RouletteWinner } from "./roulette.js";
import type { BetOption, EventBettingEvent, EventOdds } from "./event-betting.js";
import type { OnlineUser } from "./user.js";
import type {
  CardDuelGameType,
  CardDuelMatchResult,
  CardDuelPlayer,
  CardDuelRoomInfo,
  CardDuelRoomState,
  CardDuelRoundData,
} from "./card-duel.js";

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
  "card-duel:join_lobby": () => void;
  "card-duel:leave_lobby": () => void;
  "card-duel:create_room": (data: { betAmount: number; gameType: CardDuelGameType }) => void;
  "card-duel:join_room": (data: { roomId: string }) => void;
  "card-duel:quick_match": () => void;
  "card-duel:leave_room": () => void;
  "card-duel:cancel_room": () => void;
  "card-duel:player_ready": () => void;
  "card-duel:start_match": () => void;
  "card-duel:revenge_accept": () => void;
  "card-duel:revenge_decline": () => void;
  "card-duel:reconnect": (data: { roomId: string }) => void;
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
  "presence:online_users": (data: { users: OnlineUser[] }) => void;
  "presence:user_joined": (data: { user: OnlineUser }) => void;
  "presence:user_left": (data: { userId: string }) => void;
  "card-duel:lobby_state": (data: { rooms: CardDuelRoomInfo[] }) => void;
  "card-duel:lobby_update": (data: { rooms: CardDuelRoomInfo[] }) => void;
  "card-duel:room_joined": (data: { roomState: CardDuelRoomState }) => void;
  "card-duel:room_state": (data: { roomState: CardDuelRoomState }) => void;
  "card-duel:player_joined": (data: { player: CardDuelPlayer }) => void;
  "card-duel:player_left": (data: { userId: string }) => void;
  "card-duel:player_ready": (data: { userId: string }) => void;
  "card-duel:match_start": (data: { roomState: CardDuelRoomState }) => void;
  "card-duel:round_result": (data: {
    round: CardDuelRoundData;
    player1Score: number;
    player2Score: number;
    isLastRound: boolean;
  }) => void;
  "card-duel:match_result": (data: {
    result: CardDuelMatchResult;
    winnerId: string | null;
    winnerName: string | null;
    payout: number;
  }) => void;
  "card-duel:revenge_offer": (data: {
    countdown: number;
    canAccept: boolean;
  }) => void;
  "card-duel:revenge_countdown": (data: { countdown: number }) => void;
  "card-duel:revenge_accepted": () => void;
  "card-duel:room_closed": (data: { reason: string }) => void;
  "card-duel:player_disconnected": (data: {
    userId: string;
    countdown: number;
  }) => void;
  "card-duel:player_reconnected": (data: { userId: string }) => void;
  "card-duel:forfeit": (data: {
    loserId: string;
    winnerId: string;
    winnerName: string;
    payout: number;
  }) => void;
  "card-duel:error": (data: { message: string }) => void;
}
