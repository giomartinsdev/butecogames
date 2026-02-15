import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../lib/auth.js";
import { UserProfile } from "../models/UserProfile.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = session.user;
    req.session = session.session;

    const profile = await UserProfile.findOne({ userId: session.user.id });
    if (profile?.banned) {
      res.status(403).json({ error: "Conta banida" });
      return;
    }

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
