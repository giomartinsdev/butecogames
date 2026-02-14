import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@butecogames/shared";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketState {
  socket: TypedSocket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: () => {
    if (get().socket) return;

    const socket: TypedSocket = io(import.meta.env.VITE_WS_URL || window.location.origin, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      set({ connected: true });
      console.log("[Socket] Connected");
    });

    socket.on("disconnect", () => {
      set({ connected: false });
      console.log("[Socket] Disconnected");
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
}));
