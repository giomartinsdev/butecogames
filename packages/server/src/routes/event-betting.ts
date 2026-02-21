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
import { downloadEventImage } from "../services/image-download.js";
import { logAudit } from "../services/audit.js";
import { getUpcomingUfcEvent } from "../services/ufc-scraper.js";

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
 * GET /api/event-betting/ufc/upcoming
 * Scrape next upcoming UFC event fight card (admin only)
 */
router.get("/ufc/upcoming", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await getUpcomingUfcEvent();
    res.json(data);
  } catch (error: any) {
    console.error("[UFC Scraper] Error:", error);
    res.status(502).json({
      error: `Erro ao buscar evento UFC: ${error.message}`,
    });
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
    const { title, description, category, option1, option2, startTime, allowDraw, option1ImageUrl, option2ImageUrl } = req.body;

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
      allowDraw: allowDraw !== undefined ? allowDraw : true,
      option1ImageUrl: option1ImageUrl || null,
      option2ImageUrl: option2ImageUrl || null,
    });

    // Download option images if URLs provided
    if (option1ImageUrl || option2ImageUrl) {
      const eventId = event._id.toString();
      const downloads = await Promise.allSettled([
        option1ImageUrl ? downloadEventImage(eventId, option1ImageUrl) : Promise.resolve(null),
        option2ImageUrl ? downloadEventImage(eventId, option2ImageUrl) : Promise.resolve(null),
      ]);

      const option1Image = downloads[0].status === "fulfilled" ? downloads[0].value : null;
      const option2Image = downloads[1].status === "fulfilled" ? downloads[1].value : null;

      if (downloads[0].status === "rejected") {
        console.error("[Event Betting] Failed to download option1 image:", downloads[0].reason);
      }
      if (downloads[1].status === "rejected") {
        console.error("[Event Betting] Failed to download option2 image:", downloads[1].reason);
      }

      if (option1Image || option2Image) {
        event.option1Image = option1Image;
        event.option2Image = option2Image;
        await event.save();
      }
    }

    // Broadcast updated events to all users
    await broadcastEventsUpdate();

    logAudit({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: "event.create",
      targetId: event._id.toString(),
      targetLabel: title,
      oldData: null,
      newData: { title, category, option1, option2, startTime: start, allowDraw },
    });

    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/event-betting/events/:eventId
 * Edit event details (admin only). Only non-completed events.
 */
router.put("/events/:eventId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, option1, option2 } = req.body;

    if (!title || !option1 || !option2) {
      return res.status(400).json({ error: "Título e opções são obrigatórios" });
    }

    const event = await EventBettingEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    if (event.status === "completed") {
      return res.status(400).json({ error: "Não é possível editar um evento já concluído" });
    }

    const oldData = { title: event.title, description: event.description, option1: event.option1, option2: event.option2 };

    event.title = title;
    event.description = description || null;
    event.option1 = option1;
    event.option2 = option2;
    await event.save();

    await broadcastEventsUpdate();

    logAudit({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: "event.update",
      targetId: event._id.toString(),
      targetLabel: title,
      oldData,
      newData: { title, description, option1, option2 },
    });

    res.json({ event });
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

    // Update startTime: set if provided, clear if not
    if (startTime) {
      const newStartTime = new Date(startTime);

      // Validate that startTime is in the future when changing to "upcoming"
      if (status === "upcoming" && newStartTime <= new Date()) {
        return res.status(400).json({
          error: "O horário de início deve estar no futuro para eventos próximos",
        });
      }

      event.startTime = newStartTime;
    } else {
      event.startTime = null;
    }

    const oldStatus = event.status;
    event.status = status as any;
    await event.save();

    // Broadcast updated events to all users
    await broadcastEventsUpdate();

    logAudit({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: "event.status_change",
      targetId: event._id.toString(),
      targetLabel: event.title,
      oldData: { status: oldStatus },
      newData: { status },
    });

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

    if (result === "draw" && !event.allowDraw) {
      return res.status(400).json({ error: "Este evento não permite empate" });
    }

    const oldStatus = event.status;
    await resolveEvent(req.params.eventId as string, result as BetOption);

    logAudit({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: "event.resolve",
      targetId: event._id.toString(),
      targetLabel: event.title,
      oldData: { status: oldStatus },
      newData: { status: "completed", result },
    });

    res.json({ success: true, message: "Evento encerrado com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/event-betting/events/:eventId/images
 * Retry or edit option images (admin only).
 * Overwrites existing R2 images to prevent dead files.
 */
router.put("/events/:eventId/images", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { option1ImageUrl, option2ImageUrl } = req.body;

    if (!option1ImageUrl && !option2ImageUrl) {
      return res.status(400).json({ error: "Forneça pelo menos uma URL de imagem" });
    }

    const event = await EventBettingEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    const eventId = event._id.toString();
    const downloads = await Promise.allSettled([
      option1ImageUrl
        ? downloadEventImage(eventId, option1ImageUrl, event.option1Image)
        : Promise.resolve(null),
      option2ImageUrl
        ? downloadEventImage(eventId, option2ImageUrl, event.option2Image)
        : Promise.resolve(null),
    ]);

    const option1Image = downloads[0].status === "fulfilled" ? downloads[0].value : null;
    const option2Image = downloads[1].status === "fulfilled" ? downloads[1].value : null;

    const errors: string[] = [];
    if (downloads[0].status === "rejected") {
      console.error("[Event Betting] Failed to download option1 image:", downloads[0].reason);
      errors.push(`Opção 1: ${downloads[0].reason}`);
    }
    if (downloads[1].status === "rejected") {
      console.error("[Event Betting] Failed to download option2 image:", downloads[1].reason);
      errors.push(`Opção 2: ${downloads[1].reason}`);
    }

    // Update image fields (only for successful downloads)
    if (option1Image !== null) {
      event.option1Image = option1Image;
      event.option1ImageUrl = option1ImageUrl;
    }
    if (option2Image !== null) {
      event.option2Image = option2Image;
      event.option2ImageUrl = option2ImageUrl;
    }
    await event.save();

    await broadcastEventsUpdate();

    logAudit({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: "event.update_images",
      targetId: eventId,
      targetLabel: event.title,
      oldData: null,
      newData: { option1ImageUrl, option2ImageUrl },
    });

    if (errors.length > 0) {
      return res.json({ event, errors });
    }

    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
