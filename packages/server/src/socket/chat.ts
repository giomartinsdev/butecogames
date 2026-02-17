import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@butecogames/shared";
import type { AuthenticatedSocket } from "./middleware.js";
import { processAction } from "../services/gamification.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

const lastMessageTime = new Map<string, number>();
const CHAT_RATE_LIMIT_MS = 2000;

export function registerChatHandlers(io: TypedIO, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  socket.on("chat:message", ({ message }) => {
    if (!message || message.trim().length === 0) return;
    if (message.length > 500) return;

    const now = Date.now();
    const lastTime = lastMessageTime.get(authSocket.data.userId) ?? 0;
    if (now - lastTime < CHAT_RATE_LIMIT_MS) return;

    lastMessageTime.set(authSocket.data.userId, now);

    io.to("roulette").emit("chat:new_message", {
      userId: authSocket.data.userId,
      displayName: authSocket.data.displayName,
      message: message.trim().slice(0, 500),
      timestamp: new Date().toISOString(),
    });

    processAction(authSocket.data.userId, "chat_message");
  });
}
