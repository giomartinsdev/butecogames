import type { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@butecogames/shared";
import type { AuthenticatedSocket } from "./middleware.js";
import {
  placeSportsBet,
  getEventsWithOdds,
} from "../services/event-betting.js";

export function setupSportsBettingHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
) {
  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;

    // Join sports betting room
    socket.on("sports:join", async () => {
      await socket.join("sports-betting");

      try {
        // Send current events with odds
        const events = await getEventsWithOdds();
        socket.emit("sports:events_update", { events: events as any });
      } catch (error: any) {
        socket.emit("sports:error", {
          message: error.message || "Erro ao carregar eventos",
        });
      }
    });

    // Leave sports betting room
    socket.on("sports:leave", () => {
      socket.leave("sports-betting");
    });

    // Place a bet
    socket.on("sports:place_bet", async ({ eventId, option, amount }) => {
      if (!authSocket.data.userId) {
        socket.emit("sports:error", { message: "Não autenticado" });
        return;
      }

      try {
        await placeSportsBet(authSocket.data.userId, eventId, option, amount);

        // Broadcast to all users in the room (odds update is sent from service)
        io.to("sports-betting").emit("sports:bet_placed", {
          eventId,
          option,
          amount,
        });
      } catch (error: any) {
        socket.emit("sports:error", {
          message: error.message || "Erro ao fazer aposta",
        });
      }
    });
  });
}
