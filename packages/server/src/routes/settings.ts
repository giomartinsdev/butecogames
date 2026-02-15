import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { getSettings, updateSettings } from "../services/settings.js";
import { broadcastRouletteState } from "../services/roulette.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, (_req, res) => {
  res.json(getSettings());
});

router.put("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await updateSettings(req.body);
    broadcastRouletteState();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

export default router;
