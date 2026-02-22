import crypto from "node:crypto";
import type { Server } from "socket.io";
import type {
  UnoCard,
  UnoCardColor,
  UnoCardValue,
  UnoDirection,
  UnoRoomStatus,
  UnoRoomInfo,
  UnoGameState,
  UnoPlayer,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@butecogames/shared";
import {
  UNO_COLORS,
  UNO_NUMBER_VALUES,
  UNO_ACTION_VALUES,
  UNO_WILD_VALUES,
  UNO_CARD_POINTS,
  DEFAULT_UNO_START_CARDS,
} from "@butecogames/shared";
import { UnoRoom } from "../models/UnoRoom.js";
import { Wallet } from "../models/Wallet.js";
import { debitWallet, creditWallet } from "./wallet.js";
import { getSettings } from "./settings.js";
import { processAction } from "./gamification.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface InternalPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  socketId: string;
  hand: UnoCard[];
  isReady: boolean;
  saidUno: boolean;
  connected: boolean;
}

interface DisconnectState {
  timer: ReturnType<typeof setTimeout>;
  interval: ReturnType<typeof setInterval>;
  countdown: number;
}

interface ActiveUnoRoom {
  dbId: string;
  betAmount: number;
  maxPlayers: number;
  status: UnoRoomStatus;
  players: InternalPlayer[];
  spectators: Map<string, string>; // userId → socketId
  currentPlayerIndex: number;
  direction: UnoDirection;
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentColor: UnoCardColor;
  turnTimer: ReturnType<typeof setTimeout> | null;
  turnInterval: ReturnType<typeof setInterval> | null;
  turnTimeRemaining: number;
  unoCatchable: string | null;
  unoCatchTimer: ReturnType<typeof setTimeout> | null;
  disconnectTimers: Map<string, DisconnectState>;
  startedAt: Date | null;
  drawStack: number;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let io: TypedIO;
const rooms = new Map<string, ActiveUnoRoom>();
const playerRoomMap = new Map<string, string>(); // userId → roomId
const spectatorRoomMap = new Map<string, string>(); // userId → roomId

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let cardIdCounter = 0;

function nextCardId(): string {
  return `c${++cardIdCounter}`;
}

function generateDeck(): UnoCard[] {
  const deck: UnoCard[] = [];

  for (const color of UNO_COLORS) {
    // One 0 per color
    deck.push({ id: nextCardId(), color, value: "0" });
    // Two of each 1-9
    for (const val of UNO_NUMBER_VALUES) {
      if (val === "0") continue;
      deck.push({ id: nextCardId(), color, value: val });
      deck.push({ id: nextCardId(), color, value: val });
    }
    // Two of each action card
    for (const val of UNO_ACTION_VALUES) {
      deck.push({ id: nextCardId(), color, value: val as UnoCardValue });
      deck.push({ id: nextCardId(), color, value: val as UnoCardValue });
    }
  }

  // Wild cards: 4 of each
  for (const val of UNO_WILD_VALUES) {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: nextCardId(), color: "wild", value: val as UnoCardValue });
    }
  }

  return deck;
}

function shuffleDeck(deck: UnoCard[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawFromDeck(room: ActiveUnoRoom, count: number): UnoCard[] {
  const cards: UnoCard[] = [];
  for (let i = 0; i < count; i++) {
    if (room.deck.length === 0) {
      reshuffleDiscard(room);
    }
    if (room.deck.length === 0) break; // Truly empty
    cards.push(room.deck.pop()!);
  }
  return cards;
}

function reshuffleDiscard(room: ActiveUnoRoom): void {
  if (room.discardPile.length <= 1) return;
  const top = room.discardPile.pop()!;
  const reshuffled = room.discardPile.splice(0);
  shuffleDeck(reshuffled);
  room.deck.push(...reshuffled);
  room.discardPile = [top];
}

function isCardPlayable(
  card: UnoCard,
  discardTop: UnoCard,
  currentColor: UnoCardColor,
): boolean {
  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === discardTop.value) return true;
  return false;
}

function roomSocketName(roomId: string): string {
  return `uno:room:${roomId}`;
}

function spectatorSocketName(roomId: string): string {
  return `uno:spectate:${roomId}`;
}

function emitWalletUpdate(userId: string, balance: number): void {
  io.to(`user:${userId}`).emit("wallet:updated", { balance });
}

function clearTurnTimer(room: ActiveUnoRoom): void {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
  if (room.turnInterval) {
    clearInterval(room.turnInterval);
    room.turnInterval = null;
  }
}

function clearUnoCatchTimer(room: ActiveUnoRoom): void {
  if (room.unoCatchTimer) {
    clearTimeout(room.unoCatchTimer);
    room.unoCatchTimer = null;
  }
  room.unoCatchable = null;
}

function clearAllTimers(room: ActiveUnoRoom): void {
  clearTurnTimer(room);
  clearUnoCatchTimer(room);
  for (const dc of room.disconnectTimers.values()) {
    clearTimeout(dc.timer);
    clearInterval(dc.interval);
  }
  room.disconnectTimers.clear();
}

function removeRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  clearAllTimers(room);
  for (const p of room.players) {
    playerRoomMap.delete(p.userId);
  }
  for (const [uid] of room.spectators) {
    spectatorRoomMap.delete(uid);
  }
  rooms.delete(roomId);
}

