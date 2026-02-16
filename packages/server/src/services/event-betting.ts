import type { Server as SocketIOServer } from "socket.io";
import type {
  BetOption,
  EventOdds,
  EventBettingEvent as IEventBettingEvent,
} from "@butecogames/shared";
import { EventBettingEvent } from "../models/EventBettingEvent.js";
import { EventBettingBet } from "../models/EventBettingBet.js";
import { debitWallet, creditWallet } from "./wallet.js";
import { getSettings } from "./settings.js";
import { UserProfile } from "../models/UserProfile.js";

let io: SocketIOServer | null = null;

export function setEventBettingIO(socketIO: SocketIOServer) {
  io = socketIO;
}

/**
 * Broadcast updated events to all users in event-betting room
 */
export async function broadcastEventsUpdate(): Promise<void> {
  if (!io) return;

  try {
    const events = await getEventsWithOdds();
    io.to("event-betting").emit("event:events_update", { events: events as any });
  } catch (error) {
    console.error("[Event Betting] Error broadcasting events:", error);
  }
}

/**
 * Calculate parimutuel odds for an event
 * Formula: Payout Multiplier = (Total Pool × (1 - House Edge)) / Option Pool
 * Minimum odds of 1.01 (1% return)
 */
export function calculateOdds(
  event: IEventBettingEvent | (IEventBettingEvent & { _id: any })
): EventOdds {
  const { houseEdge } = getSettings().eventBetting;
  const payoutPool = event.totalPool * (1 - houseEdge);

  const option1Odds =
    event.option1Pool > 0 ? payoutPool / event.option1Pool : 1.01;
  const option2Odds =
    event.option2Pool > 0 ? payoutPool / event.option2Pool : 1.01;

  const odds: EventOdds = {
    option1: Math.max(1.01, option1Odds),
    option2: Math.max(1.01, option2Odds),
  };

  // Only include draw odds if draw is allowed
  if (event.allowDraw) {
    const drawOdds = event.drawPool > 0 ? payoutPool / event.drawPool : 1.01;
    odds.draw = Math.max(1.01, drawOdds);
  }

  return odds;
}

/**
 * Place an event bet
 */
export async function placeEventBet(
  userId: string,
  eventId: string,
  option: BetOption,
  amount: number
): Promise<void> {
  // Validate amount
  const { minBet, maxBet, maxBetsPerEvent } = getSettings().eventBetting;
  if (amount < minBet || amount > maxBet) {
    throw new Error(
      `Valor da aposta deve estar entre ${minBet} e ${maxBet} coins`
    );
  }

  // Get event
  const event = await EventBettingEvent.findById(eventId);
  if (!event) {
    throw new Error("Evento não encontrado");
  }

  // Validate draw bet if draw is not allowed
  if (option === "draw" && !event.allowDraw) {
    throw new Error("Apostas em empate não são permitidas para este evento");
  }

  // Validate event status
  if (event.status !== "upcoming") {
    throw new Error("Apostas só podem ser feitas em eventos que ainda não começaram");
  }

  // Validate event hasn't started (only if startTime is set)
  if (event.startTime && new Date(event.startTime) <= new Date()) {
    throw new Error("Este evento já começou");
  }

  // Check user's bet count for this event
  const userBetCount = await EventBettingBet.countDocuments({
    eventId,
    userId,
  });
  if (userBetCount >= maxBetsPerEvent) {
    throw new Error(
      `Você atingiu o limite de ${maxBetsPerEvent} apostas por evento`
    );
  }

  // Debit wallet atomically
  await debitWallet(userId, amount, "bet_placed", {
    gameId: "event-betting",
    eventId: eventId,
  });

  // Calculate current odds for potential payout snapshot
  const poolField =
    option === "option1"
      ? "option1Pool"
      : option === "option2"
      ? "option2Pool"
      : "drawPool";

  // Update event pools atomically
  await EventBettingEvent.findByIdAndUpdate(eventId, {
    $inc: {
      totalPool: amount,
      [poolField]: amount,
    },
  });

  // Get updated event for odds calculation
  const updatedEvent = await EventBettingEvent.findById(eventId);
  if (!updatedEvent) {
    throw new Error("Erro ao atualizar evento");
  }

  const eventObj = updatedEvent.toObject();
  const odds = calculateOdds({
    ...eventObj,
    _id: eventObj._id.toString(),
  } as any);
  const potentialPayout = Math.ceil(amount * (odds[option] ?? 1.01)); // Fallback to minimum odds

  // Create bet record
  await EventBettingBet.create({
    eventId,
    userId,
    option,
    amount,
    potentialPayout,
  });

  // Broadcast odds and pool update
  if (io) {
    io.to("event-betting").emit("event:odds_update", {
      eventId: eventId,
      odds,
      totalPool: updatedEvent.totalPool,
      option1Pool: updatedEvent.option1Pool,
      option2Pool: updatedEvent.option2Pool,
      drawPool: updatedEvent.drawPool,
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
  const event = await EventBettingEvent.findByIdAndUpdate(
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
  const winningBets = await EventBettingBet.find({
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
    const actualPayout = Math.ceil(bet.amount * (finalOdds[result] ?? 1.01)); // Fallback to minimum odds

    // Update bet record
    await EventBettingBet.findByIdAndUpdate(bet._id, {
      actualPayout,
      won: true,
    });

    // Credit wallet
    await creditWallet(bet.userId, actualPayout, "bet_won", {
      gameId: "event-betting",
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
  await EventBettingBet.updateMany(
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
    io.to("event-betting").emit("event:event_result", {
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

  await EventBettingEvent.updateMany(
    {
      status: "upcoming",
      startTime: { $ne: null, $lte: now },
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
): Promise<Array<IEventBettingEvent & { odds: EventOdds }>> {
  const filter = status ? { status } : {};
  const events = await EventBettingEvent.find(filter).sort({ startTime: 1, createdAt: 1 });

  return events.map((event) => {
    const eventObj = event.toObject();
    const eventWithStringId = {
      ...eventObj,
      _id: eventObj._id.toString(),
      description: eventObj.description ?? null,
      result: eventObj.result as any,
    } as IEventBettingEvent;
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

  return EventBettingBet.find(filter)
    .populate("eventId")
    .sort({ createdAt: -1 });
}
