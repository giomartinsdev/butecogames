import type { RouletteBetDisplay, RouletteBetType, RouletteWinner } from "./roulette.js";
import type { BetOption, EventBettingEvent, EventOdds } from "./event-betting.js";
import type { OnlineUser, PresenceStatus } from "./user.js";
import type {
  CardDuelGameType,
  CardDuelMatchResult,
  CardDuelPlayer,
  CardDuelRoomInfo,
  CardDuelRoomState,
  CardDuelRoundData,
} from "./card-duel.js";
import type {
  UnecoCard,
  UnecoCardColor,
  UnecoDirection,
  UnecoGameState,
  UnecoPlayer,
  UnecoRoomInfo,
} from "./uneco.js";

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
  "card-duel:play_bot": (data: { gameType: CardDuelGameType }) => void;
  "card-duel:cancel_search": () => void;
  "uneco:join_lobby": () => void;
  "uneco:leave_lobby": () => void;
  "uneco:create_room": (data: { betAmount: number; maxPlayers: number }) => void;
  "uneco:join_room": (data: { roomId: string }) => void;
  "uneco:leave_room": () => void;
  "uneco:player_ready": () => void;
  "uneco:start_game": () => void;
  "uneco:play_card": (data: { cardId: string; chosenColor?: UnecoCardColor }) => void;
  "uneco:draw_card": () => void;
  "uneco:say_uneco": () => void;
  "uneco:catch_uneco": (data: { targetUserId: string }) => void;
  "uneco:forfeit": () => void;
  "uneco:spectate": (data: { roomId: string }) => void;
  "uneco:stop_spectating": () => void;
  "uneco:admin_cancel_room": (data: { roomId: string }) => void;
  "presence:update_status": (data: { status: PresenceStatus }) => void;
  "presence:update_page": (data: { page: string }) => void;
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
  "user:xp_gained": (data: { xpGained: number; totalXp: number; level: number; leveledUp: boolean }) => void;
  "user:challenge_completed": (data: { challengeId: string; name: string; rewardCoins: number; rewardXp: number }) => void;
  "user:challenge_progress": (data: { challengeId: string; progress: number; target: number }) => void;
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
  "notification:global": (data: {
    type: "info" | "success" | "warning" | "error" | "announcement";
    title: string;
    message?: string;
  }) => void;
  "notification:unread_count": (data: { count: number }) => void;
  "settings:cursor_size": (data: { cursorSize: number }) => void;
  "wallet:updated": (data: { balance: number }) => void;
  "presence:online_users": (data: { users: OnlineUser[] }) => void;
  "presence:user_joined": (data: { user: OnlineUser }) => void;
  "presence:user_left": (data: { userId: string }) => void;
  "presence:user_updated": (data: {
    userId: string;
    status?: PresenceStatus;
    currentPage?: string | null;
  }) => void;
  "settings:away_timeout": (data: { awayTimeout: number }) => void;
  "card-duel:lobby_state": (data: { rooms: CardDuelRoomInfo[] }) => void;
  "card-duel:lobby_update": (data: { rooms: CardDuelRoomInfo[] }) => void;
  "card-duel:room_joined": (data: { roomState: CardDuelRoomState }) => void;
  "card-duel:room_state": (data: { roomState: CardDuelRoomState }) => void;
  "card-duel:player_joined": (data: { player: CardDuelPlayer }) => void;
  "card-duel:player_left": (data: { userId: string }) => void;
  "card-duel:player_ready": (data: { userId: string }) => void;
  "card-duel:match_start": (data: { roomState: CardDuelRoomState }) => void;
  "card-duel:card_reveal_countdown": (data: { countdown: number }) => void;
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
  "uneco:lobby_state": (data: { rooms: UnecoRoomInfo[]; ongoingRooms: UnecoRoomInfo[] }) => void;
  "uneco:lobby_update": (data: { rooms: UnecoRoomInfo[]; ongoingRooms: UnecoRoomInfo[] }) => void;
  "uneco:room_joined": (data: { gameState: UnecoGameState }) => void;
  "uneco:game_state": (data: { gameState: UnecoGameState }) => void;
  "uneco:player_joined": (data: { player: UnecoPlayer }) => void;
  "uneco:player_left": (data: { userId: string }) => void;
  "uneco:player_ready": (data: { userId: string }) => void;
  "uneco:game_started": (data: { gameState: UnecoGameState }) => void;
  "uneco:card_played": (data: {
    userId: string;
    card: UnecoCard;
    chosenColor?: UnecoCardColor;
    newCurrentPlayer: number;
    direction: UnecoDirection;
    cardCount: number;
  }) => void;
  "uneco:card_drawn": (data: {
    userId: string;
    cardCount: number;
    card?: UnecoCard;
  }) => void;
  "uneco:turn_changed": (data: {
    currentPlayerIndex: number;
    timeRemaining: number;
    drawStack: number;
  }) => void;
  "uneco:uneco_said": (data: { userId: string }) => void;
  "uneco:uneco_caught": (data: {
    catcherId: string;
    targetId: string;
    penaltyCards: number;
  }) => void;
  "uneco:uneco_catchable": (data: { userId: string }) => void;
  "uneco:round_ended": (data: {
    winnerId: string;
    winnerName: string;
    payout: number;
    players: Array<{ userId: string; displayName: string; cardsLeft: number }>;
  }) => void;
  "uneco:room_closed": (data: { reason: string }) => void;
  "uneco:player_disconnected": (data: {
    userId: string;
    countdown: number;
  }) => void;
  "uneco:player_reconnected": (data: { userId: string }) => void;
  "uneco:uneco_penalty": (data: {
    userId: string;
    penaltyCards: number;
  }) => void;
  "uneco:player_forfeited": (data: {
    userId: string;
    winnerId?: string;
    winnerName?: string;
    payout?: number;
  }) => void;
  "uneco:spectator_count": (data: { count: number }) => void;
  "uneco:idle_warning": (data: {
    idleTurns: number;
    maxIdleTurns: number;
    kicked: boolean;
  }) => void;
  "uneco:error": (data: { message: string }) => void;
}
