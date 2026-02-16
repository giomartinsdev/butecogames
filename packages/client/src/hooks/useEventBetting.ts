import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  EventBettingEvent,
  EventOdds,
  BetOption,
} from "@butecogames/shared";
import { useSocket } from "./useSocket.js";
import { useSoundStore } from "@/stores/soundStore.js";
import { toast } from "sonner";

export function useEventBetting(userId?: string) {
  const { socket } = useSocket();
  const [events, setEvents] = useState<
    Array<EventBettingEvent & { odds: EventOdds }>
  >([]);
  const queryClient = useQueryClient();
  const eventsRef = useRef(events);
  eventsRef.current = events;

  // Track events the current user has bet on this session
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const userBetEventsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!socket) return;

    socket.emit("event:join");

    // Re-join room on reconnection (socket ref stays the same, effect won't re-run)
    const onReconnect = () => {
      socket.emit("event:join");
    };
    socket.on("connect", onReconnect);

    socket.on("event:events_update", (data) => {
      setEvents(data.events as any);
    });

    socket.on("event:odds_update", ({ eventId, odds, totalPool, option1Pool, option2Pool, drawPool }) => {
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId
            ? { ...e, odds, totalPool, option1Pool, option2Pool, drawPool }
            : e
        )
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

      // Play win/loss sound if the user bet on this event
      const uid = userIdRef.current;
      if (uid && userBetEventsRef.current.has(eventId)) {
        const won = winners.some((w) => w.userId === uid);
        useSoundStore.getState().playSound(won ? "bet_win" : "bet_lost");
        userBetEventsRef.current.delete(eventId);
      }

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
      socket.off("connect", onReconnect);
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
    useSoundStore.getState().playSound("bet_placed");
    userBetEventsRef.current.add(eventId);

    // Optimistically invalidate my bets query to refetch after bet is placed
    queryClient.invalidateQueries({ queryKey: ["event-betting-my-bets"] });
  };

  return { events, placeBet };
}
