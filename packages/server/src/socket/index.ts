import { Server } from "socket.io";
import type http from "node:http";
import type { ClientToServerEvents, ServerToClientEvents } from "@butecogames/shared";
import { socketAuthMiddleware } from "./middleware.js";
import { registerRouletteHandlers } from "./roulette.js";
import { registerChatHandlers } from "./chat.js";
import { setupEventBettingHandlers } from "./event-betting.js";
import { initRouletteEngine } from "../services/roulette.js";
import { setEventBettingIO } from "../services/event-betting.js";
import { env } from "../config/env.js";
import { setIO } from "./io-store.js";

export async function setupSocket(httpServer: http.Server) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);
  setIO(io);

  // Setup event betting handlers and service
  setupEventBettingHandlers(io);
  setEventBettingIO(io);

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.data.displayName} (${socket.data.userId})`);

    // Join a user-specific room for targeted events (e.g. wallet updates)
    socket.join(`user:${socket.data.userId}`);

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
