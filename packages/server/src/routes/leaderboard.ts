import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Wallet } from "../models/Wallet.js";
import { UserProfile } from "../models/UserProfile.js";

const router = Router();

// Simple in-memory cache
let cache: { data: Record<string, unknown[]>; expiry: number } = {
  data: {},
  expiry: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getLeaderboardData() {
  if (Date.now() < cache.expiry && Object.keys(cache.data).length > 0) {
    return cache.data;
  }

  const [coinLeaders, xpLeaders, wageredLeaders] = await Promise.all([
    Wallet.find().sort({ balance: -1 }).limit(50).lean(),
    UserProfile.find().sort({ xp: -1 }).limit(50).lean(),
    Wallet.find().sort({ totalWon: -1 }).limit(50).lean(),
  ]);

  // Enrich with display names
  const allUserIds = [
    ...new Set([
      ...coinLeaders.map((w) => w.userId),
      ...xpLeaders.map((u) => u.userId),
      ...wageredLeaders.map((w) => w.userId),
    ]),
  ];
  const profiles = await UserProfile.find({ userId: { $in: allUserIds } }).lean();
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  function assignRanks<T>(items: T[], getValue: (item: T) => number) {
    let rank = 1;
    return items.map((item, i) => {
      if (i > 0 && getValue(item) < getValue(items[i - 1])) {
        rank = i + 1;
      }
      return { item, rank };
    });
  }

  const enrichCoins = assignRanks(coinLeaders, (w) => w.balance).map(({ item: w, rank }) => ({
    rank,
    userId: w.userId,
    displayName: profileMap.get(w.userId)?.displayName ?? "Unknown",
    level: profileMap.get(w.userId)?.level ?? 1,
    value: w.balance,
  }));

  const enrichXp = assignRanks(xpLeaders, (u) => u.xp).map(({ item: u, rank }) => ({
    rank,
    userId: u.userId,
    displayName: u.displayName,
    level: u.level,
    value: u.xp,
  }));

  const enrichWins = assignRanks(wageredLeaders, (w) => w.totalWon).map(({ item: w, rank }) => ({
    rank,
    userId: w.userId,
    displayName: profileMap.get(w.userId)?.displayName ?? "Unknown",
    level: profileMap.get(w.userId)?.level ?? 1,
    value: w.totalWon,
  }));

  cache = {
    data: { coins: enrichCoins, xp: enrichXp, wins: enrichWins },
    expiry: Date.now() + CACHE_TTL,
  };

  return cache.data;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const type = (req.query.type as string) || "coins";
    const data = await getLeaderboardData();
    const leaderboard = data[type] || data["coins"];
    res.json({ leaderboard, type });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
