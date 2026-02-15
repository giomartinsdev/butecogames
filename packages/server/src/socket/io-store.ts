import type { Server } from "socket.io";

let io: Server | null = null;

export function setIO(instance: Server) {
  io = instance;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function disconnectUser(userId: string) {
  if (!io) return;
  for (const [, socket] of io.sockets.sockets) {
    if (socket.data.userId === userId) {
      socket.disconnect(true);
    }
  }
}