function toPlayer(p: InternalPlayer): UnoPlayer {
  return {
    userId: p.userId,
    displayName: p.displayName,
    avatar: p.avatar,
    cardCount: p.hand.length,
    isReady: p.isReady,
    saidUno: p.saidUno,
    connected: p.connected,
  };
}

function toGameState(room: ActiveUnoRoom, forUserId: string): UnoGameState {
  const player = room.players.find((p) => p.userId === forUserId);
  return {
    roomId: room.dbId,
    status: room.status,
    betAmount: room.betAmount,
    maxPlayers: room.maxPlayers,
    players: room.players.map(toPlayer),
    currentPlayerIndex: room.currentPlayerIndex,
    direction: room.direction,
    discardTop: room.discardPile.length > 0
      ? room.discardPile[room.discardPile.length - 1]
      : null,
    currentColor: room.currentColor,
    deckCount: room.deck.length,
    hand: player?.hand ?? [],
    turnTimeRemaining: room.turnTimeRemaining,
    winner: room.status === "finished"
      ? (room.players.find((p) => p.hand.length === 0)?.userId ?? null)
      : null,
    spectatorCount: room.spectators.size,
    unoCatchable: room.unoCatchable,
    drawStack: room.drawStack,
  };
}

function toRoomInfo(room: ActiveUnoRoom): UnoRoomInfo {
  const owner = room.players[0];
  return {
    roomId: room.dbId,
    owner: owner
      ? { userId: owner.userId, displayName: owner.displayName, avatar: owner.avatar }
      : { userId: "", displayName: "", avatar: "" },
    betAmount: room.betAmount,
    maxPlayers: room.maxPlayers,
    playerCount: room.players.length,
    status: room.status,
    createdAt: new Date().toISOString(),
  };
}

/** Emit personalized game state to each player + spectators */
function emitGameStateToAll(room: ActiveUnoRoom): void {
  for (const p of room.players) {
    if (p.connected) {
      io.to(p.socketId).emit("uno:game_state", {
        gameState: toGameState(room, p.userId),
      });
    }
  }
  // Spectators get state without hand
  const spectatorState = toGameState(room, "__spectator__");
  io.to(spectatorSocketName(room.dbId)).emit("uno:game_state", {
    gameState: spectatorState,
  });
}

// ---------------------------------------------------------------------------
// Lobby
// ---------------------------------------------------------------------------

export function getLobbyRooms(): UnoRoomInfo[] {
  const result: UnoRoomInfo[] = [];
  for (const room of rooms.values()) {
    if (room.status === "waiting") {
      result.push(toRoomInfo(room));
    }
  }
  return result;
}

function broadcastLobbyUpdate(): void {
  io.to("uno:lobby").emit("uno:lobby_update", { rooms: getLobbyRooms() });
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
  maxPlayers: number,
): Promise<string> {
  if (playerRoomMap.has(userId)) {
    throw new Error("Você já está em uma sala");
  }

  const settings = getSettings();
  if (betAmount < settings.uno.minBet) {
    throw new Error(`Aposta mínima: ${settings.uno.minBet} coins`);
  }
  if (betAmount > settings.uno.maxBet) {
    throw new Error(`Aposta máxima: ${settings.uno.maxBet} coins`);
  }
  if (!Number.isInteger(betAmount) || betAmount <= 0) {
    throw new Error("Valor de aposta inválido");
  }
  if (maxPlayers < settings.uno.minPlayers || maxPlayers > settings.uno.maxPlayers) {
    throw new Error(`Número de jogadores: ${settings.uno.minPlayers}-${settings.uno.maxPlayers}`);
  }

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < betAmount) {
    throw new Error("Você não possui coins suficientes");
  }

  const dbRoom = await UnoRoom.create({
    creatorId: userId,
    betAmount,
    maxPlayers,
    status: "waiting",
    players: [{ userId, displayName, cardsLeft: 0 }],
  });

  const roomId = dbRoom._id.toString();

  const activeRoom: ActiveUnoRoom = {
    dbId: roomId,
    betAmount,
    maxPlayers,
    status: "waiting",
    players: [
      {
        userId,
        displayName,
        avatar,
        socketId,
        hand: [],
        isReady: true, // Owner is auto-ready
        saidUno: false,
        connected: true,
      },
    ],
    spectators: new Map(),
    currentPlayerIndex: 0,
    direction: "clockwise",
    deck: [],
    discardPile: [],
    currentColor: "red",
    turnTimer: null,
    turnInterval: null,
    turnTimeRemaining: 0,
    unoCatchable: null,
    unoCatchTimer: null,
    disconnectTimers: new Map(),
    startedAt: null,
    drawStack: 0,
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
  if (room.players.length >= room.maxPlayers) throw new Error("Sala cheia");
  if (room.players.some((p) => p.userId === userId)) {
    throw new Error("Você já está nesta sala");
  }

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < room.betAmount) {
    throw new Error("Você não possui coins suficientes");
  }

  const player: InternalPlayer = {
    userId,
    displayName,
    avatar,
    socketId,
    hand: [],
    isReady: false,
    saidUno: false,
    connected: true,
  };

  room.players.push(player);
  playerRoomMap.set(userId, roomId);

  await UnoRoom.findByIdAndUpdate(roomId, {
    $push: { players: { userId, displayName, cardsLeft: 0 } },
  });

  io.to(roomSocketName(roomId)).emit("uno:player_joined", {
    player: toPlayer(player),
  });

  broadcastLobbyUpdate();
}

