import crypto from "node:crypto";
import type { Server } from "socket.io";
import type {
  Card,
  CardSuit,
  CardRank,
  CardDuelGameType,
  CardDuelRoomStatus,
  CardDuelRoundResult,
  CardDuelMatchResult,
  CardDuelRoundData,
  CardDuelRoomInfo,
  CardDuelRoomState,
  CardDuelPlayer,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@butecogames/shared";
import {
  CARD_DUEL_ROUND_REVEAL_DELAY,
  CARD_DUEL_RESULT_DISPLAY_DURATION,
} from "@butecogames/shared";
import { CardDuelRoom } from "../models/CardDuelRoom.js";
import { Wallet } from "../models/Wallet.js";
import { debitWallet, creditWallet } from "./wallet.js";
import { getSettings } from "./settings.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

// ---------------------------------------------------------------------------
// In-memory room state
// ---------------------------------------------------------------------------

interface ActiveRoom {
  dbId: string;
  gameType: CardDuelGameType;
  betAmount: number;
  status: CardDuelRoomStatus;

  player1: CardDuelPlayer | null;
  player2: CardDuelPlayer | null;

  player1SocketId: string | null;
  player2SocketId: string | null;

  deck: Card[];
  deckIndex: number;
  currentRound: number;
  rounds: CardDuelRoundData[];
  player1Score: number;
  player2Score: number;
  matchResult: CardDuelMatchResult | null;

  roundTimer: ReturnType<typeof setTimeout> | null;
  revengeTimer: ReturnType<typeof setInterval> | null;
  revengeCountdown: number;
  revengeAccepted: Map<string, boolean>;

  disconnectTimer: ReturnType<typeof setTimeout> | null;
  disconnectedPlayer: string | null;
  disconnectCountdown: number;
  disconnectInterval: ReturnType<typeof setInterval> | null;
}

// Module state
let io: TypedIO;
const rooms = new Map<string, ActiveRoom>();
const playerRoomMap = new Map<string, string>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateDeck(): Card[] {
  const suits: CardSuit[] = ["spades", "hearts", "diamonds", "clubs"];
  const ranks: CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  // Fisher-Yates shuffle with crypto.randomInt
  for (let i = deck.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function compareCards(a: Card, b: Card): CardDuelRoundResult {
  if (a.rank > b.rank) return "player1";
  if (b.rank > a.rank) return "player2";
  return "draw";
}

function roomSocketName(roomId: string): string {
  return `card-duel:room:${roomId}`;
}

function clearRoomTimers(room: ActiveRoom) {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }
  if (room.revengeTimer) {
    clearInterval(room.revengeTimer);
    room.revengeTimer = null;
  }
  if (room.disconnectTimer) {
    clearTimeout(room.disconnectTimer);
    room.disconnectTimer = null;
  }
  if (room.disconnectInterval) {
    clearInterval(room.disconnectInterval);
    room.disconnectInterval = null;
  }
}

function removeRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  clearRoomTimers(room);
  if (room.player1) playerRoomMap.delete(room.player1.userId);
  if (room.player2) playerRoomMap.delete(room.player2.userId);
  rooms.delete(roomId);
}

function toRoomState(room: ActiveRoom): CardDuelRoomState {
  const accepted: Record<string, boolean> = {};
  for (const [k, v] of room.revengeAccepted) {
    accepted[k] = v;
  }
  return {
    roomId: room.dbId,
    gameType: room.gameType,
    betAmount: room.betAmount,
    status: room.status,
    player1: room.player1,
    player2: room.player2,
    currentRound: room.currentRound,
    rounds: room.rounds,
    player1Score: room.player1Score,
    player2Score: room.player2Score,
    matchResult: room.matchResult,
    revengeCountdown: room.revengeCountdown,
    revengeAccepted: accepted,
    disconnectedPlayer: room.disconnectedPlayer,
    disconnectCountdown: room.disconnectCountdown,
  };
}

function toRoomInfo(room: ActiveRoom): CardDuelRoomInfo {
  return {
    roomId: room.dbId,
    owner: {
      userId: room.player1!.userId,
      displayName: room.player1!.displayName,
      avatar: room.player1!.avatar,
    },
    betAmount: room.betAmount,
    gameType: room.gameType,
    status: room.status,
    playerCount: (room.player1 ? 1 : 0) + (room.player2 ? 1 : 0),
    createdAt: new Date().toISOString(),
  };
}

function emitWalletUpdate(userId: string, balance: number) {
  io.to(`user:${userId}`).emit("wallet:updated", { balance });
}

// ---------------------------------------------------------------------------
// Lobby
// ---------------------------------------------------------------------------

export function getLobbyRooms(): CardDuelRoomInfo[] {
  const result: CardDuelRoomInfo[] = [];
  for (const room of rooms.values()) {
    if (room.status === "waiting") {
      result.push(toRoomInfo(room));
    }
  }
  return result.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function broadcastLobbyUpdate() {
  io.to("card-duel:lobby").emit("card-duel:lobby_update", {
    rooms: getLobbyRooms(),
  });
}

// ---------------------------------------------------------------------------
// Room Management
// ---------------------------------------------------------------------------

export async function createRoom(
  userId: string,
  displayName: string,
  avatar: string,
  socketId: string,
  betAmount: number,
  gameType: CardDuelGameType,
): Promise<string> {
  // Validate player is not already in a room
  if (playerRoomMap.has(userId)) {
    throw new Error("Você já está em uma sala");
  }

  const settings = getSettings();
  if (betAmount < settings.cardDuel.minBet) {
    throw new Error(`Aposta mínima: ${settings.cardDuel.minBet} coins`);
  }
  if (betAmount > settings.cardDuel.maxBet) {
    throw new Error(`Aposta máxima: ${settings.cardDuel.maxBet} coins`);
  }
  if (!Number.isInteger(betAmount) || betAmount <= 0) {
    throw new Error("Valor de aposta inválido");
  }
  if (gameType !== "classic" && gameType !== "best_of_3") {
    throw new Error("Tipo de jogo inválido");
  }

  // Check balance
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < betAmount) {
    throw new Error("Você não possui coins suficientes");
  }

  // Create DB record
  const dbRoom = await CardDuelRoom.create({
    gameType,
    betAmount,
    status: "waiting",
    player1Id: userId,
    player1Name: displayName,
  });

  const roomId = dbRoom._id.toString();

  // Create in-memory room
  const activeRoom: ActiveRoom = {
    dbId: roomId,
    gameType,
    betAmount,
    status: "waiting",
    player1: { userId, displayName, avatar, isReady: true },
    player2: null,
    player1SocketId: socketId,
    player2SocketId: null,
    deck: [],
    deckIndex: 0,
    currentRound: 0,
    rounds: [],
    player1Score: 0,
    player2Score: 0,
    matchResult: null,
    roundTimer: null,
    revengeTimer: null,
    revengeCountdown: 0,
    revengeAccepted: new Map(),
    disconnectTimer: null,
    disconnectedPlayer: null,
    disconnectCountdown: 0,
    disconnectInterval: null,
  };

  rooms.set(roomId, activeRoom);
  playerRoomMap.set(userId, roomId);

  broadcastLobbyUpdate();
  return roomId;
}

export async function joinRoom(
  roomId: string,
  userId: string,
  displayName: string,
  avatar: string,
  socketId: string,
): Promise<void> {
  if (playerRoomMap.has(userId)) {
    throw new Error("Você já está em uma sala");
  }

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.status !== "waiting") throw new Error("Sala não está disponível");
  if (room.player1?.userId === userId) throw new Error("Você já está nesta sala");

  // Check balance
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < room.betAmount) {
    throw new Error("Você não possui coins suficientes");
  }

  room.player2 = { userId, displayName, avatar, isReady: false };
  room.player2SocketId = socketId;
  playerRoomMap.set(userId, roomId);

  // Update DB
  await CardDuelRoom.findByIdAndUpdate(roomId, {
    player2Id: userId,
    player2Name: displayName,
  });

  io.to(roomSocketName(roomId)).emit("card-duel:player_joined", {
    player: room.player2,
  });

  broadcastLobbyUpdate();
}

