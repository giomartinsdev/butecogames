import crypto from "node:crypto";
import type { Server } from "socket.io";
import {
  BETTING_PHASE_DURATION,
  SPINNING_PHASE_DURATION,
  RESULT_DISPLAY_DURATION,
  RED_NUMBERS,
  ROULETTE_PAYOUTS,
  MIN_BET,
  MAX_BET,
  MAX_BETS_PER_ROUND,
} from "@butecogames/shared";
import type { RouletteBetType, RouletteBetDisplay, RouletteWinner, ClientToServerEvents, ServerToClientEvents } from "@butecogames/shared";
import { RouletteRound, type IRouletteRound } from "../models/RouletteRound.js";
import { RouletteBet } from "../models/RouletteBet.js";
import { debitWallet, creditWallet } from "./wallet.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

interface RouletteEngineState {
  currentRound: IRouletteRound | null;
  currentBets: RouletteBetDisplay[];
  recentResults: number[];
  seed: string;
  timer: ReturnType<typeof setTimeout> | null;
  bettingEndTime: number;
}

const state: RouletteEngineState = {
  currentRound: null,
  currentBets: [],
  recentResults: [],
  seed: "",
  timer: null,
  bettingEndTime: 0,
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
  if (betType.startsWith("column:")) {
    const c = parseInt(betType.split(":")[1], 10);
    return result !== 0 && result % 3 === (c === 3 ? 0 : c);
  }

  return false;
}

function getPayoutMultiplier(betType: RouletteBetType): number {
  if (betType.startsWith("number:")) return ROULETTE_PAYOUTS["number"];
  const key = betType.includes(":") ? betType : betType;
  return ROULETTE_PAYOUTS[key] || 0;
}

async function startBettingPhase() {
  const seed = generateSeed();
  const seedHash = hashSeed(seed);
  state.seed = seed;

  const lastRound = await RouletteRound.findOne().sort({ roundNumber: -1 });
  const roundNumber = (lastRound?.roundNumber ?? 0) + 1;

  const round = await RouletteRound.create({
    roundNumber,
    seedHash,
    status: "betting",
    startedAt: new Date(),
  });

  state.currentRound = round;
  state.currentBets = [];
  state.bettingEndTime = Date.now() + BETTING_PHASE_DURATION;

  io.to("roulette").emit("roulette:betting_open", {
    roundNumber,
    seedHash,
    timeRemaining: BETTING_PHASE_DURATION / 1000,
  });

  console.log(`[Roulette] Round ${roundNumber} - Betting open (seed hash: ${seedHash.slice(0, 8)}...)`);

  state.timer = setTimeout(() => {
    closeBettingPhase();
  }, BETTING_PHASE_DURATION);
}

async function closeBettingPhase() {
  if (!state.currentRound) return;

  io.to("roulette").emit("roulette:betting_closed");
  console.log(`[Roulette] Round ${state.currentRound.roundNumber} - Betting closed`);

  state.currentRound.status = "spinning";
  await state.currentRound.save();

  state.timer = setTimeout(() => {
    resolveRound();
  }, SPINNING_PHASE_DURATION);
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
      const payout = bet.amount * multiplier;
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

  // Wait before starting next round
  state.timer = setTimeout(() => {
    startBettingPhase();
  }, RESULT_DISPLAY_DURATION);
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

  if (amount < MIN_BET || amount > MAX_BET) {
    throw new Error(`Bet amount must be between ${MIN_BET} and ${MAX_BET}`);
  }

  // Check max bets per round
  const userBetsCount = await RouletteBet.countDocuments({
    roundId: state.currentRound._id,
    userId,
  });
  if (userBetsCount >= MAX_BETS_PER_ROUND) {
    throw new Error(`Maximum ${MAX_BETS_PER_ROUND} bets per round`);
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
  return {
    roundNumber: state.currentRound?.roundNumber ?? 0,
    status: state.currentRound?.status ?? "completed",
    timeRemaining: Math.max(0, Math.floor((state.bettingEndTime - Date.now()) / 1000)),
    seedHash: state.currentRound?.seedHash ?? "",
    recentResults: state.recentResults,
    currentBets: state.currentBets,
  };
}

export async function initRouletteEngine(socketIo: TypedIO) {
  io = socketIo;

  // Load recent results
  const recentRounds = await RouletteRound.find({ status: "completed" })
    .sort({ completedAt: -1 })
    .limit(20);
  state.recentResults = recentRounds
    .filter((r) => r.result !== null)
    .map((r) => r.result as number);

  // Start first round
  await startBettingPhase();
  console.log("[Roulette] Engine initialized");
}

export function stopRouletteEngine() {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}