export async function leaveRoom(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) {
    playerRoomMap.delete(userId);
    return;
  }

  const playerIndex = room.players.findIndex((p) => p.userId === userId);
  if (playerIndex === -1) {
    playerRoomMap.delete(userId);
    return;
  }

  const isOwner = playerIndex === 0;

  switch (room.status) {
    case "waiting": {
      if (isOwner) {
        // Owner leaves → cancel room
        room.status = "cancelled";
        await UnoRoom.findByIdAndUpdate(roomId, { status: "cancelled" });
        io.to(roomSocketName(roomId)).emit("uno:room_closed", {
          reason: "O dono da sala saiu",
        });
        removeRoom(roomId);
      } else {
        // Non-owner leaves
        room.players.splice(playerIndex, 1);
        playerRoomMap.delete(userId);
        await UnoRoom.findByIdAndUpdate(roomId, {
          $pull: { players: { userId } },
        });
        io.to(roomSocketName(roomId)).emit("uno:player_left", { userId });
      }
      broadcastLobbyUpdate();
      break;
    }

    case "playing": {
      // Start disconnect timer
      startDisconnectTimer(room, userId);
      break;
    }

    case "finished": {
      // Just remove from room
      playerRoomMap.delete(userId);
      break;
    }

    default:
      break;
  }
}

export function setPlayerReady(userId: string): void {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.status !== "waiting") throw new Error("A sala não está aguardando");

  const player = room.players.find((p) => p.userId === userId);
  if (!player) throw new Error("Jogador não encontrado");

  player.isReady = !player.isReady;

  io.to(roomSocketName(roomId)).emit("uno:player_ready", { userId });
  emitGameStateToAll(room);
}

// ---------------------------------------------------------------------------
// Game Start
// ---------------------------------------------------------------------------