export async function quickMatch(
  userId: string,
  displayName: string,
  avatar: string,
  socketId: string,
): Promise<{ roomId: string } | null> {
  const wallet = await Wallet.findOne({ userId });
  const balance = wallet?.balance ?? 0;

  // Find first affordable waiting room (oldest first)
  for (const room of rooms.values()) {
    if (
      room.status === "waiting" &&
      room.betAmount <= balance &&
      room.player1?.userId !== userId
    ) {
      await joinRoom(room.dbId, userId, displayName, avatar, socketId);
      return { roomId: room.dbId };
    }
  }

  return null;
}

export async function leaveRoom(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) {
    playerRoomMap.delete(userId);
    return;
  }

  const isPlayer1 = room.player1?.userId === userId;

  switch (room.status) {
    case "waiting":
    case "ready": {
      if (isPlayer1) {
        // Owner leaves -> cancel room
        room.status = "cancelled";
        await CardDuelRoom.findByIdAndUpdate(roomId, { status: "cancelled" });
        io.to(roomSocketName(roomId)).emit("card-duel:room_closed", {
          reason: "O dono da sala saiu",
        });
        removeRoom(roomId);
      } else {
        // P2 leaves -> revert to waiting
        const p2Id = room.player2?.userId;
        room.player2 = null;
        room.player2SocketId = null;
        room.status = "waiting";
        if (p2Id) playerRoomMap.delete(p2Id);
        await CardDuelRoom.findByIdAndUpdate(roomId, {
          status: "waiting",
          player2Id: null,
          player2Name: null,
        });
        io.to(roomSocketName(roomId)).emit("card-duel:player_left", { userId });
        io.to(roomSocketName(roomId)).emit("card-duel:room_state", {
          roomState: toRoomState(room),
        });
      }
      broadcastLobbyUpdate();
      break;
    }

    case "in_progress": {
      // Start disconnect timer
      startDisconnectTimer(room, userId);
      break;
    }

    case "finished":
    case "revenge_pending": {
      // Treat as decline revenge / close room
      await closeRoom(roomId, "revenge_declined", "Jogador saiu da sala");
      break;
    }

    default:
      break;
  }
}

