import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { getAuth } from "./lib/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import usersRouter from "./routes/users.js";
import walletRouter from "./routes/wallet.js";
import gamesRouter from "./routes/games.js";
import leaderboardRouter from "./routes/leaderboard.js";
import eventBettingRouter from "./routes/event-betting.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  // CORS
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );

  // Better Auth handler — MUST be mounted before express.json()
  app.all("/api/auth/{*any}", toNodeHandler(getAuth()));

  // Body parsing
  app.use(express.json());

  // API routes
  app.use("/api/users", usersRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/games", gamesRouter);
  app.use("/api/leaderboard", leaderboardRouter);
  app.use("/api/event-betting", eventBettingRouter);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
