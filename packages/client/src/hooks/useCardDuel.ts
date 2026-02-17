import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../stores/socketStore.js";
import { useCardDuelStore } from "../stores/cardDuelStore.js";
import { useSoundStore } from "../stores/soundStore.js";
import { toast } from "sonner";
import type { CardDuelGameType } from "@butecogames/shared";

export function useCardDuel(userId?: string) {
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();
  const {
    lobbyRooms,
    setLobbyRooms,
    roomState,
    setRoomState,
    isInLobby,
    setIsInLobby,
    isSearching,
    setIsSearching,
    cardRevealCountdown,
    setCardRevealCountdown,
    reset,
  } = useCardDuelStore();
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const roomStateRef = useRef(roomState);
  roomStateRef.current = roomState;

  useEffect(() => {
    if (!socket) return;

    // Join lobby on mount
    socket.emit("card-duel:join_lobby");
    setIsInLobby(true);

    // Lobby events
    socket.on("card-duel:lobby_state", ({ rooms }) => {
      setLobbyRooms(rooms);
    });
    socket.on("card-duel:lobby_update", ({ rooms }) => {
      setLobbyRooms(rooms);
    });

    // Room events
    socket.on("card-duel:room_joined", ({ roomState: state }) => {
      setRoomState(state);
      setIsInLobby(false);
      setIsSearching(false);
    });
    socket.on("card-duel:room_state", ({ roomState: state }) => {
      setRoomState(state);
    });
    socket.on("card-duel:player_joined", ({ player }) => {
      const current = useCardDuelStore.getState().roomState;
      if (current) {
        setRoomState({ ...current, player2: player });
      }
    });
    socket.on("card-duel:player_left", ({ userId: leftUserId }) => {
      const current = useCardDuelStore.getState().roomState;
      if (current) {
        setRoomState({
          ...current,
          player2: null,
          status: "waiting",
        });
      }
    });
    socket.on("card-duel:player_ready", ({ userId: readyUserId }) => {
      const current = useCardDuelStore.getState().roomState;
      if (current) {
        const updated = { ...current, status: "ready" as const };
        if (updated.player2 && updated.player2.userId === readyUserId) {
          updated.player2 = { ...updated.player2, isReady: true };
        }
        setRoomState(updated);
      }
    });

    // Match events
    socket.on("card-duel:match_start", ({ roomState: state }) => {
      setRoomState(state);
      setCardRevealCountdown(0);
    });
    socket.on("card-duel:card_reveal_countdown", ({ countdown }) => {
      setCardRevealCountdown(countdown);
    });
    socket.on(
      "card-duel:round_result",
      ({ round, player1Score, player2Score }) => {
        const current = useCardDuelStore.getState().roomState;
        if (current) {
          setRoomState({
            ...current,
            rounds: [...current.rounds, round],
            player1Score,
            player2Score,
            currentRound: round.roundNumber,
          });
        }
      },
    );
    socket.on(
      "card-duel:match_result",
      ({ result, winnerId, winnerName, payout }) => {
        const current = useCardDuelStore.getState().roomState;
        if (current) {
          setRoomState({
            ...current,
            status: "finished",
            matchResult: result,
          });
        }
        const uid = userIdRef.current;
        if (uid) {
          if (winnerId === uid) {
            useSoundStore.getState().playSound("bet_win");
            toast.success(`Você venceu! +${payout} coins`);
          } else if (winnerId && winnerId !== uid) {
            useSoundStore.getState().playSound("bet_lost");
            toast.error(`${winnerName} venceu o duelo`);
          } else {
            toast.info("Empate! Apostas devolvidas");
          }
        }
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["card-duel-recent"] });
      },
    );

    // Revenge events
    socket.on("card-duel:revenge_offer", ({ countdown, canAccept }) => {
      const current = useCardDuelStore.getState().roomState;
      if (current) {
        setRoomState({
          ...current,
          status: "revenge_pending",
          revengeCountdown: countdown,
        });
      }
    });
    socket.on("card-duel:revenge_countdown", ({ countdown }) => {
      const current = useCardDuelStore.getState().roomState;
      if (current) {
        setRoomState({
          ...current,
          revengeCountdown: countdown,
        });
      }
    });
    socket.on("card-duel:revenge_accepted", () => {
      toast.info("Revanche aceita! Nova partida iniciando...");
    });

    // Disconnect events
    socket.on(
      "card-duel:player_disconnected",
      ({ userId: dcUserId, countdown }) => {
        const current = useCardDuelStore.getState().roomState;
        if (current) {
          setRoomState({
            ...current,
            disconnectedPlayer: dcUserId,
            disconnectCountdown: countdown,
          });
        }
      },
    );
    socket.on("card-duel:player_reconnected", ({ userId: _rcUserId }) => {
      const current = useCardDuelStore.getState().roomState;
      if (current) {
        setRoomState({
          ...current,
          disconnectedPlayer: null,
          disconnectCountdown: 0,
        });
      }
      toast.success("Jogador reconectou!");
    });
    socket.on(
      "card-duel:forfeit",
      ({ winnerId, winnerName, payout }) => {
        const uid = userIdRef.current;
        if (uid === winnerId) {
          useSoundStore.getState().playSound("bet_win");
          toast.success(
            `Oponente desconectou. Você venceu! +${payout} coins`,
          );
        } else {
          useSoundStore.getState().playSound("bet_lost");
          toast.error("Você perdeu por desconexão");
        }
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["card-duel-recent"] });
      },
    );

    // Room closed — return to lobby
    socket.on("card-duel:room_closed", ({ reason }) => {
      setRoomState(null);
      setIsInLobby(true);
      setIsSearching(false);
      setCardRevealCountdown(0);
      socket.emit("card-duel:join_lobby");
      toast.info(reason);
    });

    // Error
    socket.on("card-duel:error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      const currentState = useCardDuelStore.getState();
      if (currentState.roomState) {
        socket.emit("card-duel:leave_room");
      } else {
        socket.emit("card-duel:leave_lobby");
      }
      socket.off("card-duel:lobby_state");
      socket.off("card-duel:lobby_update");
      socket.off("card-duel:room_joined");
      socket.off("card-duel:room_state");
      socket.off("card-duel:player_joined");
      socket.off("card-duel:player_left");
      socket.off("card-duel:player_ready");
      socket.off("card-duel:match_start");
      socket.off("card-duel:round_result");
      socket.off("card-duel:match_result");
      socket.off("card-duel:revenge_offer");
      socket.off("card-duel:revenge_countdown");
      socket.off("card-duel:revenge_accepted");
      socket.off("card-duel:player_disconnected");
      socket.off("card-duel:player_reconnected");
      socket.off("card-duel:forfeit");
      socket.off("card-duel:room_closed");
      socket.off("card-duel:card_reveal_countdown");
      socket.off("card-duel:error");
      reset();
    };
  }, [socket]);

  // Retry quick match every 5s while searching
  useEffect(() => {
    if (!socket || !isSearching) return;
    const interval = setInterval(() => {
      if (useCardDuelStore.getState().isSearching) {
        socket.emit("card-duel:quick_match");
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [socket, isSearching]);

  // Actions
  const createRoom = useCallback(
    (betAmount: number, gameType: CardDuelGameType) => {
      socket?.emit("card-duel:create_room", { betAmount, gameType });
    },
    [socket],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      socket?.emit("card-duel:join_room", { roomId });
    },
    [socket],
  );

  const quickMatchAction = useCallback(() => {
    setIsSearching(true);
    socket?.emit("card-duel:quick_match");
  }, [socket]);

  const cancelSearch = useCallback(() => {
    setIsSearching(false);
  }, []);

  const playBot = useCallback(
    (gameType: CardDuelGameType) => {
      setIsSearching(false);
      socket?.emit("card-duel:play_bot", { gameType });
    },
    [socket],
  );

  const leaveRoom = useCallback(() => {
    socket?.emit("card-duel:leave_room");
  }, [socket]);

  const cancelRoomAction = useCallback(() => {
    socket?.emit("card-duel:cancel_room");
  }, [socket]);

  const setReady = useCallback(() => {
    socket?.emit("card-duel:player_ready");
  }, [socket]);

  const startMatchAction = useCallback(() => {
    socket?.emit("card-duel:start_match");
  }, [socket]);

  const acceptRevengeAction = useCallback(() => {
    socket?.emit("card-duel:revenge_accept");
  }, [socket]);

  const declineRevengeAction = useCallback(() => {
    socket?.emit("card-duel:revenge_decline");
  }, [socket]);

  return {
    lobbyRooms,
    roomState,
    isInLobby,
    isSearching,
    cardRevealCountdown,
    createRoom,
    joinRoom,
    quickMatch: quickMatchAction,
    cancelSearch,
    playBot,
    leaveRoom,
    cancelRoom: cancelRoomAction,
    setReady,
    startMatch: startMatchAction,
    acceptRevenge: acceptRevengeAction,
    declineRevenge: declineRevengeAction,
  };
}