export async function startGame(userId: string): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");

  if (room.players[0]?.userId !== userId) {
    throw new Error("Apenas o dono pode iniciar o jogo");
  }

  const settings = getSettings();
  if (room.players.length < settings.uno.minPlayers) {
    throw new Error(`Mínimo de ${settings.uno.minPlayers} jogadores`);
  }

  const allReady = room.players.every((p) => p.isReady);
  if (!allReady) {
    throw new Error("Todos os jogadores precisam estar prontos");
  }

  // Debit all players
  const bet = room.betAmount;
  const debitedPlayers: string[] = [];

  for (const player of room.players) {
    try {
      await debitWallet(player.userId, bet, "bet_placed", {
        gameId: "uno",
        matchId: roomId,
      });
      debitedPlayers.push(player.userId);
      processAction(player.userId, "bet_placed", {
        gameId: "uno",
        betAmount: bet,
        matchId: roomId,
      });
    } catch {
      // Refund all previously debited players
      for (const dId of debitedPlayers) {
        await creditWallet(dId, bet, "bet_refund", {
          gameId: "uno",
          matchId: roomId,
        });
        const w = await Wallet.findOne({ userId: dId });
        if (w) emitWalletUpdate(dId, w.balance);
      }
      await closeRoom(roomId, "cancelled", `${player.displayName} não possui coins suficientes`);
      return;
    }
  }

  // Emit wallet updates
  for (const player of room.players) {
    const w = await Wallet.findOne({ userId: player.userId });
    if (w) emitWalletUpdate(player.userId, w.balance);
  }

  // Setup game
  room.status = "playing";
  room.startedAt = new Date();
  room.deck = generateDeck();
  shuffleDeck(room.deck);
  room.discardPile = [];
  room.currentPlayerIndex = 0;
  room.direction = "clockwise";
  room.drawStack = 0;

  // Deal cards
  for (const player of room.players) {
    player.hand = drawFromDeck(room, DEFAULT_UNO_START_CARDS);
    player.saidUno = false;
  }

  // Flip initial discard card — if it's a wild or +4, put back and draw again
  let startCard: UnoCard;
  while (true) {
    const drawn = drawFromDeck(room, 1);
    if (drawn.length === 0) break;
    startCard = drawn[0];
    if (startCard.value === "wild" || startCard.value === "+4") {
      // Put back and reshuffle
      room.deck.unshift(startCard);
      shuffleDeck(room.deck);
      continue;
    }
    room.discardPile.push(startCard);
    break;
  }

  // Set initial color
  const topDiscard = room.discardPile[room.discardPile.length - 1];
  if (topDiscard && topDiscard.color !== "wild") {
    room.currentColor = topDiscard.color as UnoCardColor;
  } else {
    room.currentColor = "red"; // fallback
  }

  // Handle if starting card is an action card
  if (topDiscard) {
    applyStartingCardEffect(room, topDiscard);
  }

  await UnoRoom.findByIdAndUpdate(roomId, {
    status: "playing",
    startedAt: room.startedAt,
  });

  // Start first turn timer BEFORE emitting game state so turnTimeRemaining is correct
  startTurnTimer(room);

  // Emit personalized game state to each player
  for (const p of room.players) {
    io.to(p.socketId).emit("uno:game_started", {
      gameState: toGameState(room, p.userId),
    });
  }

  broadcastLobbyUpdate();
}

