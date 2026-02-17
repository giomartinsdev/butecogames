import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { CardDuelRoom } from "../models/CardDuelRoom.js";

const router = Router();

/**
 * GET /api/card-duel/history
 * User's match history (paginated)
 */
router.get("/history", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const userId = req.user!.id;

    const filter = {
      $or: [{ player1Id: userId }, { player2Id: userId }],
      status: { $in: ["finished", "revenge_declined"] },
    };

    const [matches, total] = await Promise.all([
      CardDuelRoom.find(filter)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CardDuelRoom.countDocuments(filter),
    ]);

    const history = matches.map((m) => ({
      _id: m._id.toString(),
      roomId: m._id.toString(),
      gameType: m.gameType,
      betAmount: m.betAmount,
      player1: { userId: m.player1Id, displayName: m.player1Name },
      player2: {
        userId: m.player2Id ?? "",
        displayName: m.player2Name ?? "",
      },
      rounds: m.rounds,
      result: m.result,
      winnerId: m.winnerId,
      isBot: m.isBot ?? false,
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
 * GET /api/card-duel/stats
 * User's card duel stats
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const completedFilter = {
      status: { $in: ["finished", "revenge_declined"] },
    };

    const [wins, losses, draws] = await Promise.all([
      CardDuelRoom.countDocuments({
        winnerId: userId,
        ...completedFilter,
      }),
      CardDuelRoom.countDocuments({
        $or: [{ player1Id: userId }, { player2Id: userId }],
        winnerId: { $ne: null, $nin: [userId] },
        ...completedFilter,
      }),
      CardDuelRoom.countDocuments({
        $or: [{ player1Id: userId }, { player2Id: userId }],
        result: "draw",
        ...completedFilter,
      }),
    ]);

    res.json({
      stats: { wins, losses, draws, total: wins + losses + draws },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/card-duel/recent
 * Latest 15 completed matches (for lobby display)
 */
router.get("/recent", requireAuth, async (_req, res) => {
  try {
    const matches = await CardDuelRoom.find({
      status: { $in: ["finished", "revenge_declined"] },
    })
      .sort({ completedAt: -1 })
      .limit(15)
      .lean();

    // Collect unique player IDs to look up avatars
    const playerIds = new Set<string>();
    for (const m of matches) {
      if (m.player1Id) playerIds.add(m.player1Id);
      if (m.player2Id && !(m.isBot)) playerIds.add(m.player2Id);
    }

    // Look up avatars from Better Auth's user collection
    const avatarMap = new Map<string, string | null>();
    if (playerIds.size > 0) {
      const ids = [...playerIds];
      const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
      const userCol = mongoose.connection.db!.collection("user");
      const users = await userCol
        .find({ _id: { $in: objectIds } }, { projection: { _id: 1, image: 1 } })
        .toArray();
      for (const u of users) {
        avatarMap.set(String(u._id), (u.image as string) ?? null);
      }
    }

    const recent = matches.map((m) => ({
      _id: m._id.toString(),
      gameType: m.gameType,
      betAmount: m.betAmount,
      isBot: m.isBot ?? false,
      player1: {
        userId: m.player1Id,
        displayName: m.player1Name,
        avatar: avatarMap.get(m.player1Id) ?? null,
      },
      player2: {
        userId: m.player2Id ?? "",
        displayName: m.player2Name ?? "",
        avatar: m.isBot ? null : avatarMap.get(m.player2Id ?? "") ?? null,
      },
      rounds: m.rounds,
      result: m.result,
      winnerId: m.winnerId,
      completedAt: m.completedAt?.toISOString() ?? m.createdAt.toISOString(),
    }));

    res.json({ matches: recent });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno";
    res.status(500).json({ error: message });
  }
});

export default router;
