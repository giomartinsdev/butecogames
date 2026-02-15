import crypto from "node:crypto";
import type { Server } from "socket.io";
import {
  RED_NUMBERS,
  ROULETTE_PAYOUTS,
} from "@butecogames/shared";
import type { RouletteBetType, RouletteBetDisplay, RouletteWinner, ClientToServerEvents, ServerToClientEvents } from "@butecogames/shared";
import { RouletteRound, type IRouletteRound } from "../models/RouletteRound.js";
import { RouletteBet } from "../models/RouletteBet.js";
import { debitWallet, creditWallet } from "./wallet.js";
import { getSettings } from "./settings.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

interface RouletteEngineState {
  currentRound: IRouletteRound | null;
  currentBets: RouletteBetDisplay[];
  recentResults: number[];
  seed: string;
  timer: ReturnType<typeof setTimeout> | null;
  bettingEndTime: number;
  running: boolean;
  stopRequested: boolean;
}

const state: RouletteEngineState = {
  currentRound: null,
  currentBets: [],
  recentResults: [],
  seed: "",
  timer: null,
  bettingEndTime: 0,
  running: false,
  stopRequested: false,
};

let io: TypedIO;

function generateSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function getResultFromSeed(seed: string): number {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const num = parseInt(hash.substring(0, 8), 16);
  return num % 37; // 0-36
}

function isBetWin(betType: RouletteBetType, result: number): boolean {
  if (betType === "red") {
    return (RED_NUMBERS as readonly number[]).includes(result);
  }
  if (betType === "black") {
    return result !== 0 && !(RED_NUMBERS as readonly number[]).includes(result);
  }
  if (betType === "odd") return result !== 0 && result % 2 !== 0;
  if (betType === "even") return result !== 0 && result % 2 === 0;
  if (betType === "low") return result >= 1 && result <= 18;
  if (betType === "high") return result >= 19 && result <= 36;

  if (betType.startsWith("number:")) {
    const n = parseInt(betType.split(":")[1], 10);
    return result === n;
  }
  if (betType.startsWith("dozen:")) {
    const d = parseInt(betType.split(":")[1], 10);
    if (d === 1) return result >= 1 && result <= 12;
    if (d === 2) return result >= 13 && result <= 24;
    if (d === 3) return result >= 25 && result <= 36;
  }

  return false;
}

function getPayoutMultiplier(betType: RouletteBetType): number {
  if (betType.startsWith("number:")) return ROULETTE_PAYOUTS["number"];
  const key = betType.includes(":") ? betType : betType;
  return ROULETTE_PAYOUTS[key] || 0;
}

function getRoomSize(): number {
  const room = io.sockets.adapter.rooms.get("roulette");
  return room?.size ?? 0;
}

/** Cleanly stop the engine and reset state */
function stopEngine(reason: string) {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  state.running = false;
  state.stopRequested = false;
  state.currentRound = null;
  console.log(`[Roulette] Engine stopped (${reason})`);
}

async function getNextRoundNumber(): Promise<number> {
  const lastRound = await RouletteRound.findOne().sort({ roundNumber: -1 });
  return (lastRound?.roundNumber ?? 0) + 1;
}

async function startBettingPhase() {
  // Don't start a new round if no one is watching or stop was requested
  if (getRoomSize() === 0 || state.stopRequested) {
    stopEngine("room empty");
    return;
  }

  const seed = generateSeed();
  const seedHash = hashSeed(seed);
  state.seed = seed;

  let roundNumber = await getNextRoundNumber();

  // Re-check after async — another call might have started a round
  if (!state.running) return;

  let round: IRouletteRound;
  try {
    round = await RouletteRound.create({
      roundNumber,
      seedHash,
      status: "betting",
      startedAt: new Date(),
    });
  } catch (err: unknown) {
    // Handle duplicate key collision (stale round from previous crash)
    if (err instanceof Error && "code" in err && (err as any).code === 11000) {
      console.log(`[Roulette] Round #${roundNumber} already exists, recalculating...`);
      roundNumber = await getNextRoundNumber();
      round = await RouletteRound.create({
        roundNumber,
        seedHash,
        status: "betting",
        startedAt: new Date(),
      });
    } else {
      throw err;
    }
  }

  const { bettingDuration } = getSettings().roulette;
  const bettingMs = bettingDuration * 1000;

  state.currentRound = round;
  state.currentBets = [];
  state.bettingEndTime = Date.now() + bettingMs;

  io.to("roulette").emit("roulette:betting_open", {
    roundNumber,
    seedHash,
    timeRemaining: bettingDuration,
  });

  console.log(`[Roulette] Round ${roundNumber} - Betting open (seed hash: ${seedHash.slice(0, 8)}...)`);

  state.timer = setTimeout(() => {
    closeBettingPhase();
  }, bettingMs);
}

async function closeBettingPhase() {
  if (!state.currentRound) return;

  io.to("roulette").emit("roulette:betting_closed");
  console.log(`[Roulette] Round ${state.currentRound.roundNumber} - Betting closed`);

  state.currentRound.status = "spinning";
  await state.currentRound.save();

  state.timer = setTimeout(() => {
    resolveRound();
  }, getSettings().roulette.spinningDuration * 1000);
}

