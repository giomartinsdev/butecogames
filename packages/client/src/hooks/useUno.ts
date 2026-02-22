import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../stores/socketStore.js";
import { useUnoStore } from "../stores/unoStore.js";
import { useSoundStore } from "../stores/soundStore.js";
import { toast } from "sonner";
import type { UnoCardColor } from "@butecogames/shared";

export function useUno(userId?: string) {
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();
  const {
    lobbyRooms,
    setLobbyRooms,
    gameState,
    setGameState,
    isInLobby,
    setIsInLobby,
    colorPickerOpen,
    setColorPickerOpen,
    pendingCardId,
    setPendingCardId,
    reset,
  } = useUnoStore();
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!socket) return;

    // Join lobby on mount
    socket.emit("uno:join_lobby");
    setIsInLobby(true);

    // Lobby events
    socket.on("uno:lobby_state", ({ rooms }) => {
      setLobbyRooms(rooms);
    });
    socket.on("uno:lobby_update", ({ rooms }) => {
      setLobbyRooms(rooms);
    });

    // Room events
    socket.on("uno:room_joined", ({ gameState: state }) => {
      setGameState(state);
      setIsInLobby(false);
    });
    socket.on("uno:game_state", ({ gameState: state }) => {
      setGameState(state);
    });
    socket.on("uno:player_joined", ({ player }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: [...current.players, player],
        });
      }
    });
    socket.on("uno:player_left", ({ userId: leftUserId }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: current.players.filter((p) => p.userId !== leftUserId),
        });
      }
    });
    socket.on("uno:player_ready", ({ userId: readyUserId }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: current.players.map((p) =>
            p.userId === readyUserId ? { ...p, isReady: !p.isReady } : p,
          ),
        });
      }
    });

    // Game events
    socket.on("uno:game_started", ({ gameState: state }) => {
      setGameState(state);
    });

    socket.on(
      "uno:card_played",
      ({ userId: playerId, card, chosenColor, newCurrentPlayer, direction, cardCount }) => {
        const current = useUnoStore.getState().gameState;
        if (current) {
          setGameState({
            ...current,
            discardTop: card,
            currentColor: chosenColor ?? (card.color !== "wild" ? card.color as UnoCardColor : current.currentColor),
            currentPlayerIndex: newCurrentPlayer,
            direction,
            players: current.players.map((p) =>
              p.userId === playerId ? { ...p, cardCount } : p,
            ),
          });
        }
      },
    );

    socket.on("uno:card_drawn", ({ userId: drawerId, cardCount, card }) => {
      const current = useUnoStore.getState().gameState;
      if (!current) return;

      const uid = userIdRef.current;
      const updatedPlayers = current.players.map((p) =>
        p.userId === drawerId ? { ...p, cardCount, saidUno: false } : p,
      );

      if (drawerId === uid && card) {
        // Add drawn card to our hand
        setGameState({
          ...current,
          players: updatedPlayers,
          hand: [...current.hand, card],
        });
      } else {
        setGameState({
          ...current,
          players: updatedPlayers,
        });
      }
    });

    socket.on("uno:turn_changed", ({ currentPlayerIndex, timeRemaining, drawStack }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          currentPlayerIndex,
          turnTimeRemaining: timeRemaining,
          drawStack: drawStack ?? 0,
        });
      }
    });

    // UNO events
    socket.on("uno:uno_said", ({ userId: saidUserId }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: current.players.map((p) =>
            p.userId === saidUserId ? { ...p, saidUno: true } : p,
          ),
        });
      }
      const player = current?.players.find((p) => p.userId === saidUserId);
      if (player) {
        toast.info(`${player.displayName} disse UNO!`);
      }
    });

    socket.on("uno:uno_penalty", ({ userId: penaltyUserId, penaltyCards }) => {
      const current = useUnoStore.getState().gameState;
      const player = current?.players.find((p) => p.userId === penaltyUserId);
      const uid = userIdRef.current;
      if (penaltyUserId === uid) {
        toast.error(`Você esqueceu de dizer UNO! +${penaltyCards} carta(s) de penalidade`);
      } else if (player) {
        toast.info(`${player.displayName} esqueceu de dizer UNO! +${penaltyCards} carta(s)`);
      }
    });

    // Game end
    socket.on("uno:round_ended", ({ winnerId, winnerName, payout }) => {
      const uid = userIdRef.current;
      // Update status to finished and clear timer to stop client-side countdown
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          status: "finished",
          turnTimeRemaining: 0,
          winner: winnerId,
        });
      }
      if (winnerId === uid) {
        useSoundStore.getState().playSound("bet_win");
        toast.success(`Você venceu! +${payout} coins`);
      } else {
        useSoundStore.getState().playSound("bet_lost");
        toast.error(`${winnerName} venceu o jogo!`);
      }
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["uno-recent"] });
    });

    // Disconnect events
    socket.on("uno:player_disconnected", ({ userId: dcUserId, countdown }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: current.players.map((p) =>
            p.userId === dcUserId ? { ...p, connected: false } : p,
          ),
        });
      }
      const player = current?.players.find((p) => p.userId === dcUserId);
      toast.info(
        `${player?.displayName ?? "Jogador"} desconectou (${countdown}s para reconectar)`,
      );
    });

    socket.on("uno:player_reconnected", ({ userId: rcUserId }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: current.players.map((p) =>
            p.userId === rcUserId ? { ...p, connected: true } : p,
          ),
        });
      }
      toast.success("Jogador reconectou!");
    });

    socket.on("uno:spectator_count", ({ count }) => {
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({ ...current, spectatorCount: count });
      }
    });

    // Room closed — return to lobby
    socket.on("uno:room_closed", ({ reason }) => {
      setGameState(null);
      setIsInLobby(true);
      setColorPickerOpen(false);
      setPendingCardId(null);
      socket.emit("uno:join_lobby");
      toast.info(reason);
    });

    // Error
    socket.on("uno:error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      const currentState = useUnoStore.getState();
      if (currentState.gameState) {
        socket.emit("uno:leave_room");
      } else {
        socket.emit("uno:leave_lobby");
      }
      socket.off("uno:lobby_state");
      socket.off("uno:lobby_update");
      socket.off("uno:room_joined");
      socket.off("uno:game_state");
      socket.off("uno:player_joined");
      socket.off("uno:player_left");
      socket.off("uno:player_ready");
      socket.off("uno:game_started");
      socket.off("uno:card_played");
      socket.off("uno:card_drawn");
      socket.off("uno:turn_changed");
      socket.off("uno:uno_said");
      socket.off("uno:uno_penalty");
      socket.off("uno:round_ended");
      socket.off("uno:player_disconnected");
      socket.off("uno:player_reconnected");
      socket.off("uno:spectator_count");
      socket.off("uno:room_closed");
      socket.off("uno:error");
      reset();
    };
  }, [socket]);

  // Client-side turn timer countdown
  useEffect(() => {
    const state = useUnoStore.getState().gameState;
    if (!state || state.status !== "playing" || state.turnTimeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const current = useUnoStore.getState().gameState;
      if (!current || current.status !== "playing") {
        clearInterval(interval);
        return;
      }
      if (current.turnTimeRemaining > 0) {
        setGameState({
          ...current,
          turnTimeRemaining: current.turnTimeRemaining - 1,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.currentPlayerIndex, gameState?.status]);

  // Actions
  const createRoom = useCallback(
    (betAmount: number, maxPlayers: number) => {
      socket?.emit("uno:create_room", { betAmount, maxPlayers });
    },
    [socket],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      socket?.emit("uno:join_room", { roomId });
    },
    [socket],
  );

  const leaveRoom = useCallback(() => {
    socket?.emit("uno:leave_room");
  }, [socket]);

  const setReady = useCallback(() => {
    socket?.emit("uno:player_ready");
  }, [socket]);

  const startGameAction = useCallback(() => {
    socket?.emit("uno:start_game");
  }, [socket]);

  const playCard = useCallback(
    (cardId: string, chosenColor?: UnoCardColor) => {
      socket?.emit("uno:play_card", { cardId, chosenColor });
      // Optimistically remove from hand
      const current = useUnoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          hand: current.hand.filter((c) => c.id !== cardId),
        });
      }
    },
    [socket],
  );

  const drawCardAction = useCallback(() => {
    socket?.emit("uno:draw_card");
  }, [socket]);

  const sayUnoAction = useCallback(() => {
    socket?.emit("uno:say_uno");
  }, [socket]);

  const catchUnoAction = useCallback(
    (targetUserId: string) => {
      socket?.emit("uno:catch_uno", { targetUserId });
    },
    [socket],
  );

  const spectate = useCallback(
    (roomId: string) => {
      socket?.emit("uno:spectate", { roomId });
      setIsInLobby(false);
    },
    [socket],
  );

  const stopSpectating = useCallback(() => {
    socket?.emit("uno:stop_spectating");
    setIsInLobby(true);
  }, [socket]);

  return {
    lobbyRooms,
    gameState,
    isInLobby,
    colorPickerOpen,
    setColorPickerOpen,
    pendingCardId,
    setPendingCardId,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame: startGameAction,
    playCard,
    drawCard: drawCardAction,
    sayUno: sayUnoAction,
    catchUno: catchUnoAction,
    spectate,
    stopSpectating,
  };
}
