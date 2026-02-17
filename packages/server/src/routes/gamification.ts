import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { UserProfile } from "../models/UserProfile.js";
import { Wallet } from "../models/Wallet.js";
import { ACHIEVEMENTS, getLevelInfo } from "@butecogames/shared";
import { getActiveChallenges } from "../services/gamification.js";

const router = Router();

// Get all achievement definitions
router.get("/achievements", requireAuth, (_req, res) => {
  res.json({ achievements: ACHIEVEMENTS });
});

// Get user's unlocked achievements
router.get("/my-achievements", requireAuth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user!.id });
    res.json({ achievements: profile?.achievements ?? [] });
  } catch {
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

// Get user's active challenges (lazily assigned)
router.get("/challenges", requireAuth, async (req, res) => {
  try {
    const challenges = await getActiveChallenges(req.user!.id);
    res.json({ challenges });
  } catch {
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

// Get user's level info
router.get("/level-info", requireAuth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user!.id });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const levelInfo = getLevelInfo(profile.xp);
    res.json(levelInfo);
  } catch {
    res.status(500).json({ error: "Failed to fetch level info" });
  }
});

// Get user's gamification stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user!.id });
    const wallet = await Wallet.findOne({ userId: req.user!.id });

    res.json({
      totalBets: profile?.totalBets ?? 0,
      totalWins: profile?.totalWins ?? 0,
      totalTransfers: profile?.totalTransfers ?? 0,
      totalDailyRewards: profile?.totalDailyRewards ?? 0,
      totalChallengesCompleted: profile?.totalChallengesCompleted ?? 0,
      totalWagered: wallet?.totalWagered ?? 0,
      totalWon: wallet?.totalWon ?? 0,
      xp: profile?.xp ?? 0,
      level: profile?.level ?? 1,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
