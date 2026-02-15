import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  EventBettingEvent,
  EventOdds,
  BetOption,
} from "@butecogames/shared";
import { useSocket } from "./useSocket.js";
import { toast } from "sonner";

export function useEventBetting() {
  const { socket } = useSocket();
  const [events, setEvents] = useState<
    Array<EventBettingEvent & { odds: EventOdds }>
  >([]);
  const queryClient = useQueryClient();
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!socket) return;

    socket.emit("event:join");

    socket.on("event:events_update", (data) => {
      setEvents(data.events as any);
    });

    socket.on("event:odds_update", ({ eventId, odds }) => {
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, odds } : e))
      );
      // Invalidate wallet and my bets as odds update means a bet was placed
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["event-betting-my-bets"] });
    });

    socket.on("event:bet_placed", ({ eventId }) => {
      // Invalidate my bets to show the newly placed bet
      queryClient.invalidateQueries({ queryKey: ["event-betting-my-bets"] });
      console.log(`[Event] Bet placed on event ${eventId}`);
    });

    socket.on("event:event_result", ({ eventId, result, winners }) => {
      // Show event result with resolved label
      const ev = eventsRef.current.find((e) => e._id === eventId);
      const resultLabel =
        result === "option1"
          ? ev?.option1 ?? "Opção 1"
          : result === "option2"
          ? ev?.option2 ?? "Opção 2"
          : "Empate";
      const eventName = ev?.title ?? "Evento";
      toast.info(`${eventName} encerrado`, {
        description: `Vencedor: ${resultLabel}${winners.length > 0 ? ` — ${winners.length} vencedor(es)` : ""}`,
      });

      // Update event in state
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId
            ? { ...e, status: "completed" as const, result }
            : e
        )
      );

      // Invalidate wallet and my bets to refresh balance and bet status
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["event-betting-my-bets"] });
    });

    socket.on("event:error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.emit("event:leave");
      socket.off("event:events_update");
      socket.off("event:odds_update");
      socket.off("event:bet_placed");
      socket.off("event:event_result");
      socket.off("event:error");
    };
  }, [socket, queryClient]);

  const placeBet = (eventId: string, option: BetOption, amount: number) => {
    if (!socket) {
      toast.error("Conexão não estabelecida");
      return;
    }
    socket.emit("event:place_bet", { eventId, option, amount });

    // Optimistically invalidate my bets query to refetch after bet is placed
    queryClient.invalidateQueries({ queryKey: ["event-betting-my-bets"] });
  };

  return { events, placeBet };
}
