import type { Server as SocketIOServer } from "socket.io";
import type {
  BetOption,
  EventOdds,
  SportsBettingEvent as ISportsBettingEvent,
} from "@butecogames/shared";
import {
  SPORTS_BETTING_HOUSE_EDGE,
  SPORTS_BETTING_MIN_BET,
  SPORTS_BETTING_MAX_BET,
  SPORTS_BETTING_MAX_BETS_PER_EVENT,
} from "@butecogames/shared";
import { SportsBettingEvent } from "../models/SportsBettingEvent.js";
import { SportsBettingBet } from "../models/SportsBettingBet.js";
import { debitWallet, creditWallet } from "./wallet.js";
import { UserProfile } from "../models/UserProfile.js";

let io: SocketIOServer | null = null;

export function setSportsBettingIO(socketIO: SocketIOServer) {
  io = socketIO;
}

/**
 * Broadcast updated events to all users in sports-betting room
 */
export async function broadcastEventsUpdate(): Promise<void> {
  if (!io) return;

  try {
    const events = await getEventsWithOdds();
    io.to("sports-betting").emit("sports:events_update", { events: events as any });
  } catch (error) {
    console.error("[Sports Betting] Error broadcasting events:", error);
  }
}

/**
 * Calculate parimutuel odds for an event
 * Formula: Payout Multiplier = (Total Pool × (1 - House Edge)) / Option Pool
 * Minimum odds of 1.01 (1% return)
 */
export function calculateOdds(
  event: ISportsBettingEvent | (ISportsBettingEvent & { _id: any })
): EventOdds {
  const payoutPool = event.totalPool * (1 - SPORTS_BETTING_HOUSE_EDGE);

  const team1Odds =
    event.team1Pool > 0 ? payoutPool / event.team1Pool : 1.01;
  const team2Odds =
    event.team2Pool > 0 ? payoutPool / event.team2Pool : 1.01;
  const drawOdds = event.drawPool > 0 ? payoutPool / event.drawPool : 1.01;

  return {
    team1: Math.max(1.01, team1Odds),
    team2: Math.max(1.01, team2Odds),
    draw: Math.max(1.01, drawOdds),
  };
}

/**
 * Place a sports bet
 */
export async function placeSportsBet(
  userId: string,
  eventId: string,
  option: BetOption,
  amount: number
): Promise<void> {
  // Validate amount
  if (amount < SPORTS_BETTING_MIN_BET || amount > SPORTS_BETTING_MAX_BET) {
    throw new Error(
      `Valor da aposta deve estar entre ${SPORTS_BETTING_MIN_BET} e ${SPORTS_BETTING_MAX_BET} coins`
    );
  }

  // Get event
  const event = await SportsBettingEvent.findById(eventId);
  if (!event) {
    throw new Error("Evento não encontrado");
  }

  // Validate event status
  if (event.status !== "upcoming") {
    throw new Error("Apostas só podem ser feitas em eventos que ainda não começaram");
  }

  // Validate event hasn't started
  if (new Date(event.startTime) <= new Date()) {
    throw new Error("Este evento já começou");
  }

  // Check user's bet count for this event
  const userBetCount = await SportsBettingBet.countDocuments({
    eventId,
    userId,
  });
  if (userBetCount >= SPORTS_BETTING_MAX_BETS_PER_EVENT) {
    throw new Error(
      `Você atingiu o limite de ${SPORTS_BETTING_MAX_BETS_PER_EVENT} apostas por evento`
    );
  }

  // Debit wallet atomically
  await debitWallet(userId, amount, "bet_placed", {
    gameId: "sports-betting",
    eventId: eventId,
  });

  // Calculate current odds for potential payout snapshot
  const poolField =
    option === "team1"
      ? "team1Pool"
      : option === "team2"
      ? "team2Pool"
      : "drawPool";

  // Update event pools atomically
  await SportsBettingEvent.findByIdAndUpdate(eventId, {
    $inc: {
      totalPool: amount,
      [poolField]: amount,
    },
  });

  // Get updated event for odds calculation
  const updatedEvent = await SportsBettingEvent.findById(eventId);
  if (!updatedEvent) {
    throw new Error("Erro ao atualizar evento");
  }

  const eventObj = updatedEvent.toObject();
  const odds = calculateOdds({
    ...eventObj,
    _id: eventObj._id.toString(),
  } as any);
  const potentialPayout = amount * odds[option];

  // Create bet record
  await SportsBettingBet.create({
    eventId,
    userId,
    option,
    amount,
    potentialPayout,
  });

  // Broadcast odds update
  if (io) {
    io.to("sports-betting").emit("sports:odds_update", {
      eventId: eventId,
      odds,
    });
  }
}

