import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { UserProfile } from "../models/UserProfile.js";
import { getMongoDb } from "../db/connection.js";
import { disconnectUser } from "../socket/io-store.js";
import { getUserPresence } from "../services/presence.js";
import { logAudit } from "../services/audit.js";

const router = Router();

// GET /api/admin/users — List all users with profile data
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const search = (req.query.search as string) || "";
  const skip = (page - 1) * limit;

  const db = getMongoDb();
  const usersCollection = db.collection("user");

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [baUsers, total] = await Promise.all([
    usersCollection.find(filter).skip(skip).limit(limit).toArray(),
    usersCollection.countDocuments(filter),
  ]);

  // Better Auth may store the user ID as `id` field or as `_id`
  const getUserId = (u: Record<string, any>): string =>
    (u.id as string) || u._id?.toString();

  const userIds = baUsers.map(getUserId);
  const profiles = await UserProfile.find({ userId: { $in: userIds } });
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const users = baUsers.map((u) => {
    const uid = getUserId(u);
    return {
      id: uid,
      name: u.name as string,
      email: u.email as string,
      image: (u.image as string) || null,
      profile: profileMap.get(uid) || null,
      presence: getUserPresence(uid),
    };
  });

  res.json({
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// PUT /api/admin/users/:userId/role — Toggle admin role
router.put("/users/:userId/role", requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  const { role } = req.body;

  if (userId === req.user!.id) {
    res.status(400).json({ error: "Você não pode alterar seu próprio cargo" });
    return;
  }

  if (!["admin", "user"].includes(role)) {
    res.status(400).json({ error: "Cargo inválido" });
    return;
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { role } },
    { new: true },
  );

  if (!profile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }

  logAudit({
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: "user.role_change",
    targetId: userId,
    targetLabel: profile.displayName,
    oldData: { role: role === "admin" ? "user" : "admin" },
    newData: { role },
  });

  res.json({ profile });
});

// PUT /api/admin/users/:userId/ban — Ban or unban a user
router.put("/users/:userId/ban", requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  const { banned } = req.body;

  if (userId === req.user!.id) {
    res.status(400).json({ error: "Você não pode banir a si mesmo" });
    return;
  }

  const updateFields: Record<string, unknown> = { banned: !!banned };
  if (banned) {
    updateFields.bannedAt = new Date();
  } else {
    updateFields.bannedAt = null;
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: updateFields },
    { new: true },
  );

  if (!profile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }

  if (banned) {
    disconnectUser(userId);
  }

  logAudit({
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: "user.ban_change",
    targetId: userId,
    targetLabel: profile.displayName,
    oldData: { banned: !banned },
    newData: { banned: !!banned },
  });

  res.json({ profile });
});

export default router;
