import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { getIO } from "../socket/io-store.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// POST /api/admin/notifications — broadcast a global notification
router.post("/", (req, res) => {
  const { type, title, message } = req.body;

  const validTypes = ["info", "success", "warning", "error", "announcement"];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: "Tipo inválido" });
  }
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "Título obrigatório" });
  }
  if (title.length > 100) {
    return res.status(400).json({ error: "Título muito longo (máx. 100 caracteres)" });
  }
  if (message && typeof message === "string" && message.length > 500) {
    return res.status(400).json({ error: "Mensagem muito longa (máx. 500 caracteres)" });
  }

  const io = getIO();
  io.emit("notification:global", {
    type: type as "info" | "success" | "warning" | "error" | "announcement",
    title: title.trim(),
    message: message?.trim() || undefined,
  });

  res.json({ ok: true });
});

export default router;