export async function cancelRoom(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.player1?.userId !== userId) throw new Error("Apenas o dono pode cancelar");
  if (room.status !== "waiting" && room.status !== "ready") {
    throw new Error("Não é possível cancelar a sala neste momento");
  }

  room.status = "cancelled";
  await CardDuelRoom.findByIdAndUpdate(roomId, { status: "cancelled" });
  io.to(roomSocketName(roomId)).emit("card-duel:room_closed", {
    reason: "Sala cancelada pelo dono",
  });
  removeRoom(roomId);
  broadcastLobbyUpdate();
}

export async function setPlayerReady(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");

  // Only P2 needs to click ready
  if (room.player2?.userId !== userId) {
    throw new Error("Apenas o segundo jogador precisa confirmar");
  }
  if (room.status !== "waiting") {
    throw new Error("A sala não está aguardando confirmação");
  }

  room.player2.isReady = true;
  room.status = "ready";

  await CardDuelRoom.findByIdAndUpdate(roomId, { status: "ready" });

  io.to(roomSocketName(roomId)).emit("card-duel:player_ready", { userId });
  io.to(roomSocketName(roomId)).emit("card-duel:room_state", {
    roomState: toRoomState(room),
  });

  broadcastLobbyUpdate();
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

export async function startMatch(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.player1?.userId !== userId) {
    throw new Error("Apenas o dono pode iniciar a partida");
  }
  if (room.status !== "ready") {
    throw new Error("O segundo jogador precisa confirmar primeiro");
  }
  if (!room.player2) throw new Error("Aguardando segundo jogador");

  const p1Id = room.player1.userId;
  const p2Id = room.player2.userId;
  const bet = room.betAmount;

  // Debit both players atomically
  try {
    await debitWallet(p1Id, bet, "bet_placed", {
      gameId: "card-duel",
      matchId: roomId,
    });
  } catch {
    throw new Error("Jogador 1 não possui coins suficientes");
  }

  try {
    await debitWallet(p2Id, bet, "bet_placed", {
      gameId: "card-duel",
      matchId: roomId,
    });
  } catch {
    // Refund P1 if P2 can't pay
    await creditWallet(p1Id, bet, "bet_refund", {
      gameId: "card-duel",
      matchId: roomId,
    });
    const w1 = await Wallet.findOne({ userId: p1Id });
    if (w1) emitWalletUpdate(p1Id, w1.balance);
    throw new Error("Jogador 2 não possui coins suficientes");
  }

  // Emit wallet updates
  const [w1, w2] = await Promise.all([
    Wallet.findOne({ userId: p1Id }),
    Wallet.findOne({ userId: p2Id }),
  ]);
  if (w1) emitWalletUpdate(p1Id, w1.balance);
  if (w2) emitWalletUpdate(p2Id, w2.balance);

  // Setup match
  room.status = "in_progress";
  room.deck = generateDeck();
  room.deckIndex = 0;
  room.currentRound = 0;
  room.rounds = [];
  room.player1Score = 0;
  room.player2Score = 0;
  room.matchResult = null;

  await CardDuelRoom.findByIdAndUpdate(roomId, {
    status: "in_progress",
    startedAt: new Date(),
  });

  io.to(roomSocketName(roomId)).emit("card-duel:match_start", {
    roomState: toRoomState(room),
  });

  broadcastLobbyUpdate();

  // Play first round after a short delay
  room.roundTimer = setTimeout(() => playRound(roomId), CARD_DUEL_ROUND_REVEAL_DELAY);
}

