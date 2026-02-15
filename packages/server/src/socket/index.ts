import { Server } from "socket.io";
import type http from "node:http";
import type { ClientToServerEvents, ServerToClientEvents } from "@butecogames/shared";
import { socketAuthMiddleware } from "./middleware.js";
import { registerRouletteHandlers } from "./roulette.js";
import { registerChatHandlers } from "./chat.js";
import { setupSportsBettingHandlers } from "./sports-betting.js";
import { initRouletteEngine } from "../services/roulette.js";
import { setSportsBettingIO } from "../services/sports-betting.js";
import { env } from "../config/env.js";

export async function setupSocket(httpServer: http.Server) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  // Setup sports betting handlers and service
  setupSportsBettingHandlers(io);
  setSportsBettingIO(io);

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.data.displayName} (${socket.data.userId})`);

    registerRouletteHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.data.displayName}`);
    });
  });

  // Initialize the roulette game engine
  await initRouletteEngine(io);

  return io;
}