function applyStartingCardEffect(room: ActiveUnoRoom, card: UnoCard): void {
  switch (card.value) {
    case "skip":
      // First player is skipped
      room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
      break;
    case "reverse":
      room.direction = "counterclockwise";
      if (room.players.length === 2) {
        // With 2 players, reverse acts as skip
        room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
      }
      break;
    case "+2": {
      // First player draws 2 and is skipped
      const firstPlayer = room.players[room.currentPlayerIndex];
      const cards = drawFromDeck(room, 2);
      firstPlayer.hand.push(...cards);
      room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Turn Management
// ---------------------------------------------------------------------------

function getNextPlayerIndex(room: ActiveUnoRoom, current: number): number {
  const count = room.players.length;
  if (room.direction === "clockwise") {
    return (current + 1) % count;
  }
  return (current - 1 + count) % count;
}

function startTurnTimer(room: ActiveUnoRoom): void {
  clearTurnTimer(room);

  // Auto-draw: if draw stack is active and current player has no +2/+4, draw immediately
  if (room.drawStack > 0 && room.status === "playing") {
    const player = room.players[room.currentPlayerIndex];
    if (player && !player.hand.some((c) => c.value === "+2" || c.value === "+4")) {
      const drawCount = room.drawStack;
      const drawn = drawFromDeck(room, drawCount);
      player.hand.push(...drawn);
      player.saidUno = false;
      room.drawStack = 0;

      io.to(roomSocketName(room.dbId)).emit("uno:card_drawn", {
        userId: player.userId,
        cardCount: player.hand.length,
      });
      io.to(spectatorSocketName(room.dbId)).emit("uno:card_drawn", {
        userId: player.userId,
        cardCount: player.hand.length,
      });
      emitGameStateToAll(room);

      // Advance turn and start timer for next player
      room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
      // Recurse — drawStack is now 0 so no infinite loop
      startTurnTimer(room);
      return;
    }
  }

  const settings = getSettings();
  room.turnTimeRemaining = settings.uno.turnTimeout;

  io.to(roomSocketName(room.dbId)).emit("uno:turn_changed", {
    currentPlayerIndex: room.currentPlayerIndex,
    timeRemaining: room.turnTimeRemaining,
    drawStack: room.drawStack,
  });
  io.to(spectatorSocketName(room.dbId)).emit("uno:turn_changed", {
    currentPlayerIndex: room.currentPlayerIndex,
    timeRemaining: room.turnTimeRemaining,
    drawStack: room.drawStack,
  });

  room.turnInterval = setInterval(() => {
    room.turnTimeRemaining--;
    if (room.turnTimeRemaining <= 0) {
      clearTurnTimer(room);
      handleTurnTimeout(room.dbId);
    }
  }, 1000);

  room.turnTimer = setTimeout(() => {
    clearTurnTimer(room);
    handleTurnTimeout(room.dbId);
  }, (settings.uno.turnTimeout + 1) * 1000);
}

function handleTurnTimeout(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || room.status !== "playing") return;

  const player = room.players[room.currentPlayerIndex];
  if (!player) return;

  // Draw stack-aware: draw accumulated stack or 1
  const drawCount = room.drawStack > 0 ? room.drawStack : 1;
  const drawn = drawFromDeck(room, drawCount);
  player.hand.push(...drawn);
  player.saidUno = false;
  room.drawStack = 0;

  if (drawCount === 1 && drawn.length === 1) {
    // Normal single draw — only the drawing player sees the card
    for (const p of room.players) {
      if (p.userId === player.userId) {
        io.to(p.socketId).emit("uno:card_drawn", {
          userId: player.userId,
          cardCount: player.hand.length,
          card: drawn[0],
        });
      } else {
        io.to(p.socketId).emit("uno:card_drawn", {
          userId: player.userId,
          cardCount: player.hand.length,
        });
      }
    }
    io.to(spectatorSocketName(roomId)).emit("uno:card_drawn", {
      userId: player.userId,
      cardCount: player.hand.length,
    });
  } else {
    // Stack draw — emit count then full state
    io.to(roomSocketName(roomId)).emit("uno:card_drawn", {
      userId: player.userId,
      cardCount: player.hand.length,
    });
    io.to(spectatorSocketName(roomId)).emit("uno:card_drawn", {
      userId: player.userId,
      cardCount: player.hand.length,
    });
    emitGameStateToAll(room);
  }

  // Advance turn
  room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
  startTurnTimer(room);
}

// ---------------------------------------------------------------------------
// Play Card
// ---------------------------------------------------------------------------

export async function playCard(
  userId: string,
  cardId: string,
  chosenColor?: UnoCardColor,
): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.status !== "playing") throw new Error("O jogo não está em andamento");

  const playerIndex = room.players.findIndex((p) => p.userId === userId);
  if (playerIndex === -1) throw new Error("Jogador não encontrado");
  if (playerIndex !== room.currentPlayerIndex) {
    throw new Error("Não é sua vez");
  }

  const player = room.players[playerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error("Carta não encontrada na sua mão");

  const card = player.hand[cardIndex];
  const discardTop = room.discardPile[room.discardPile.length - 1];

  if (!discardTop) throw new Error("Estado inválido");

  // When draw stack is active, only +2/+4 can be played to stack
  if (room.drawStack > 0) {
    if (card.value !== "+2" && card.value !== "+4") {
      throw new Error("Você precisa jogar um +2 ou +4, ou comprar cartas");
    }
  } else {
    if (!isCardPlayable(card, discardTop, room.currentColor)) {
      throw new Error("Essa carta não pode ser jogada agora");
    }
  }

  // Wild cards need a chosen color
  if ((card.value === "wild" || card.value === "+4") && !chosenColor) {
    throw new Error("Escolha uma cor para a carta wild");
  }
  if (chosenColor && !UNO_COLORS.includes(chosenColor)) {
    throw new Error("Cor inválida");
  }

  // UNO enforcement: must say UNO before playing when at 2 cards
  if (player.hand.length === 2 && !player.saidUno) {
    // Card NOT played. Penalty: draw 1 extra card. Turn advances.
    const penaltyCards = drawFromDeck(room, 1);
    player.hand.push(...penaltyCards);
    player.saidUno = false;

    clearTurnTimer(room);

    io.to(roomSocketName(roomId)).emit("uno:uno_penalty", {
      userId,
      penaltyCards: penaltyCards.length,
    });
    io.to(spectatorSocketName(roomId)).emit("uno:uno_penalty", {
      userId,
      penaltyCards: penaltyCards.length,
    });

    // Advance turn
    room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
    emitGameStateToAll(room);
    startTurnTimer(room);
    return;
  }

  // Remove card from hand
  player.hand.splice(cardIndex, 1);
  room.discardPile.push(card);

  // Update current color
  if (card.color === "wild" && chosenColor) {
    room.currentColor = chosenColor;
  } else if (card.color !== "wild") {
    room.currentColor = card.color as UnoCardColor;
  }

  clearTurnTimer(room);
  clearUnoCatchTimer(room);

  // Reset saidUno — keep it true only when going from 2→1 (they said UNO to play)
  if (player.hand.length !== 1) {
    player.saidUno = false;
  }

  // Emit card played
  io.to(roomSocketName(roomId)).emit("uno:card_played", {
    userId,
    card,
    chosenColor,
    newCurrentPlayer: room.currentPlayerIndex,
    direction: room.direction,
    cardCount: player.hand.length,
  });
  io.to(spectatorSocketName(roomId)).emit("uno:card_played", {
    userId,
    card,
    chosenColor,
    newCurrentPlayer: room.currentPlayerIndex,
    direction: room.direction,
    cardCount: player.hand.length,
  });

  // Check win
  if (player.hand.length === 0) {
    await resolveGame(roomId, userId);
    return;
  }

  // Apply special card effects
  applyCardEffect(room, card, chosenColor);

  // Advance to next player
  room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);

  // Start next turn
  startTurnTimer(room);
}

