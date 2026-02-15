import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { UserProfile } from "../models/UserProfile.js";
import { Wallet } from "../models/Wallet.js";
import { getOrCreateWallet, claimDailyReward, transferCoins } from "../services/wallet.js";
import { getIO } from "../socket/io-store.js";

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

// Transfer coins to another user
router.post("/transfer", requireAuth, async (req, res) => {
  try {
    const { recipientName, amount } = req.body;

    if (!recipientName || typeof recipientName !== "string") {
      res.status(400).json({ error: "Nome do destinatário é obrigatório" });
      return;
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "Valor inválido" });
      return;
    }

    const recipient = await UserProfile.findOne({
      displayName: { $regex: new RegExp(`^${recipientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (!recipient) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    if (recipient.userId === req.user!.id) {
      res.status(400).json({ error: "Você não pode transferir para si mesmo" });
      return;
    }

    const wallet = await transferCoins(req.user!.id, recipient.userId, amount);

    // Notify recipient in real-time
    const recipientWallet = await Wallet.findOne({ userId: recipient.userId });
    if (recipientWallet) {
      getIO().to(`user:${recipient.userId}`).emit("wallet:updated", {
        balance: recipientWallet.balance,
      });
    }

    res.json({ wallet });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Erro ao transferir coins" });
  }
});

export default router;
