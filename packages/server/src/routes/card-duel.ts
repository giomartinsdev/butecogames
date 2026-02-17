import { Router } from "express";
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

export default router;
