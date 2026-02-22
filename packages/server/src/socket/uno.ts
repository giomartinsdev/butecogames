import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@butecogames/shared";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  setPlayerReady,
  startGame,
  playCard,
  drawCard,
  sayUno,
  catchUno,
  handleDisconnect,
  handleReconnect,
  getLobbyRooms,
  getPlayerRoom,
  getGameStateForPlayer,
  spectateRoom,
  stopSpectating,
} from "../services/uno.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerUnoHandlers(io: TypedIO, socket: Socket) {
  const { userId, displayName, image } = socket.data;

  socket.on("uno:join_lobby", async () => {
    // Check if user is already in a room (page refresh / reconnect)
    const existingRoomId = getPlayerRoom(userId);
    if (existingRoomId) {
      try {
        await handleReconnect(userId, socket.id, existingRoomId);
        socket.join(`uno:room:${existingRoomId}`);
        const state = getGameStateForPlayer(existingRoomId, userId);
        socket.emit("uno:room_joined", { gameState: state });
        return;
      } catch {
        // Room no longer valid, fall through to lobby
      }
    }
    socket.join("uno:lobby");
    const rooms = getLobbyRooms();
    socket.emit("uno:lobby_state", { rooms });
  });

  socket.on("uno:leave_lobby", () => {
    socket.leave("uno:lobby");
  });

  socket.on("uno:create_room", async ({ betAmount, maxPlayers }) => {
    try {
      const roomId = await createRoom(
        userId,
        displayName,
        image,
        socket.id,
        betAmount,
        maxPlayers,
      );
      socket.join(`uno:room:${roomId}`);
      socket.leave("uno:lobby");
      const state = getGameStateForPlayer(roomId, userId);
      socket.emit("uno:room_joined", { gameState: state });
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro ao criar sala",
      });
    }
  });

  socket.on("uno:join_room", async ({ roomId }) => {
    try {
      await joinRoom(roomId, userId, displayName, image, socket.id);
      socket.join(`uno:room:${roomId}`);
      socket.leave("uno:lobby");
      const state = getGameStateForPlayer(roomId, userId);
      socket.emit("uno:room_joined", { gameState: state });
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro ao entrar na sala",
      });
    }
  });

  socket.on("uno:leave_room", async () => {
    try {
      const roomId = getPlayerRoom(userId);
      if (roomId) {
        await leaveRoom(userId);
        socket.leave(`uno:room:${roomId}`);
        socket.emit("uno:room_closed", { reason: "Você saiu da sala" });
        socket.join("uno:lobby");
      }
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro ao sair da sala",
      });
    }
  });

  socket.on("uno:player_ready", () => {
    try {
      setPlayerReady(userId);
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("uno:start_game", async () => {
    try {
      await startGame(userId);
    } catch (err) {
      socket.emit("uno:error", {
        message:
          err instanceof Error ? err.message : "Erro ao iniciar o jogo",
      });
    }
  });

  socket.on("uno:play_card", async ({ cardId, chosenColor }) => {
    try {
      await playCard(userId, cardId, chosenColor);
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro ao jogar carta",
      });
    }
  });

  socket.on("uno:draw_card", () => {
    try {
      drawCard(userId);
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro ao comprar carta",
      });
    }
  });

  socket.on("uno:say_uno", () => {
    try {
      sayUno(userId);
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("uno:catch_uno", ({ targetUserId }) => {
    try {
      catchUno(userId, targetUserId);
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("uno:spectate", ({ roomId }) => {
    try {
      spectateRoom(userId, socket.id, roomId);
      socket.join(`uno:spectate:${roomId}`);
      socket.leave("uno:lobby");
      const state = getGameStateForPlayer(roomId, "__spectator__");
      socket.emit("uno:game_state", { gameState: state });
    } catch (err) {
      socket.emit("uno:error", {
        message: err instanceof Error ? err.message : "Erro ao assistir",
      });
    }
  });

  socket.on("uno:stop_spectating", () => {
    stopSpectating(userId);
    socket.join("uno:lobby");
  });

  socket.on("disconnect", () => {
    const roomId = getPlayerRoom(userId);
    if (roomId) {
      handleDisconnect(userId, socket.id);
    }
    stopSpectating(userId);
  });
}
