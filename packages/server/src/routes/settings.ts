import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { getSettings, updateSettings } from "../services/settings.js";
import { broadcastRouletteState } from "../services/roulette.js";
import { getIO } from "../socket/io-store.js";
import { logAudit } from "../services/audit.js";

const router = Router();

router.get("/", requireAuth, (_req, res) => {
  res.json(getSettings());
});

router.put("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const oldSettings = getSettings();
    const updated = await updateSettings(req.body);
    broadcastRouletteState();
    getIO().emit("settings:cursor_size", { cursorSize: updated.general.cursorSize });
    getIO().emit("settings:away_timeout", { awayTimeout: updated.general.awayTimeout });

    logAudit({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: "settings.update",
      targetId: "settings",
      targetLabel: "Configurações",
      oldData: { ...oldSettings },
      newData: { ...updated },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

export default router;
