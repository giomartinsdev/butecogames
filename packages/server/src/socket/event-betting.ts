import type { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@butecogames/shared";
import type { AuthenticatedSocket } from "./middleware.js";
import {
  placeEventBet,
  getEventsWithOdds,
} from "../services/event-betting.js";

export function setupEventBettingHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
) {
  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;

    // Join event betting room
    socket.on("event:join", async () => {
      await socket.join("event-betting");

      try {
        // Send current events with odds
        const events = await getEventsWithOdds();
        socket.emit("event:events_update", { events: events as any });
      } catch (error: any) {
        socket.emit("event:error", {
          message: error.message || "Erro ao carregar eventos",
        });
      }
    });

    // Leave event betting room
    socket.on("event:leave", () => {
      socket.leave("event-betting");
    });

    // Place a bet
    socket.on("event:place_bet", async ({ eventId, option, amount }) => {
      if (!authSocket.data.userId) {
        socket.emit("event:error", { message: "Não autenticado" });
        return;
      }

      try {
        await placeEventBet(authSocket.data.userId, eventId, option, amount);

        // Broadcast to all users in the room (odds update is sent from service)
        io.to("event-betting").emit("event:bet_placed", {
          eventId,
          option,
          amount,
        });
      } catch (error: any) {
        socket.emit("event:error", {
          message: error.message || "Erro ao fazer aposta",
        });
      }
    });
  });
}
