import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { UserNotification } from "../models/UserNotification.js";

const router = Router();

router.use(requireAuth);

// GET /api/notifications — paginated list with populated notification data
router.get("/", async (req, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId };
  if (req.query.unreadOnly === "true") {
    filter.read = false;
  }

  const [notifications, total] = await Promise.all([
    UserNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("notificationId")
      .lean(),
    UserNotification.countDocuments(filter),
  ]);

  res.json({
    notifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  const count = await UserNotification.countDocuments({
    userId: req.user!.id,
    read: false,
  });
  res.json({ count });
});

// PUT /api/notifications/:id/read — mark one as read
router.put("/:id/read", async (req, res) => {
  const result = await UserNotification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id, read: false },
    { $set: { read: true, readAt: new Date() } },
    { new: true },
  );

  if (!result) {
    return res.status(404).json({ error: "Notificação não encontrada" });
  }

  res.json({ ok: true });
});

// PUT /api/notifications/read-all — mark all unread as read
router.put("/read-all", async (req, res) => {
  await UserNotification.updateMany(
    { userId: req.user!.id, read: false },
    { $set: { read: true, readAt: new Date() } },
  );
  res.json({ ok: true });
});

export default router;