/**
 * Resolve an event and pay out winners
 */
export async function resolveEvent(
  eventId: string,
  result: BetOption
): Promise<void> {
  // Update event status and result
  const event = await SportsBettingEvent.findByIdAndUpdate(
    eventId,
    {
      status: "completed",
      result,
    },
    { new: true }
  );

  if (!event) {
    throw new Error("Evento não encontrado");
  }

  // Calculate final odds
  const eventObj = event.toObject();
  const finalOdds = calculateOdds({
    ...eventObj,
    _id: eventObj._id.toString(),
  } as any);

  // Find all winning bets
  const winningBets = await SportsBettingBet.find({
    eventId,
    option: result,
  });

  // Pay out winners and update bet records
  const winners: Array<{
    userId: string;
    displayName: string;
    payout: number;
  }> = [];

  for (const bet of winningBets) {
    const actualPayout = bet.amount * finalOdds[result];

    // Update bet record
    await SportsBettingBet.findByIdAndUpdate(bet._id, {
      actualPayout,
      won: true,
    });

    // Credit wallet
    await creditWallet(bet.userId, actualPayout, "bet_won", {
      gameId: "sports-betting",
      eventId: eventId,
    });

    // Get user display name
    const profile = await UserProfile.findOne({ userId: bet.userId });
    winners.push({
      userId: bet.userId,
      displayName: profile?.displayName || "Jogador",
      payout: actualPayout,
    });
  }

  // Mark losing bets
  await SportsBettingBet.updateMany(
    {
      eventId,
      option: { $ne: result },
    },
    {
      won: false,
      actualPayout: 0,
    }
  );

  // Broadcast result
  if (io) {
    io.to("sports-betting").emit("sports:event_result", {
      eventId: eventId,
      result,
      winners,
    });
  }
}

/**
 * Auto-close events that have started
 * Should be called periodically (e.g., every minute)
 */
export async function autoCloseEvents(): Promise<void> {
  const now = new Date();

  await SportsBettingEvent.updateMany(
    {
      status: "upcoming",
      startTime: { $lte: now },
    },
    {
      status: "in_progress",
    }
  );
}

/**
 * Get all events with calculated odds
 */
export async function getEventsWithOdds(
  status?: string
): Promise<Array<ISportsBettingEvent & { odds: EventOdds }>> {
  const filter = status ? { status } : {};
  const events = await SportsBettingEvent.find(filter).sort({ startTime: 1 });

  return events.map((event) => {
    const eventObj = event.toObject();
    const eventWithStringId = {
      ...eventObj,
      _id: eventObj._id.toString(),
      result: eventObj.result as any,
    };
    return {
      ...eventWithStringId,
      odds: calculateOdds(eventWithStringId),
    };
  });
}

/**
 * Get user's bets for an event or all events
 */
export async function getUserBets(userId: string, eventId?: string) {
  const filter: any = { userId };
  if (eventId) {
    filter.eventId = eventId;
  }

  return SportsBettingBet.find(filter)
    .populate("eventId")
    .sort({ createdAt: -1 });
}
