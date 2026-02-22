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
  sayUneco,
  catchUneco,
  handleDisconnect,
  handleReconnect,
  getLobbyRooms,
  getPlayerRoom,
  getGameStateForPlayer,
  spectateRoom,
  stopSpectating,
} from "../services/uneco.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerUnecoHandlers(io: TypedIO, socket: Socket) {
  const { userId, displayName, image } = socket.data;

  socket.on("uneco:join_lobby", async () => {
    // Check if user is already in a room (page refresh / reconnect)
    const existingRoomId = getPlayerRoom(userId);
    if (existingRoomId) {
      try {
        await handleReconnect(userId, socket.id, existingRoomId);
        socket.join(`uneco:room:${existingRoomId}`);
        const state = getGameStateForPlayer(existingRoomId, userId);
        socket.emit("uneco:room_joined", { gameState: state });
        return;
      } catch {
        // Room no longer valid, fall through to lobby
      }
    }
    socket.join("uneco:lobby");
    const rooms = getLobbyRooms();
    socket.emit("uneco:lobby_state", { rooms });
  });

  socket.on("uneco:leave_lobby", () => {
    socket.leave("uneco:lobby");
  });

  socket.on("uneco:create_room", async ({ betAmount, maxPlayers }) => {
    try {
      const roomId = await createRoom(
        userId,
        displayName,
        image,
        socket.id,
        betAmount,
        maxPlayers,
      );
      socket.join(`uneco:room:${roomId}`);
      socket.leave("uneco:lobby");
      const state = getGameStateForPlayer(roomId, userId);
      socket.emit("uneco:room_joined", { gameState: state });
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro ao criar sala",
      });
    }
  });

  socket.on("uneco:join_room", async ({ roomId }) => {
    try {
      await joinRoom(roomId, userId, displayName, image, socket.id);
      socket.join(`uneco:room:${roomId}`);
      socket.leave("uneco:lobby");
      const state = getGameStateForPlayer(roomId, userId);
      socket.emit("uneco:room_joined", { gameState: state });
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro ao entrar na sala",
      });
    }
  });

  socket.on("uneco:leave_room", async () => {
    try {
      const roomId = getPlayerRoom(userId);
      if (roomId) {
        await leaveRoom(userId);
        socket.leave(`uneco:room:${roomId}`);
        socket.emit("uneco:room_closed", { reason: "Você saiu da sala" });
        socket.join("uneco:lobby");
      }
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro ao sair da sala",
      });
    }
  });

  socket.on("uneco:player_ready", () => {
    try {
      setPlayerReady(userId);
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("uneco:start_game", async () => {
    try {
      await startGame(userId);
    } catch (err) {
      socket.emit("uneco:error", {
        message:
          err instanceof Error ? err.message : "Erro ao iniciar o jogo",
      });
    }
  });

  socket.on("uneco:play_card", async ({ cardId, chosenColor }) => {
    try {
      await playCard(userId, cardId, chosenColor);
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro ao jogar carta",
      });
    }
  });

  socket.on("uneco:draw_card", () => {
    try {
      drawCard(userId);
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro ao comprar carta",
      });
    }
  });

  socket.on("uneco:say_uneco", () => {
    try {
      sayUneco(userId);
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("uneco:catch_uneco", ({ targetUserId }) => {
    try {
      catchUneco(userId, targetUserId);
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("uneco:spectate", ({ roomId }) => {
    try {
      spectateRoom(userId, socket.id, roomId);
      socket.join(`uneco:spectate:${roomId}`);
      socket.leave("uneco:lobby");
      const state = getGameStateForPlayer(roomId, "__spectator__");
      socket.emit("uneco:game_state", { gameState: state });
    } catch (err) {
      socket.emit("uneco:error", {
        message: err instanceof Error ? err.message : "Erro ao assistir",
      });
    }
  });

  socket.on("uneco:stop_spectating", () => {
    stopSpectating(userId);
    socket.join("uneco:lobby");
  });

  socket.on("disconnect", () => {
    const roomId = getPlayerRoom(userId);
    if (roomId) {
      handleDisconnect(userId, socket.id);
    }
    stopSpectating(userId);
  });
}
