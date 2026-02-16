import { useState, useEffect, useCallback, useRef } from "react";
import { useSocketStore } from "@/stores/socketStore.js";
import { useSoundStore } from "@/stores/soundStore.js";
import { useQueryClient } from "@tanstack/react-query";
import type {
  RouletteBetType,
  RouletteBetDisplay,
  RouletteWinner,
} from "@butecogames/shared";
import {
  DEFAULT_MIN_BET,
  DEFAULT_MAX_BET,
  DEFAULT_MAX_BETS_PER_ROUND,
} from "@butecogames/shared";

interface RouletteState {
  roundNumber: number;
  status: string;
  timeRemaining: number;
  seedHash: string;
  recentResults: number[];
  currentBets: RouletteBetDisplay[];
  lastResult: { result: number; seed: string; winners: RouletteWinner[] } | null;
  error: string | null;
  minBet: number;
  maxBet: number;
  maxBetsPerRound: number;
}

export function useRoulette(userId?: string) {
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();

  const [state, setState] = useState<RouletteState>({
    roundNumber: 0,
    status: "completed",
    timeRemaining: 0,
    seedHash: "",
    recentResults: [],
    currentBets: [],
    lastResult: null,
    error: null,
    minBet: DEFAULT_MIN_BET,
    maxBet: DEFAULT_MAX_BET,
    maxBetsPerRound: DEFAULT_MAX_BETS_PER_ROUND,
  });

  // Track current user's bets in this round via ref (accessible in socket callbacks)
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const userHasBetsRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (state.status !== "betting" || state.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeRemaining: Math.max(0, prev.timeRemaining - 1),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status, state.timeRemaining]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("roulette:join");

    // Re-join room on reconnection (socket ref stays the same, effect won't re-run)
    const onReconnect = () => {
      socket.emit("roulette:join");
    };
    socket.on("connect", onReconnect);

    socket.on("roulette:state", (data) => {
      const uid = userIdRef.current;
      userHasBetsRef.current = uid
        ? data.currentBets.some((b: RouletteBetDisplay) => b.userId === uid)
        : false;
      setState((prev) => ({
        ...prev,
        roundNumber: data.roundNumber,
        status: data.status,
        timeRemaining: data.timeRemaining,
        seedHash: data.seedHash,
        recentResults: data.recentResults,
        currentBets: data.currentBets,
        minBet: data.minBet,
        maxBet: data.maxBet,
        maxBetsPerRound: data.maxBetsPerRound,
        error: null,
      }));
    });

    socket.on("roulette:betting_open", (data) => {
      userHasBetsRef.current = false;
      setState((prev) => ({
        ...prev,
        roundNumber: data.roundNumber,
        status: "betting",
        timeRemaining: data.timeRemaining,
        seedHash: data.seedHash,
        currentBets: [],
        lastResult: null,
        error: null,
      }));
    });

    socket.on("roulette:bet_placed", (data) => {
      const uid = userIdRef.current;
      if (uid && data.userId === uid) {
        userHasBetsRef.current = true;
      }
      setState((prev) => ({
        ...prev,
        currentBets: [...prev.currentBets, data],
      }));
    });

    socket.on("roulette:betting_closed", () => {
      setState((prev) => ({
        ...prev,
        status: "spinning",
      }));
    });

    socket.on("roulette:result", (data) => {
      const uid = userIdRef.current;
      if (uid && userHasBetsRef.current) {
        const won = data.winners.some((w: RouletteWinner) => w.userId === uid);
        useSoundStore.getState().playSound(won ? "bet_win" : "bet_lost");
      }
      setState((prev) => ({
        ...prev,
        status: "completed",
        lastResult: data,
        recentResults: [data.result, ...prev.recentResults].slice(0, 20),
      }));
      // Refetch wallet after result
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    });

    socket.on("roulette:error", (data) => {
      setState((prev) => ({
        ...prev,
        error: data.message,
      }));
    });

    return () => {
      socket.emit("roulette:leave");
      socket.off("connect", onReconnect);
      socket.off("roulette:state");
      socket.off("roulette:betting_open");
      socket.off("roulette:bet_placed");
      socket.off("roulette:betting_closed");
      socket.off("roulette:result");
      socket.off("roulette:error");
    };
  }, [socket, queryClient]);

  const placeBet = useCallback(
    (betType: RouletteBetType, amount: number) => {
      if (!socket) return;
      setState((prev) => ({ ...prev, error: null }));
      socket.emit("roulette:place_bet", { betType, amount });
      useSoundStore.getState().playSound("bet_placed");
    },
    [socket],
  );

  return { ...state, placeBet };
}
