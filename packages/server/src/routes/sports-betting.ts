import { Router } from "express";
import type { BetOption } from "@butecogames/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { SportsBettingEvent } from "../models/SportsBettingEvent.js";
import {
  getEventsWithOdds,
  getUserBets,
  resolveEvent,
  broadcastEventsUpdate,
} from "../services/sports-betting.js";

const router = Router();

// Public routes (require auth)

/**
 * GET /api/sports-betting/events
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
 * GET /api/sports-betting/events/:eventId
 * Get single event with odds
 */
router.get("/events/:eventId", requireAuth, async (req, res) => {
  try {
    const event = await SportsBettingEvent.findById(req.params.eventId);
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
 * GET /api/sports-betting/my-bets
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
 * POST /api/sports-betting/events
 * Create a new event (admin only)
 */
router.post("/events", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, team1, team2, startTime } = req.body;

    // Validate required fields
    if (!title || !description || !category || !team1 || !team2 || !startTime) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Validate startTime is in the future
    const start = new Date(startTime);
    if (start <= new Date()) {
      return res.status(400).json({
        error: "O horário de início deve estar no futuro",
      });
    }

    // Validate category
    const validCategories = ["football", "basketball", "volleyball", "esports", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Categoria inválida" });
    }

    const event = await SportsBettingEvent.create({
      title,
      description,
      category,
      team1,
      team2,
      startTime: start,
    });

    // Broadcast updated events to all users
    await broadcastEventsUpdate();

    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/sports-betting/events/:eventId/status
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

    const event = await SportsBettingEvent.findById(req.params.eventId);
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
 * POST /api/sports-betting/events/:eventId/resolve
 * Resolve event and pay winners (admin only)
 */
router.post("/events/:eventId/resolve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { result } = req.body;

    if (!["team1", "team2", "draw"].includes(result)) {
      return res.status(400).json({ error: "Resultado inválido" });
    }

    const event = await SportsBettingEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    if (event.status === "completed") {
      return res.status(400).json({ error: "Evento já foi resolvido" });
    }

    await resolveEvent(req.params.eventId as string, result as BetOption);

    res.json({ success: true, message: "Evento resolvido com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
