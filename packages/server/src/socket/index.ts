import { Server } from "socket.io";
import type http from "node:http";
import type { ClientToServerEvents, ServerToClientEvents } from "@butecogames/shared";
import { socketAuthMiddleware } from "./middleware.js";
import { registerRouletteHandlers } from "./roulette.js";
import { registerChatHandlers } from "./chat.js";
import { registerCardDuelHandlers } from "./card-duel.js";
import { registerUnecoHandlers } from "./uneco.js";
import { setupEventBettingHandlers } from "./event-betting.js";
import { initRouletteEngine } from "../services/roulette.js";
import { initCardDuelEngine } from "../services/card-duel.js";
import { initUnecoEngine } from "../services/uneco.js";
import { setEventBettingIO } from "../services/event-betting.js";
import { env } from "../config/env.js";
import { setIO } from "./io-store.js";
import { userConnected, userDisconnected, getOnlineUsers, updateUserStatus, updateUserPage } from "../services/presence.js";

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
        user: { userId, displayName, avatar: image, status: "online", currentPage: null },
      });
    }

    // Presence status & page updates
    socket.on("presence:update_status", (data) => {
      const changed = updateUserStatus(userId, data.status);
      if (changed) {
        io.emit("presence:user_updated", { userId, status: data.status });
      }
    });

    socket.on("presence:update_page", (data) => {
      const changed = updateUserPage(userId, data.page);
      if (changed) {
        io.emit("presence:user_updated", { userId, currentPage: data.page });
      }
    });

    registerRouletteHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerCardDuelHandlers(io, socket);
    registerUnecoHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${displayName}`);
      const isFullyOffline = userDisconnected(userId);
      if (isFullyOffline) {
        io.emit("presence:user_left", { userId });
      }
    });
  });

  // Initialize game engines
  await initRouletteEngine(io);
  await initCardDuelEngine(io);
  await initUnecoEngine(io);

  return io;
}