function playRound(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || room.status !== "in_progress") return;

  const maxRounds = room.gameType === "classic" ? 1 : 3;
  room.currentRound++;

  // Deal cards from deck
  const p1Card = room.deck[room.deckIndex++];
  const p2Card = room.deck[room.deckIndex++];
  const result = compareCards(p1Card, p2Card);

  if (result === "player1") room.player1Score++;
  else if (result === "player2") room.player2Score++;

  const roundData: CardDuelRoundData = {
    roundNumber: room.currentRound,
    player1Card: p1Card,
    player2Card: p2Card,
    result,
  };
  room.rounds.push(roundData);

  // Check if match is decided
  let isLastRound = false;
  if (room.gameType === "classic") {
    isLastRound = true;
  } else {
    // Best of 3: decided if someone has 2 wins or all 3 rounds played
    isLastRound =
      room.player1Score >= 2 ||
      room.player2Score >= 2 ||
      room.currentRound >= maxRounds;
  }

  io.to(roomSocketName(roomId)).emit("card-duel:round_result", {
    round: roundData,
    player1Score: room.player1Score,
    player2Score: room.player2Score,
    isLastRound,
  });

  if (isLastRound) {
    room.roundTimer = setTimeout(
      () => resolveMatch(roomId),
      CARD_DUEL_RESULT_DISPLAY_DURATION,
    );
  } else {
    room.roundTimer = setTimeout(
      () => playRound(roomId),
      CARD_DUEL_ROUND_REVEAL_DELAY,
    );
  }
}

async function resolveMatch(roomId: string): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) return;

  // Determine winner
  let matchResult: CardDuelMatchResult;
  if (room.player1Score > room.player2Score) matchResult = "player1";
  else if (room.player2Score > room.player1Score) matchResult = "player2";
  else matchResult = "draw";

  room.matchResult = matchResult;
  room.status = "finished";

  const p1Id = room.player1!.userId;
  const p2Id = room.player2!.userId;
  const bet = room.betAmount;
  const pot = bet * 2;

  let winnerId: string | null = null;
  let winnerName: string | null = null;
  let payout = 0;

  if (matchResult === "player1") {
    winnerId = p1Id;
    winnerName = room.player1!.displayName;
    payout = pot;
    await creditWallet(p1Id, pot, "bet_won", {
      gameId: "card-duel",
      matchId: roomId,
    });
    const w = await Wallet.findOne({ userId: p1Id });
    if (w) emitWalletUpdate(p1Id, w.balance);
  } else if (matchResult === "player2") {
    winnerId = p2Id;
    winnerName = room.player2!.displayName;
    payout = pot;
    await creditWallet(p2Id, pot, "bet_won", {
      gameId: "card-duel",
      matchId: roomId,
    });
    const w = await Wallet.findOne({ userId: p2Id });
    if (w) emitWalletUpdate(p2Id, w.balance);
  } else {
    // Draw — refund both
    payout = 0;
    await creditWallet(p1Id, bet, "bet_refund", {
      gameId: "card-duel",
      matchId: roomId,
    });
    await creditWallet(p2Id, bet, "bet_refund", {
      gameId: "card-duel",
      matchId: roomId,
    });
    const [w1, w2] = await Promise.all([
      Wallet.findOne({ userId: p1Id }),
      Wallet.findOne({ userId: p2Id }),
    ]);
    if (w1) emitWalletUpdate(p1Id, w1.balance);
    if (w2) emitWalletUpdate(p2Id, w2.balance);
  }

  // Update DB
  await CardDuelRoom.findByIdAndUpdate(roomId, {
    status: "finished",
    rounds: room.rounds,
    result: matchResult,
    winnerId,
    payout,
    completedAt: new Date(),
  });

  io.to(roomSocketName(roomId)).emit("card-duel:match_result", {
    result: matchResult,
    winnerId,
    winnerName,
    payout,
  });

  // Start revenge flow after display duration
  room.roundTimer = setTimeout(
    () => startRevengeFlow(roomId),
    CARD_DUEL_RESULT_DISPLAY_DURATION,
  );
}

