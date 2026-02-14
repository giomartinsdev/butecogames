import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { getOrCreateWallet, claimDailyReward } from "../services/wallet.js";

const router = Router();

// Get wallet balance
router.get("/", requireAuth, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user!.id);
    res.json({ wallet });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

// Get transaction history
router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: req.user!.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ userId: req.user!.id }),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Claim daily reward
router.post("/daily-reward", requireAuth, async (req, res) => {
  try {
    const { wallet, claimed } = await claimDailyReward(req.user!.id);
    res.json({ wallet, claimed });
  } catch (err) {
    res.status(500).json({ error: "Failed to claim daily reward" });
  }
});

export default router;
