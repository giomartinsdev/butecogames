import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getOrCreateUserSettings,
  updateUserSettings,
} from "../services/user-settings.js";
import { getSettings } from "../services/settings.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const settings = await getOrCreateUserSettings(req.user!.id);
    const { general } = getSettings();
    res.json({ settings, cursorSize: general.cursorSize, awayTimeout: general.awayTimeout });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar configurações" });
  }
});

router.put("/", requireAuth, async (req, res) => {
  try {
    const { cursorSetId, soundEnabled } = req.body;
    const settings = await updateUserSettings(req.user!.id, { cursorSetId, soundEnabled });
    const { general } = getSettings();
    res.json({ settings, cursorSize: general.cursorSize, awayTimeout: general.awayTimeout });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Cursor inválido") {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

export default router;