// ---------------------------------------------------------------------------
// Revenge
// ---------------------------------------------------------------------------

async function startRevengeFlow(roomId: string): Promise<void> {
  const room = rooms.get(roomId);
  if (!room || !room.player1 || !room.player2) return;

  const settings = getSettings();
  const bet = room.betAmount;
  const p1Id = room.player1.userId;
  const p2Id = room.player2.userId;

  // Check if players can afford another round
  const [w1, w2] = await Promise.all([
    Wallet.findOne({ userId: p1Id }),
    Wallet.findOne({ userId: p2Id }),
  ]);

  const p1CanAfford = (w1?.balance ?? 0) >= bet;
  const p2CanAfford = (w2?.balance ?? 0) >= bet;

  // If neither can afford, skip revenge
  if (!p1CanAfford || !p2CanAfford) {
    await closeRoom(roomId, "finished", "Coins insuficientes para revanche");
    return;
  }

  room.status = "revenge_pending";
  room.revengeCountdown = settings.cardDuel.revengeTimeout;
  room.revengeAccepted = new Map();

  await CardDuelRoom.findByIdAndUpdate(roomId, { status: "revenge_pending" });

  // On draw, both must accept. On win/loss, only the loser needs to accept
  // The winner automatically "accepts" (they wait)
  if (room.matchResult === "draw") {
    // Both must actively accept
  } else {
    // Winner auto-accepts
    const winnerId =
      room.matchResult === "player1" ? p1Id : p2Id;
    room.revengeAccepted.set(winnerId, true);
  }

  io.to(roomSocketName(roomId)).emit("card-duel:revenge_offer", {
    countdown: room.revengeCountdown,
    canAccept: true,
  });

  io.to(roomSocketName(roomId)).emit("card-duel:room_state", {
    roomState: toRoomState(room),
  });

  // Countdown timer
  room.revengeTimer = setInterval(() => {
    room.revengeCountdown--;

    io.to(roomSocketName(roomId)).emit("card-duel:revenge_countdown", {
      countdown: room.revengeCountdown,
    });

    if (room.revengeCountdown <= 0) {
      if (room.revengeTimer) {
        clearInterval(room.revengeTimer);
        room.revengeTimer = null;
      }
      closeRoom(roomId, "revenge_declined", "Tempo de revanche esgotado");
    }
  }, 1000);
}

export async function acceptRevenge(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.status !== "revenge_pending") {
    throw new Error("Revanche não está disponível");
  }

  room.revengeAccepted.set(userId, true);

  // Check if all required acceptances are in
  const p1Id = room.player1!.userId;
  const p2Id = room.player2!.userId;
  const allAccepted =
    room.revengeAccepted.get(p1Id) === true &&
    room.revengeAccepted.get(p2Id) === true;

  if (allAccepted) {
    // Stop revenge timer
    if (room.revengeTimer) {
      clearInterval(room.revengeTimer);
      room.revengeTimer = null;
    }

    io.to(roomSocketName(roomId)).emit("card-duel:revenge_accepted");

    // Reset room for new match
    room.status = "ready";
    room.currentRound = 0;
    room.rounds = [];
    room.player1Score = 0;
    room.player2Score = 0;
    room.matchResult = null;
    room.revengeCountdown = 0;
    room.revengeAccepted = new Map();
    room.player2!.isReady = true;

    // Start match immediately
    // We call the inner logic directly to avoid the owner-only check
    await startMatchInternal(roomId);
  } else {
    // Emit updated state
    io.to(roomSocketName(roomId)).emit("card-duel:room_state", {
      roomState: toRoomState(room),
    });
  }
}

export async function declineRevenge(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.status !== "revenge_pending") {
    throw new Error("Revanche não está disponível");
  }

  await closeRoom(roomId, "revenge_declined", "Revanche recusada");
}

