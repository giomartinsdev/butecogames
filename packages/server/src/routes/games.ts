import { Router } from "express";
import { GAMES } from "@butecogames/shared";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get list of available games
router.get("/", requireAuth, async (_req, res) => {
  res.json({ games: GAMES });
});

export default router;
