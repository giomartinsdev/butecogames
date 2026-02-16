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
import { userConnected, userDisconnected, getOnlineUsers } from "../services/presence.js";

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
    const { userId, displayName, image } = socket.data;
    console.log(`[Socket] Connected: ${displayName} (${userId})`);

    // Join a user-specific room for targeted events (e.g. wallet updates)
    socket.join(`user:${userId}`);

    // Presence tracking
    const isNewUser = userConnected(userId, displayName, image);
    socket.emit("presence:online_users", { users: getOnlineUsers() });
    if (isNewUser) {
      socket.broadcast.emit("presence:user_joined", {
        user: { userId, displayName, avatar: image },
      });
    }

    registerRouletteHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${displayName}`);
      const isFullyOffline = userDisconnected(userId);
      if (isFullyOffline) {
        io.emit("presence:user_left", { userId });
      }
    });
  });

  // Initialize the roulette game engine
  await initRouletteEngine(io);

  return io;
}