async function resolveRound() {
  if (!state.currentRound) return;

  const result = getResultFromSeed(state.seed);
  const roundId = state.currentRound._id;

  state.currentRound.result = result;
  state.currentRound.seed = state.seed;
  state.currentRound.status = "completed";
  state.currentRound.completedAt = new Date();
  await state.currentRound.save();

  // Resolve all bets
  const bets = await RouletteBet.find({ roundId });
  const winners: RouletteWinner[] = [];

  for (const bet of bets) {
    const won = isBetWin(bet.betType as RouletteBetType, result);
    bet.won = won;

    if (won) {
      const multiplier = getPayoutMultiplier(bet.betType as RouletteBetType);
      const payout = Math.ceil(bet.amount * multiplier);
      bet.payout = payout;

      await creditWallet(bet.userId, payout, "bet_won", {
        gameId: "roulette",
        roundId: roundId.toString(),
      });

      // Find display name for the winner
      const betDisplay = state.currentBets.find(
        (b) => b.userId === bet.userId,
      );
      winners.push({
        userId: bet.userId,
        displayName: betDisplay?.displayName ?? "Unknown",
        betType: bet.betType as RouletteBetType,
        payout,
      });
    } else {
      bet.payout = 0;
    }

    await bet.save();
  }

  // Update recent results (keep last 20)
  state.recentResults.unshift(result);
  if (state.recentResults.length > 20) {
    state.recentResults = state.recentResults.slice(0, 20);
  }

  io.to("roulette").emit("roulette:result", {
    result,
    seed: state.seed,
    winners,
  });

  console.log(
    `[Roulette] Round ${state.currentRound.roundNumber} - Result: ${result}, Winners: ${winners.length}`,
  );

  // Round is complete — check if we should stop or continue
  if (state.stopRequested || getRoomSize() === 0) {
    stopEngine("room empty");
    return;
  }

  // Wait before starting next round
  state.timer = setTimeout(() => {
    startBettingPhase();
  }, getSettings().roulette.resultDuration * 1000);
}

export async function placeBet(
  userId: string,
  displayName: string,
  betType: RouletteBetType,
  amount: number,
): Promise<void> {
  if (!state.currentRound || state.currentRound.status !== "betting") {
    throw new Error("Betting is not open");
  }

  const { minBet, maxBet, maxBetsPerRound } = getSettings().roulette;

  if (amount < minBet || amount > maxBet) {
    throw new Error(`Bet amount must be between ${minBet} and ${maxBet}`);
  }

  // Check max bets per round
  const userBetsCount = await RouletteBet.countDocuments({
    roundId: state.currentRound._id,
    userId,
  });
  if (userBetsCount >= maxBetsPerRound) {
    throw new Error(`Maximum ${maxBetsPerRound} bets per round`);
  }

  // Debit wallet
  await debitWallet(userId, amount, "bet_placed", {
    gameId: "roulette",
    roundId: state.currentRound._id.toString(),
  });

  // Save bet
  await RouletteBet.create({
    roundId: state.currentRound._id,
    userId,
    betType,
    amount,
  });

  const betDisplay: RouletteBetDisplay = {
    userId,
    displayName,
    betType,
    amount,
  };
  state.currentBets.push(betDisplay);

  io.to("roulette").emit("roulette:bet_placed", betDisplay);
}

export function getRouletteState() {
  const { minBet, maxBet, maxBetsPerRound } = getSettings().roulette;

  return {
    roundNumber: state.currentRound?.roundNumber ?? 0,
    status: state.currentRound?.status ?? "completed",
    timeRemaining: Math.max(0, Math.floor((state.bettingEndTime - Date.now()) / 1000)),
    seedHash: state.currentRound?.seedHash ?? "",
    recentResults: state.recentResults,
    currentBets: state.currentBets,
    minBet,
    maxBet,
    maxBetsPerRound,
  };
}

export function broadcastRouletteState() {
  if (!io) return;
  io.to("roulette").emit("roulette:state", getRouletteState());
}

export async function initRouletteEngine(socketIo: TypedIO) {
  io = socketIo;

  // Clean up orphaned rounds from a previous server crash/restart
  const staleRounds = await RouletteRound.find({
    status: { $in: ["betting", "spinning"] },
  });

  for (const round of staleRounds) {
    const bets = await RouletteBet.find({ roundId: round._id });
    for (const bet of bets) {
      // Refund the bet amount back to the user
      await creditWallet(bet.userId, bet.amount, "bet_won", {
        gameId: "roulette",
        roundId: round._id.toString(),
      });
      bet.won = false;
      bet.payout = bet.amount;
      await bet.save();
    }

    round.status = "completed";
    round.completedAt = new Date();
    await round.save();
    console.log(
      `[Roulette] Cleaned up stale round #${round.roundNumber} (refunded ${bets.length} bet(s))`,
    );
  }

  // Load recent results
  const recentRounds = await RouletteRound.find({ status: "completed" })
    .sort({ completedAt: -1 })
    .limit(20);
  state.recentResults = recentRounds
    .filter((r) => r.result !== null)
    .map((r) => r.result as number);

  // Engine starts idle — only `roulette:join` triggers startRouletteEngine()
  console.log("[Roulette] Engine initialized (waiting for players)");
}

export async function startRouletteEngine() {
  if (state.running) return;
  state.running = true;
  state.stopRequested = false;
  console.log("[Roulette] Engine started (player joined)");
  await startBettingPhase();
}

export function requestRouletteStop() {
  if (!state.running) return;
  state.stopRequested = true;
  console.log("[Roulette] Stop requested (will stop after current round completes)");
}

export function cancelRouletteStop() {
  state.stopRequested = false;
}

export function isRouletteRunning() {
  return state.running;
}

export function stopRouletteEngine() {
  stopEngine("shutdown");
}