// Internal start match (bypasses owner check, used for revenge)
async function startMatchInternal(roomId: string): Promise<void> {
  const room = rooms.get(roomId);
  if (!room || !room.player1 || !room.player2) return;

  const p1Id = room.player1.userId;
  const p2Id = room.player2.userId;
  const bet = room.betAmount;

  // Debit both players
  try {
    await debitWallet(p1Id, bet, "bet_placed", {
      gameId: "card-duel",
      matchId: roomId,
    });
  } catch {
    await closeRoom(roomId, "finished", "Coins insuficientes para revanche");
    return;
  }

  try {
    await debitWallet(p2Id, bet, "bet_placed", {
      gameId: "card-duel",
      matchId: roomId,
    });
  } catch {
    // Refund P1
    await creditWallet(p1Id, bet, "bet_refund", {
      gameId: "card-duel",
      matchId: roomId,
    });
    const w1 = await Wallet.findOne({ userId: p1Id });
    if (w1) emitWalletUpdate(p1Id, w1.balance);
    await closeRoom(roomId, "finished", "Coins insuficientes para revanche");
    return;
  }

  // Emit wallet updates
  const [w1, w2] = await Promise.all([
    Wallet.findOne({ userId: p1Id }),
    Wallet.findOne({ userId: p2Id }),
  ]);
  if (w1) emitWalletUpdate(p1Id, w1.balance);
  if (w2) emitWalletUpdate(p2Id, w2.balance);

  // Setup match
  room.status = "in_progress";
  room.deck = generateDeck();
  room.deckIndex = 0;

  await CardDuelRoom.findByIdAndUpdate(roomId, {
    status: "in_progress",
    rounds: [],
    result: null,
    winnerId: null,
    payout: 0,
    startedAt: new Date(),
    completedAt: null,
  });

  io.to(roomSocketName(roomId)).emit("card-duel:match_start", {
    roomState: toRoomState(room),
  });

  room.roundTimer = setTimeout(() => playRound(roomId), CARD_DUEL_ROUND_REVEAL_DELAY);
}

// ---------------------------------------------------------------------------
// Disconnect handling
// ---------------------------------------------------------------------------

function startDisconnectTimer(room: ActiveRoom, userId: string): void {
  if (room.disconnectedPlayer) return; // Already tracking a disconnect

  const settings = getSettings();
  room.disconnectedPlayer = userId;
  room.disconnectCountdown = settings.cardDuel.disconnectGrace;

  io.to(roomSocketName(room.dbId)).emit("card-duel:player_disconnected", {
    userId,
    countdown: room.disconnectCountdown,
  });

  room.disconnectInterval = setInterval(() => {
    room.disconnectCountdown--;
    if (room.disconnectCountdown <= 0) {
      if (room.disconnectInterval) {
        clearInterval(room.disconnectInterval);
        room.disconnectInterval = null;
      }
      handleForfeit(room.dbId, userId);
    }
  }, 1000);

  room.disconnectTimer = setTimeout(() => {
    // Safety: ensure forfeit triggers
    if (room.disconnectInterval) {
      clearInterval(room.disconnectInterval);
      room.disconnectInterval = null;
    }
    handleForfeit(room.dbId, userId);
  }, (settings.cardDuel.disconnectGrace + 1) * 1000);
}

async function handleForfeit(roomId: string, loserId: string): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) return;

  clearRoomTimers(room);

  const p1Id = room.player1!.userId;
  const p2Id = room.player2!.userId;
  const winnerId = loserId === p1Id ? p2Id : p1Id;
  const winnerName =
    loserId === p1Id
      ? room.player2!.displayName
      : room.player1!.displayName;
  const pot = room.betAmount * 2;

  // Credit winner with full pot
  await creditWallet(winnerId, pot, "bet_won", {
    gameId: "card-duel",
    matchId: roomId,
  });
  const w = await Wallet.findOne({ userId: winnerId });
  if (w) emitWalletUpdate(winnerId, w.balance);

  room.status = "finished";
  room.matchResult = loserId === p1Id ? "player2" : "player1";

  await CardDuelRoom.findByIdAndUpdate(roomId, {
    status: "finished",
    result: room.matchResult,
    winnerId,
    payout: pot,
    completedAt: new Date(),
  });

  io.to(roomSocketName(roomId)).emit("card-duel:forfeit", {
    loserId,
    winnerId,
    winnerName,
    payout: pot,
  });

  io.to(roomSocketName(roomId)).emit("card-duel:room_closed", {
    reason: "Partida encerrada por desconexão",
  });

  removeRoom(roomId);
}

