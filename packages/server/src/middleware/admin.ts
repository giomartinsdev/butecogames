import type { Request, Response, NextFunction } from "express";
import { UserProfile } from "../models/UserProfile.js";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const profile = await UserProfile.findOne({ userId: req.user.id });
  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  next();
}