function applyCardEffect(
  room: ActiveUnoRoom,
  card: UnoCard,
  _chosenColor?: UnoCardColor,
): void {
  switch (card.value) {
    case "skip": {
      // Skip next player
      room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
      break;
    }
    case "reverse": {
      room.direction =
        room.direction === "clockwise" ? "counterclockwise" : "clockwise";
      if (room.players.length === 2) {
        // With 2 players, reverse acts as skip
        room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
      }
      break;
    }
    case "+2": {
      // Stack: accumulate draw count, next player must respond or draw
      room.drawStack += 2;
      break;
    }
    case "+4": {
      // Stack: accumulate draw count, next player must respond or draw
      room.drawStack += 4;
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Draw Card
// ---------------------------------------------------------------------------

export function drawCard(userId: string): void {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  if (room.status !== "playing") throw new Error("O jogo não está em andamento");

  const playerIndex = room.players.findIndex((p) => p.userId === userId);
  if (playerIndex !== room.currentPlayerIndex) {
    throw new Error("Não é sua vez");
  }

  const player = room.players[playerIndex];

  // Draw stack-aware: draw accumulated stack or 1
  const drawCount = room.drawStack > 0 ? room.drawStack : 1;
  const drawn = drawFromDeck(room, drawCount);
  player.hand.push(...drawn);
  player.saidUno = false;
  room.drawStack = 0;

  if (drawCount === 1 && drawn.length === 1) {
    // Normal single draw — only the drawing player sees the card
    for (const p of room.players) {
      if (p.userId === userId) {
        io.to(p.socketId).emit("uno:card_drawn", {
          userId,
          cardCount: player.hand.length,
          card: drawn[0],
        });
      } else {
        io.to(p.socketId).emit("uno:card_drawn", {
          userId,
          cardCount: player.hand.length,
        });
      }
    }
    io.to(spectatorSocketName(roomId)).emit("uno:card_drawn", {
      userId,
      cardCount: player.hand.length,
    });
  } else {
    // Stack draw — emit count then full state
    io.to(roomSocketName(roomId)).emit("uno:card_drawn", {
      userId,
      cardCount: player.hand.length,
    });
    io.to(spectatorSocketName(roomId)).emit("uno:card_drawn", {
      userId,
      cardCount: player.hand.length,
    });
    emitGameStateToAll(room);
  }

  // Turn ends after drawing
  clearTurnTimer(room);
  room.currentPlayerIndex = getNextPlayerIndex(room, room.currentPlayerIndex);
  startTurnTimer(room);
}

// ---------------------------------------------------------------------------
// UNO Call & Catch
// ---------------------------------------------------------------------------

export function sayUno(userId: string): void {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room || room.status !== "playing") throw new Error("Jogo não está em andamento");

  const player = room.players.find((p) => p.userId === userId);
  if (!player) throw new Error("Jogador não encontrado");

  if (player.hand.length > 2) {
    throw new Error("Você só pode dizer UNO com 1 ou 2 cartas");
  }

  player.saidUno = true;

  io.to(roomSocketName(roomId)).emit("uno:uno_said", { userId });
  io.to(spectatorSocketName(roomId)).emit("uno:uno_said", { userId });
}

export function catchUno(catcherId: string, targetUserId: string): void {
  const roomId = playerRoomMap.get(catcherId);
  if (!roomId) throw new Error("Você não está em uma sala");

  const room = rooms.get(roomId);
  if (!room || room.status !== "playing") throw new Error("Jogo não está em andamento");

  if (room.unoCatchable !== targetUserId) {
    throw new Error("Este jogador não pode ser pego");
  }

  const target = room.players.find((p) => p.userId === targetUserId);
  if (!target) throw new Error("Jogador não encontrado");

  if (target.saidUno) {
    throw new Error("O jogador já disse UNO");
  }

  // Penalty: draw 2 cards
  const penaltyCards = drawFromDeck(room, 2);
  target.hand.push(...penaltyCards);

  clearUnoCatchTimer(room);

  io.to(roomSocketName(roomId)).emit("uno:uno_caught", {
    catcherId,
    targetId: targetUserId,
    penaltyCards: penaltyCards.length,
  });
  io.to(spectatorSocketName(roomId)).emit("uno:uno_caught", {
    catcherId,
    targetId: targetUserId,
    penaltyCards: penaltyCards.length,
  });

  // Update the target's hand for them
  emitGameStateToAll(room);
}

// ---------------------------------------------------------------------------
// Game Resolution
// ---------------------------------------------------------------------------

async function resolveGame(roomId: string, winnerId: string): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) return;

  clearAllTimers(room);
  room.status = "finished";

  const winner = room.players.find((p) => p.userId === winnerId)!;
  const pot = room.betAmount * room.players.length;

  // Credit winner with full pot
  await creditWallet(winnerId, pot, "bet_won", {
    gameId: "uno",
    matchId: roomId,
  });
  processAction(winnerId, "bet_won", {
    gameId: "uno",
    betAmount: room.betAmount,
    payout: pot,
    matchId: roomId,
  });
  const w = await Wallet.findOne({ userId: winnerId });
  if (w) emitWalletUpdate(winnerId, w.balance);

  const duration = room.startedAt
    ? Math.floor((Date.now() - room.startedAt.getTime()) / 1000)
    : 0;

  const playerResults = room.players.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    cardsLeft: p.hand.length,
  }));

  // Update DB
  await UnoRoom.findByIdAndUpdate(roomId, {
    status: "finished",
    winnerId,
    winnerName: winner.displayName,
    payout: pot,
    duration,
    players: playerResults,
    completedAt: new Date(),
  });

  // Emit results
  io.to(roomSocketName(roomId)).emit("uno:round_ended", {
    winnerId,
    winnerName: winner.displayName,
    payout: pot,
    players: playerResults,
  });
  io.to(spectatorSocketName(roomId)).emit("uno:round_ended", {
    winnerId,
    winnerName: winner.displayName,
    payout: pot,
    players: playerResults,
  });

  // Clean up room after a delay
  setTimeout(() => {
    io.to(roomSocketName(roomId)).emit("uno:room_closed", {
      reason: "Jogo encerrado",
    });
    removeRoom(roomId);
    broadcastLobbyUpdate();
  }, 10_000);
}

