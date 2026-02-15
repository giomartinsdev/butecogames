import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, RouletteBetType } from "@butecogames/shared";
import type { AuthenticatedSocket } from "./middleware.js";
import {
  placeBet,
  getRouletteState,
  startRouletteEngine,
  requestRouletteStop,
  cancelRouletteStop,
  isRouletteRunning,
} from "../services/roulette.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

async function getRoomSize(io: TypedIO): Promise<number> {
  const room = io.sockets.adapter.rooms.get("roulette");
  return room?.size ?? 0;
}

export function registerRouletteHandlers(io: TypedIO, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  socket.on("roulette:join", async () => {
    socket.join("roulette");

    if (!isRouletteRunning()) {
      await startRouletteEngine();
    } else {
      cancelRouletteStop();
    }

    socket.emit("roulette:state", getRouletteState());
  });

  socket.on("roulette:leave", async () => {
    socket.leave("roulette");
    const size = await getRoomSize(io);
    if (size === 0) {
      requestRouletteStop();
    }
  });

  socket.on("disconnect", async () => {
    const size = await getRoomSize(io);
    if (size === 0 && isRouletteRunning()) {
      requestRouletteStop();
    }
  });

  socket.on("roulette:place_bet", async ({ betType, amount }) => {
    try {
      await placeBet(
        authSocket.data.userId,
        authSocket.data.displayName,
        betType as RouletteBetType,
        amount,
      );
    } catch (err) {
      socket.emit("roulette:error", {
        message: err instanceof Error ? err.message : "Failed to place bet",
      });
    }
  });
}
