import { Router } from "express";
import type { BetOption } from "@butecogames/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { EventBettingEvent } from "../models/EventBettingEvent.js";
import {
  getEventsWithOdds,
  getUserBets,
  resolveEvent,
  broadcastEventsUpdate,
} from "../services/event-betting.js";

const router = Router();

// Public routes (require auth)

/**
 * GET /api/event-betting/events
 * List all events with odds
 */
router.get("/events", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const events = await getEventsWithOdds(status as string | undefined);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/event-betting/events/:eventId
 * Get single event with odds
 */
router.get("/events/:eventId", requireAuth, async (req, res) => {
  try {
    const event = await EventBettingEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    const eventObj = event.toObject();
    res.json({
      event: {
        ...eventObj,
        _id: eventObj._id.toString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/event-betting/my-bets
 * Get user's bets
 */
router.get("/my-bets", requireAuth, async (req, res) => {
  try {
    const { eventId } = req.query;
    let eventIdStr: string | undefined;
    if (Array.isArray(eventId) && eventId.length > 0 && typeof eventId[0] === "string") {
      eventIdStr = eventId[0];
    } else if (typeof eventId === "string") {
      eventIdStr = eventId;
    }
    const bets = await getUserBets(req.user!.id, eventIdStr);
    res.json({ bets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes (require auth + admin)

/**
 * POST /api/event-betting/events
 * Create a new event (admin only)
 */
router.post("/events", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, option1, option2, startTime, allowDraw } = req.body;

    // Validate required fields
    if (!title || !category || !option1 || !option2) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Validate startTime is in the future (if provided)
    let start: Date | null = null;
    if (startTime) {
      start = new Date(startTime);
      if (start <= new Date()) {
        return res.status(400).json({
          error: "O horário de início deve estar no futuro",
        });
      }
    }

    // Validate category
    const validCategories = ["ufc", "sports", "esports", "entertainment", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Categoria inválida" });
    }

    const event = await EventBettingEvent.create({
      title,
      description,
      category,
      option1,
      option2,
      startTime: start,
      allowDraw: allowDraw !== undefined ? allowDraw : true, // Default to true
    });

    // Broadcast updated events to all users
    await broadcastEventsUpdate();

    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/event-betting/events/:eventId/status
 * Update event status (admin only)
 * Optionally update startTime when changing status
 */
router.put("/events/:eventId/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, startTime } = req.body;

    // Allow all status transitions except to/from completed
    if (!["upcoming", "in_progress", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const event = await EventBettingEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Prevent changes to completed events
    if (event.status === "completed") {
      return res.status(400).json({
        error: "Não é possível alterar o status de um evento já concluído",
      });
    }

    // Prevent changing to completed (must use resolve endpoint)
    if (status === "completed") {
      return res.status(400).json({
        error: "Use o endpoint de resolução para marcar como concluído",
      });
    }

    // If startTime is provided, validate and update it
    if (startTime) {
      const newStartTime = new Date(startTime);

      // Validate that startTime is in the future when changing to "upcoming"
      if (status === "upcoming" && newStartTime <= new Date()) {
        return res.status(400).json({
          error: "O horário de início deve estar no futuro para eventos próximos",
        });
      }

      event.startTime = newStartTime;
    }

    event.status = status as any;
    await event.save();

    // Broadcast updated events to all users
    await broadcastEventsUpdate();

    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/event-betting/events/:eventId/resolve
 * Resolve event and pay winners (admin only)
 */
router.post("/events/:eventId/resolve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { result } = req.body;

    if (!["option1", "option2", "draw"].includes(result)) {
      return res.status(400).json({ error: "Resultado inválido" });
    }

    const event = await EventBettingEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    if (event.status === "completed") {
      return res.status(400).json({ error: "Evento já foi resolvido" });
    }

    await resolveEvent(req.params.eventId as string, result as BetOption);

    res.json({ success: true, message: "Evento encerrado com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
