import { Router } from "express";
import type { Types } from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { getIO } from "../socket/io-store.js";
import { Notification } from "../models/Notification.js";
import { UserNotification } from "../models/UserNotification.js";
import { UserProfile } from "../models/UserProfile.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const validTypes = ["info", "success", "warning", "error", "announcement"];

function validateNotification(body: Record<string, unknown>) {
  const { type, title, message } = body;
  if (!type || !validTypes.includes(type as string)) {
    return "Tipo inválido";
  }
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return "Título obrigatório";
  }
  if ((title as string).length > 100) {
    return "Título muito longo (máx. 100 caracteres)";
  }
  if (message && typeof message === "string" && message.length > 500) {
    return "Mensagem muito longa (máx. 500 caracteres)";
  }
  return null;
}

/** Create UserNotification for ALL registered users and emit unread counts to online ones */
async function distributeToUsers(notificationId: Types.ObjectId) {
  const io = getIO();

  // Get all registered user IDs
  const profiles = await UserProfile.find({ banned: { $ne: true } }, { userId: 1 }).lean();
  const allUserIds = profiles.map((p) => p.userId);

  if (allUserIds.length === 0) return;

  // Bulk insert UserNotification records for every user
  const docs = allUserIds.map((userId) => ({
    userId,
    notificationId,
    read: false,
  }));
  await UserNotification.insertMany(docs);

  // Emit updated unread count only to currently online users
  const onlineUserIds = new Set<string>();
  for (const [, socket] of io.sockets.sockets) {
    if (socket.data.userId) {
      onlineUserIds.add(socket.data.userId);
    }
  }

  if (onlineUserIds.size === 0) return;

  const counts = await UserNotification.aggregate([
    { $match: { userId: { $in: [...onlineUserIds] }, read: false } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  for (const { _id: userId, count } of counts) {
    io.to(`user:${userId}`).emit("notification:unread_count", { count });
  }
}

// POST /api/admin/notifications — broadcast a global notification
router.post("/", async (req, res) => {
  const error = validateNotification(req.body);
  if (error) return res.status(400).json({ error });

  const { type, title, message } = req.body;
  const trimmedTitle = (title as string).trim();
  const trimmedMessage = message?.trim() || undefined;

  const notification = await Notification.create({
    type,
    title: trimmedTitle,
    message: trimmedMessage,
    sentBy: req.user!.id,
    sentByName: req.user!.name,
  });

  const io = getIO();
  io.emit("notification:global", {
    type: type as "info" | "success" | "warning" | "error" | "announcement",
    title: trimmedTitle,
    message: trimmedMessage,
  });

  // Create per-user records and emit unread counts (non-blocking)
  distributeToUsers(notification._id as Types.ObjectId).catch(() => {});

  res.json({ ok: true, notification });
});

// POST /api/admin/notifications/:id/resend — resend an existing notification
router.post("/:id/resend", async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: "Notificação não encontrada" });
  }

  const resent = await Notification.create({
    type: notification.type,
    title: notification.title,
    message: notification.message,
    sentBy: req.user!.id,
    sentByName: req.user!.name,
  });

  const io = getIO();
  io.emit("notification:global", {
    type: notification.type,
    title: notification.title,
    message: notification.message,
  });

  // Create per-user records and emit unread counts (non-blocking)
  distributeToUsers(resent._id as Types.ObjectId).catch(() => {});

  res.json({ ok: true, notification: resent });
});

// GET /api/admin/notifications — list notification history
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const search = (req.query.search as string) || "";
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ];
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  res.json({
    notifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export default router;