// ---------------------------------------------------------------------------
// Disconnect Handling
// ---------------------------------------------------------------------------

function startDisconnectTimer(room: ActiveUnoRoom, userId: string): void {
  if (room.disconnectTimers.has(userId)) return;

  const player = room.players.find((p) => p.userId === userId);
  if (player) player.connected = false;

  const settings = getSettings();
  let countdown = settings.uno.disconnectGrace;

  io.to(roomSocketName(room.dbId)).emit("uno:player_disconnected", {
    userId,
    countdown,
  });

  const interval = setInterval(() => {
    countdown--;
    const dc = room.disconnectTimers.get(userId);
    if (dc) dc.countdown = countdown;

    if (countdown <= 0) {
      const dcState = room.disconnectTimers.get(userId);
      if (dcState) {
        clearInterval(dcState.interval);
        clearTimeout(dcState.timer);
      }
      room.disconnectTimers.delete(userId);
      handlePlayerForfeit(room.dbId, userId);
    }
  }, 1000);

  const timer = setTimeout(() => {
    const dcState = room.disconnectTimers.get(userId);
    if (dcState) {
      clearInterval(dcState.interval);
    }
    room.disconnectTimers.delete(userId);
    handlePlayerForfeit(room.dbId, userId);
  }, (settings.uno.disconnectGrace + 1) * 1000);

  room.disconnectTimers.set(userId, { timer, interval, countdown });
}

async function handlePlayerForfeit(
  roomId: string,
  forfeitUserId: string,
): Promise<void> {
  const room = rooms.get(roomId);
  if (!room || room.status !== "playing") return;

  // Remove player from the game
  const playerIndex = room.players.findIndex((p) => p.userId === forfeitUserId);
  if (playerIndex === -1) return;

  room.players.splice(playerIndex, 1);
  playerRoomMap.delete(forfeitUserId);

  // Adjust currentPlayerIndex
  if (room.currentPlayerIndex >= room.players.length) {
    room.currentPlayerIndex = 0;
  } else if (room.currentPlayerIndex > playerIndex) {
    room.currentPlayerIndex--;
  }

  io.to(roomSocketName(roomId)).emit("uno:player_left", { userId: forfeitUserId });

  // If only 1 player left, they win
  if (room.players.length <= 1) {
    if (room.players.length === 1) {
      await resolveGame(roomId, room.players[0].userId);
    } else {
      await closeRoom(roomId, "cancelled", "Todos os jogadores saíram");
    }
    return;
  }

  emitGameStateToAll(room);
  startTurnTimer(room);
}

