import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, RouletteBetType } from "@butecogames/shared";
import type { AuthenticatedSocket } from "./middleware.js";
import { placeBet, getRouletteState } from "../services/roulette.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerRouletteHandlers(io: TypedIO, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;

  socket.on("roulette:join", () => {
    socket.join("roulette");
    socket.emit("roulette:state", getRouletteState());
  });

  socket.on("roulette:leave", () => {
    socket.leave("roulette");
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
