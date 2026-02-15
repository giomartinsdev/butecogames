import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  SportsBettingEvent,
  EventOdds,
  BetOption,
} from "@butecogames/shared";
import { useSocket } from "./useSocket.js";
import { toast } from "sonner";

export function useEventBetting() {
  const { socket } = useSocket();
  const [events, setEvents] = useState<
    Array<SportsBettingEvent & { odds: EventOdds }>
  >([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    socket.emit("sports:join");

    socket.on("sports:events_update", (data) => {
      setEvents(data.events as any);
    });

    socket.on("sports:odds_update", ({ eventId, odds }) => {
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, odds } : e))
      );
      // Invalidate wallet as odds update means a bet was placed
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    });

    socket.on("sports:bet_placed", ({ eventId }) => {
      // Just log for now, odds update comes separately
      console.log(`[Sports] Bet placed on event ${eventId}`);
    });

    socket.on("sports:event_result", ({ eventId, result, winners }) => {
      // Show event result
      toast.info(`Evento resolvido: ${result}`, {
        description: winners.length > 0 ? `${winners.length} vencedor(es)` : undefined,
      });

      // Update event in state
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId
            ? { ...e, status: "completed" as const, result }
            : e
        )
      );

      // Invalidate wallet to refresh balance
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    });

    socket.on("sports:error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.emit("sports:leave");
      socket.off("sports:events_update");
      socket.off("sports:odds_update");
      socket.off("sports:bet_placed");
      socket.off("sports:event_result");
      socket.off("sports:error");
    };
  }, [socket, queryClient]);

  const placeBet = (eventId: string, option: BetOption, amount: number) => {
    if (!socket) {
      toast.error("Conexão não estabelecida");
      return;
    }
    socket.emit("sports:place_bet", { eventId, option, amount });

    // Optimistically invalidate my bets query to refetch after bet is placed
    queryClient.invalidateQueries({ queryKey: ["sports-betting-my-bets"] });
  };

  return { events, placeBet };
}