export async function handleDisconnect(
  userId: string,
  socketId: string,
): Promise<void> {
  const roomId = playerRoomMap.get(userId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.userId === userId);
  if (!player || player.socketId !== socketId) return;

  if (room.status === "playing") {
    startDisconnectTimer(room, userId);
  } else if (room.status === "waiting") {
    // Give a short grace period (10s) for page refreshes instead of instant removal
    player.connected = false;
    const graceSec = 10;
    let countdown = graceSec;

    const interval = setInterval(() => {
      countdown--;
      const dc = room.disconnectTimers.get(userId);
      if (dc) dc.countdown = countdown;
      if (countdown <= 0) {
        const dcState = room.disconnectTimers.get(userId);
        if (dcState) {
          clearInterval(dcState.interval);
          clearTimeout(dcState.timer);
        }
        room.disconnectTimers.delete(userId);
        leaveRoom(userId);
      }
    }, 1000);

    const timer = setTimeout(() => {
      const dcState = room.disconnectTimers.get(userId);
      if (dcState) clearInterval(dcState.interval);
      room.disconnectTimers.delete(userId);
      leaveRoom(userId);
    }, (graceSec + 1) * 1000);

    room.disconnectTimers.set(userId, { timer, interval, countdown });
  }
}

export async function handleReconnect(
  userId: string,
  newSocketId: string,
  roomId: string,
): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");

  const player = room.players.find((p) => p.userId === userId);
  if (!player) throw new Error("Você não está nesta sala");

  player.socketId = newSocketId;
  player.connected = true;
  playerRoomMap.set(userId, roomId);

  // Cancel disconnect timer
  const dc = room.disconnectTimers.get(userId);
  if (dc) {
    clearTimeout(dc.timer);
    clearInterval(dc.interval);
    room.disconnectTimers.delete(userId);

    io.to(roomSocketName(roomId)).emit("uno:player_reconnected", { userId });
  }
}

// ---------------------------------------------------------------------------
// Spectators
// ---------------------------------------------------------------------------

export function spectateRoom(
  userId: string,
  socketId: string,
  roomId: string,
): void {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");

  // Can't spectate if you're playing
  if (room.players.some((p) => p.userId === userId)) {
    throw new Error("Você já está jogando nesta sala");
  }

  room.spectators.set(userId, socketId);
  spectatorRoomMap.set(userId, roomId);

  io.to(roomSocketName(roomId)).emit("uno:spectator_count", {
    count: room.spectators.size,
  });
}

export function stopSpectating(userId: string): void {
  const roomId = spectatorRoomMap.get(userId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room) {
    room.spectators.delete(userId);
    io.to(roomSocketName(roomId)).emit("uno:spectator_count", {
      count: room.spectators.size,
    });
  }
  spectatorRoomMap.delete(userId);
}

// ---------------------------------------------------------------------------
// Room cleanup
// ---------------------------------------------------------------------------

async function closeRoom(
  roomId: string,
  status: UnoRoomStatus,
  reason: string,
): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) return;

  clearAllTimers(room);
  room.status = status;

  await UnoRoom.findByIdAndUpdate(roomId, {
    status,
    completedAt: new Date(),
  });

  io.to(roomSocketName(roomId)).emit("uno:room_closed", { reason });
  removeRoom(roomId);
  broadcastLobbyUpdate();
}

// ---------------------------------------------------------------------------
// Exported accessors
// ---------------------------------------------------------------------------

export function getRoomState(roomId: string): UnoGameState {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  return toGameState(room, "__lobby__");
}

export function getPlayerRoom(userId: string): string | undefined {
  return playerRoomMap.get(userId);
}

export function getGameStateForPlayer(
  roomId: string,
  userId: string,
): UnoGameState {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Sala não encontrada");
  return toGameState(room, userId);
}

// ---------------------------------------------------------------------------
// Initialization & crash recovery
// ---------------------------------------------------------------------------

export async function initUnoEngine(socketIo: TypedIO): Promise<void> {
  io = socketIo;

  // Clean up stale rooms from previous crashes
  const staleInProgress = await UnoRoom.find({ status: "playing" });
  for (const room of staleInProgress) {
    console.log(`[UNO] Refunding stale in_progress room ${room._id}`);
    for (const player of room.players) {
      try {
        await creditWallet(player.userId, room.betAmount, "bet_refund", {
          gameId: "uno",
          matchId: room._id.toString(),
        });
      } catch (err) {
        console.error(
          `[UNO] Failed to refund player ${player.userId} in room ${room._id}:`,
          err,
        );
      }
    }
    await UnoRoom.findByIdAndUpdate(room._id, {
      status: "cancelled",
      completedAt: new Date(),
    });
  }

  const staleWaiting = await UnoRoom.updateMany(
    { status: { $in: ["waiting", "starting"] } },
    { $set: { status: "cancelled", completedAt: new Date() } },
  );
  if (staleWaiting.modifiedCount > 0) {
    console.log(
      `[UNO] Cancelled ${staleWaiting.modifiedCount} stale waiting rooms`,
    );
  }

  console.log("[UNO] Engine initialized");
}
