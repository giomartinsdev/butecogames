import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../stores/socketStore.js";
import { useUnecoStore } from "../stores/unecoStore.js";
import { useSoundStore } from "../stores/soundStore.js";
import { toast } from "sonner";
import type { UnecoCardColor } from "@butecogames/shared";

export function useUneco(userId?: string) {
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();
  const {
    lobbyRooms,
    setLobbyRooms,
    ongoingRooms,
    setOngoingRooms,
    gameState,
    setGameState,
    isInLobby,
    setIsInLobby,
    colorPickerOpen,
    setColorPickerOpen,
    pendingCardId,
    setPendingCardId,
    reset,
  } = useUnecoStore();
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!socket) return;

    // Join lobby on mount
    socket.emit("uneco:join_lobby");
    setIsInLobby(true);

    // Lobby events
    socket.on("uneco:lobby_state", ({ rooms, ongoingRooms: ongoing }) => {
      setLobbyRooms(rooms);
      setOngoingRooms(ongoing);
    });
    socket.on("uneco:lobby_update", ({ rooms, ongoingRooms: ongoing }) => {
      setLobbyRooms(rooms);
      setOngoingRooms(ongoing);
    });

    // Room events
    socket.on("uneco:room_joined", ({ gameState: state }) => {
      setGameState(state);
      setIsInLobby(false);
    });
    socket.on("uneco:game_state", ({ gameState: state }) => {
      setGameState(state);
    });
    socket.on("uneco:player_joined", ({ player }) => {
      const current = useUnecoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: [...current.players, player],
        });
      }
    });
    socket.on("uneco:player_left", ({ userId: leftUserId }) => {
      const current = useUnecoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: current.players.filter((p) => p.userId !== leftUserId),
        });
      }
    });
    socket.on("uneco:player_ready", ({ userId: readyUserId }) => {
      const current = useUnecoStore.getState().gameState;
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
    socket.on("uneco:game_started", ({ gameState: state }) => {
      setGameState(state);
    });

    socket.on(
      "uneco:card_played",
      ({ userId: playerId, card, chosenColor, newCurrentPlayer, direction, cardCount }) => {
        const current = useUnecoStore.getState().gameState;
        if (current) {
          setGameState({
            ...current,
            discardTop: card,
            currentColor: chosenColor ?? (card.color !== "wild" ? card.color as UnecoCardColor : current.currentColor),
            currentPlayerIndex: newCurrentPlayer,
            direction,
            players: current.players.map((p) =>
              p.userId === playerId ? { ...p, cardCount } : p,
            ),
          });
        }
      },
    );

    socket.on("uneco:card_drawn", ({ userId: drawerId, cardCount, card }) => {
      const current = useUnecoStore.getState().gameState;
      if (!current) return;

      const uid = userIdRef.current;
      const updatedPlayers = current.players.map((p) =>
        p.userId === drawerId ? { ...p, cardCount, saidUneco: false } : p,
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

    socket.on("uneco:turn_changed", ({ currentPlayerIndex, timeRemaining, drawStack }) => {
      const current = useUnecoStore.getState().gameState;
      if (current) {
        const myIndex = current.players.findIndex((p) => p.userId === userIdRef.current);
        // Play random "sua vez" sound when it becomes our turn
        if (currentPlayerIndex === myIndex) {
          const variants = ["uneco_sua_vez_1", "uneco_sua_vez_2", "uneco_sua_vez_3"] as const;
          const pick = variants[Math.floor(Math.random() * variants.length)];
          useSoundStore.getState().playSound(pick);
        } else {
          // Close color picker if turn moved away from us
          setColorPickerOpen(false);
          setPendingCardId(null);
        }
        setGameState({
          ...current,
          currentPlayerIndex,
          turnTimeRemaining: timeRemaining,
          drawStack: drawStack ?? 0,
        });
      }
    });

    // UNECO events
    socket.on("uneco:uneco_said", ({ userId: saidUserId }) => {
      const current = useUnecoStore.getState().gameState;
      if (current) {
        setGameState({
          ...current,
          players: current.players.map((p) =>
            p.userId === saidUserId ? { ...p, saidUneco: true } : p,
          ),
        });
      }
      const player = current?.players.find((p) => p.userId === saidUserId);
      if (player) {
        toast.info(`${player.displayName} disse UNECO!`);
      }
    });

    socket.on("uneco:uneco_penalty", ({ userId: penaltyUserId, penaltyCards }) => {
      const current = useUnecoStore.getState().gameState;
      const player = current?.players.find((p) => p.userId === penaltyUserId);
      const uid = userIdRef.current;
      if (penaltyUserId === uid) {
        toast.error(`Você esqueceu de dizer UNECO! +${penaltyCards} carta(s) de penalidade`);
      } else if (player) {
        toast.info(`${player.displayName} esqueceu de dizer UNECO! +${penaltyCards} carta(s)`);
      }
    });

    // Game end
    socket.on("uneco:round_ended", ({ winnerId, winnerName, payout }) => {
      const uid = userIdRef.current;
      // Update status to finished and clear timer to stop client-side countdown
      const current = useUnecoStore.getState().gameState;
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
      queryClient.invalidateQueries({ queryKey: ["uneco-recent"] });
    });

    // Disconnect events
    socket.on("uneco:player_disconnected", ({ userId: dcUserId, countdown }) => {
      const current = useUnecoStore.getState().gameState;
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

    socket.on("uneco:player_reconnected", ({ userId: rcUserId }) => {
      const current = useUnecoStore.getState().gameState;
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

    socket.on("uneco:spectator_count", ({ count }) => {
      const current = useUnecoStore.getState().gameState;
      if (current) {
        setGameState({ ...current, spectatorCount: count });
      }
    });

    socket.on("uneco:player_forfeited", ({ userId: forfeitUserId, winnerName }) => {
      const current = useUnecoStore.getState().gameState;
      const player = current?.players.find((p) => p.userId === forfeitUserId);
      const name = player?.displayName ?? "Jogador";
      if (winnerName) {
        toast.info(`${name} desistiu da partida! ${winnerName} venceu!`);
      } else {
        toast.info(`${name} desistiu da partida!`);
      }
    });

    // Room closed — return to lobby
    socket.on("uneco:room_closed", ({ reason }) => {
      setGameState(null);
      setIsInLobby(true);
      setColorPickerOpen(false);
      setPendingCardId(null);
      socket.emit("uneco:join_lobby");
      toast.info(reason);
    });

    // Idle warning
    socket.on("uneco:idle_warning", ({ kicked }) => {
      const current = useUnecoStore.getState().gameState;
      const isFree = current?.betAmount === 0;
      if (kicked) {
        if (isFree) {
          toast.error("Você foi removido da partida por inatividade.");
        } else {
          toast.error("Você foi removido da partida por inatividade e perdeu suas coins.");
        }
      } else {
        if (isFree) {
          toast.warning(
            `Atenção! Mais 1 turno inativo e você será removido da partida.`,
          );
        } else {
          toast.warning(
            `Atenção! Mais 1 turno inativo e você será removido da partida e perderá suas coins!`,
          );
        }
      }
    });

    // Error
    socket.on("uneco:error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      const currentState = useUnecoStore.getState();
      if (currentState.gameState) {
        socket.emit("uneco:leave_room");
      } else {
        socket.emit("uneco:leave_lobby");
      }
      socket.off("uneco:lobby_state");
      socket.off("uneco:lobby_update");
      socket.off("uneco:room_joined");
      socket.off("uneco:game_state");
      socket.off("uneco:player_joined");
      socket.off("uneco:player_left");
      socket.off("uneco:player_ready");
      socket.off("uneco:game_started");
      socket.off("uneco:card_played");
      socket.off("uneco:card_drawn");
      socket.off("uneco:turn_changed");
      socket.off("uneco:uneco_said");
      socket.off("uneco:uneco_penalty");
      socket.off("uneco:round_ended");
      socket.off("uneco:player_disconnected");
      socket.off("uneco:player_reconnected");
      socket.off("uneco:spectator_count");
      socket.off("uneco:player_forfeited");
      socket.off("uneco:room_closed");
      socket.off("uneco:idle_warning");
      socket.off("uneco:error");
      reset();
    };
  }, [socket]);

  // Client-side turn timer countdown
  useEffect(() => {
    const state = useUnecoStore.getState().gameState;
    if (!state || state.status !== "playing" || state.turnTimeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const current = useUnecoStore.getState().gameState;
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
      socket?.emit("uneco:create_room", { betAmount, maxPlayers });
    },
    [socket],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      socket?.emit("uneco:join_room", { roomId });
    },
    [socket],
  );

  const leaveRoom = useCallback(() => {
    socket?.emit("uneco:leave_room");
  }, [socket]);

  const setReady = useCallback(() => {
    socket?.emit("uneco:player_ready");
  }, [socket]);

  const startGameAction = useCallback(() => {
    socket?.emit("uneco:start_game");
  }, [socket]);

  const playCard = useCallback(
    (cardId: string, chosenColor?: UnecoCardColor) => {
      socket?.emit("uneco:play_card", { cardId, chosenColor });
      // Optimistically remove from hand
      const current = useUnecoStore.getState().gameState;
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
    socket?.emit("uneco:draw_card");
  }, [socket]);

  const sayUnecoAction = useCallback(() => {
    socket?.emit("uneco:say_uneco");
  }, [socket]);

  const catchUnecoAction = useCallback(
    (targetUserId: string) => {
      socket?.emit("uneco:catch_uneco", { targetUserId });
    },
    [socket],
  );

  const spectate = useCallback(
    (roomId: string) => {
      socket?.emit("uneco:spectate", { roomId });
      setIsInLobby(false);
    },
    [socket],
  );

  const stopSpectating = useCallback(() => {
    socket?.emit("uneco:stop_spectating");
    setIsInLobby(true);
  }, [socket]);

  const forfeitGame = useCallback(() => {
    socket?.emit("uneco:forfeit");
  }, [socket]);

  return {
    lobbyRooms,
    ongoingRooms,
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
    sayUneco: sayUnecoAction,
    catchUneco: catchUnecoAction,
    spectate,
    stopSpectating,
    forfeitGame,
  };
}