export async function handleDisconnect(
  userId: string,
  socketId: string,
): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  // Verify it's actually this socket that disconnected
  const isP1 = room.player1?.userId === userId;
  const expectedSocketId = isP1
    ? room.player1SocketId
    : room.player2SocketId;
  if (expectedSocketId !== socketId) return;

  if (room.status === "in_progress") {
    startDisconnectTimer(room, userId);
  } else if (
    room.status === "waiting" ||
    room.status === "ready"
  ) {
    await leaveRoom(userId);
  } else if (
    room.status === "revenge_pending" ||
    room.status === "finished"
  ) {
    await closeRoom(roomId, "revenge_declined", "Jogador desconectou");
  }
}

export async function handleReconnect(
  userId: string,
  newSocketId: string,
  roomId: string,
): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");

  const isP1 = room.player1?.userId === userId;
  const isP2 = room.player2?.userId === userId;
  if (!isP1 && !isP2) throw new Error("Você não está nesta sala");

  // Update socket ID
  if (isP1) room.player1SocketId = newSocketId;
  else room.player2SocketId = newSocketId;

  // Restore player room mapping
  playerRoomMap.set(userId, roomId);

  // Cancel disconnect timer if this player was disconnected
  if (room.disconnectedPlayer === userId) {
    room.disconnectedPlayer = null;
    room.disconnectCountdown = 0;
    if (room.disconnectTimer) {
      clearTimeout(room.disconnectTimer);
      room.disconnectTimer = null;
    }
    if (room.disconnectInterval) {
      clearInterval(room.disconnectInterval);
      room.disconnectInterval = null;
    }

    io.to(roomSocketName(roomId)).emit("card-duel:player_reconnected", {
      userId,
    });
  }
}

// ---------------------------------------------------------------------------
// Room cleanup
// ---------------------------------------------------------------------------

async function closeRoom(
  roomId: string,
  status: CardDuelRoomStatus,
  reason: string,
): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) return;

  clearRoomTimers(room);
  room.status = status;

  await CardDuelRoom.findByIdAndUpdate(roomId, {
    status,
    completedAt: new Date(),
  });

  io.to(roomSocketName(roomId)).emit("card-duel:room_closed", { reason });
  removeRoom(roomId);
  broadcastLobbyUpdate();
}

// ---------------------------------------------------------------------------
// Exported accessors
// ---------------------------------------------------------------------------

export function getRoomState(roomId: string): CardDuelRoomState {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  return toRoomState(room);
}

export function getPlayerRoom(userId: string): string | undefined {
  return playerRoomMap.get(userId);
}

// ---------------------------------------------------------------------------
// Initialization & crash recovery
// ---------------------------------------------------------------------------

export async function initCardDuelEngine(socketIo: TypedIO): Promise<void> {
  io = socketIo;

  // Clean up stale rooms from previous crashes
  const staleInProgress = await CardDuelRoom.find({ status: "in_progress" });
  for (const room of staleInProgress) {
    console.log(
      `[CardDuel] Refunding stale in_progress room ${room._id}`,
    );
    try {
      await creditWallet(room.player1Id, room.betAmount, "bet_refund", {
        gameId: "card-duel",
        matchId: room._id.toString(),
      });
      if (room.player2Id) {
        await creditWallet(room.player2Id, room.betAmount, "bet_refund", {
          gameId: "card-duel",
          matchId: room._id.toString(),
        });
      }
    } catch (err) {
      console.error(`[CardDuel] Failed to refund room ${room._id}:`, err);
    }
    await CardDuelRoom.findByIdAndUpdate(room._id, {
      status: "cancelled",
      completedAt: new Date(),
    });
  }

  const staleWaiting = await CardDuelRoom.updateMany(
    { status: { $in: ["waiting", "ready"] } },
    { $set: { status: "cancelled", completedAt: new Date() } },
  );
  if (staleWaiting.modifiedCount > 0) {
    console.log(
      `[CardDuel] Cancelled ${staleWaiting.modifiedCount} stale waiting/ready rooms`,
    );
  }

  const staleRevenge = await CardDuelRoom.updateMany(
    { status: "revenge_pending" },
    { $set: { status: "revenge_declined", completedAt: new Date() } },
  );
  if (staleRevenge.modifiedCount > 0) {
    console.log(
      `[CardDuel] Closed ${staleRevenge.modifiedCount} stale revenge_pending rooms`,
    );
  }

  console.log("[CardDuel] Engine initialized");
}
