import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { UnoRoom } from "../models/UnoRoom.js";

const router = Router();

/**
 * GET /api/uno/history
 * User's match history (paginated)
 */
router.get("/history", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const userId = req.user!.id;

    const filter = {
      "players.userId": userId,
      status: "finished",
    };

    const [matches, total] = await Promise.all([
      UnoRoom.find(filter)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UnoRoom.countDocuments(filter),
    ]);

    const history = matches.map((m) => ({
      _id: m._id.toString(),
      roomId: m._id.toString(),
      betAmount: m.betAmount,
      playerCount: m.players.length,
      players: m.players,
      winnerId: m.winnerId,
      winnerName: m.winnerName,
      payout: m.payout,
      duration: m.duration,
      createdAt: m.createdAt.toISOString(),
    }));

    res.json({
      matches: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/uno/stats
 * User's UNO stats
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const [wins, totalGames] = await Promise.all([
      UnoRoom.countDocuments({
        winnerId: userId,
        status: "finished",
      }),
      UnoRoom.countDocuments({
        "players.userId": userId,
        status: "finished",
      }),
    ]);

    const losses = totalGames - wins;

    res.json({
      stats: { wins, losses, total: totalGames },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/uno/recent
 * Latest 15 completed matches (for lobby display)
 */
router.get("/recent", requireAuth, async (_req, res) => {
  try {
    const matches = await UnoRoom.find({ status: "finished" })
      .sort({ completedAt: -1 })
      .limit(15)
      .lean();

    // Collect unique player IDs to look up avatars
    const playerIds = new Set<string>();
    for (const m of matches) {
      for (const p of m.players) {
        playerIds.add(p.userId);
      }
    }

    const avatarMap = new Map<string, string | null>();
    if (playerIds.size > 0) {
      const ids = [...playerIds];
      const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
      const userCol = mongoose.connection.db!.collection("user");
      const users = await userCol
        .find(
          { _id: { $in: objectIds } },
          { projection: { _id: 1, image: 1 } },
        )
        .toArray();
      for (const u of users) {
        avatarMap.set(String(u._id), (u.image as string) ?? null);
      }
    }

    const recent = matches.map((m) => ({
      _id: m._id.toString(),
      betAmount: m.betAmount,
      playerCount: m.players.length,
      players: m.players.map((p) => ({
        ...p,
        avatar: avatarMap.get(p.userId) ?? null,
      })),
      winnerId: m.winnerId,
      winnerName: m.winnerName,
      payout: m.payout,
      duration: m.duration,
      completedAt:
        m.completedAt?.toISOString() ?? m.createdAt.toISOString(),
    }));

    res.json({ matches: recent });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno";
    res.status(500).json({ error: message });
  }
});

export default router;
