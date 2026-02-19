import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { AuditLog } from "../models/AuditLog.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const search = (req.query.search as string) || "";
    const action = (req.query.action as string) || "";
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (action) {
      filter.action = action;
    }

    if (search) {
      filter.$or = [
        { adminName: { $regex: search, $options: "i" } },
        { targetLabel: { $regex: search, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ error: "Erro ao buscar logs de auditoria" });
  }
});

export default router;
