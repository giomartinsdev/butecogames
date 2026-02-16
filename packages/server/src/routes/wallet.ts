import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { UserProfile } from "../models/UserProfile.js";
import { Wallet } from "../models/Wallet.js";
import { getOrCreateWallet, claimDailyReward, transferCoins } from "../services/wallet.js";
import { getIO } from "../socket/io-store.js";
import { getMongoDb } from "../db/connection.js";

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

// Search users for transfer autocomplete
router.get("/search-users", requireAuth, async (req, res) => {
  try {
    const q = (req.query.q as string || "").trim();
    if (q.length < 2) {
      res.json({ users: [] });
      return;
    }

    const db = getMongoDb();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const currentUserId = req.user!.id;

    const baUsers = await db
      .collection("user")
      .find({ name: { $regex: escaped, $options: "i" } })
      .limit(11)
      .toArray();

    const getUserId = (u: Record<string, any>): string =>
      (u.id as string) || u._id?.toString();

    const filtered = baUsers.filter((u) => getUserId(u) !== currentUserId).slice(0, 10);
    const userIds = filtered.map(getUserId);

    const accounts = await db
      .collection("account")
      .find({ userId: { $in: userIds }, providerId: "discord" })
      .toArray();
    const accountMap = new Map(accounts.map((a) => [a.userId as string, a.accountId as string]));

    const users = filtered.map((u) => {
      const uid = getUserId(u);
      return {
        id: uid,
        name: u.name as string,
        image: (u.image as string) || null,
        discordId: accountMap.get(uid) || null,
      };
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// Transfer coins to another user
router.post("/transfer", requireAuth, async (req, res) => {
  try {
    const { recipientId, amount } = req.body;

    if (!recipientId || typeof recipientId !== "string") {
      res.status(400).json({ error: "Destinatário é obrigatório" });
      return;
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "Valor inválido" });
      return;
    }

    if (recipientId === req.user!.id) {
      res.status(400).json({ error: "Você não pode transferir para si mesmo" });
      return;
    }

    const recipient = await UserProfile.findOne({ userId: recipientId });

    if (!recipient) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    const wallet = await transferCoins(req.user!.id, recipientId, amount);

    // Notify recipient in real-time
    const recipientWallet = await Wallet.findOne({ userId: recipientId });
    if (recipientWallet) {
      getIO().to(`user:${recipientId}`).emit("wallet:updated", {
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
