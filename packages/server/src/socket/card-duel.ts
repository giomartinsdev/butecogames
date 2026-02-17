import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@butecogames/shared";
import {
  createRoom,
  joinRoom,
  quickMatch,
  leaveRoom,
  cancelRoom,
  setPlayerReady,
  startMatch,
  acceptRevenge,
  declineRevenge,
  handleDisconnect,
  handleReconnect,
  getLobbyRooms,
  getPlayerRoom,
  getRoomState,
} from "../services/card-duel.js";

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerCardDuelHandlers(io: TypedIO, socket: Socket) {
  const { userId, displayName, image } = socket.data;

  socket.on("card-duel:join_lobby", () => {
    socket.join("card-duel:lobby");
    const rooms = getLobbyRooms();
    socket.emit("card-duel:lobby_state", { rooms });
  });

  socket.on("card-duel:leave_lobby", () => {
    socket.leave("card-duel:lobby");
  });

  socket.on("card-duel:create_room", async ({ betAmount, gameType }) => {
    try {
      const roomId = await createRoom(
        userId,
        displayName,
        image,
        socket.id,
        betAmount,
        gameType,
      );
      socket.join(`card-duel:room:${roomId}`);
      socket.leave("card-duel:lobby");
      const state = getRoomState(roomId);
      socket.emit("card-duel:room_joined", { roomState: state });
    } catch (err) {
      socket.emit("card-duel:error", {
        message: err instanceof Error ? err.message : "Erro ao criar sala",
      });
    }
  });

  socket.on("card-duel:join_room", async ({ roomId }) => {
    try {
      await joinRoom(roomId, userId, displayName, image, socket.id);
      socket.join(`card-duel:room:${roomId}`);
      socket.leave("card-duel:lobby");
      const state = getRoomState(roomId);
      socket.emit("card-duel:room_joined", { roomState: state });
    } catch (err) {
      socket.emit("card-duel:error", {
        message: err instanceof Error ? err.message : "Erro ao entrar na sala",
      });
    }
  });

  socket.on("card-duel:quick_match", async () => {
    try {
      const result = await quickMatch(userId, displayName, image, socket.id);
      if (!result) {
        socket.emit("card-duel:error", {
          message: "Nenhuma sala disponível no momento",
        });
        return;
      }
      socket.join(`card-duel:room:${result.roomId}`);
      socket.leave("card-duel:lobby");
      const state = getRoomState(result.roomId);
      socket.emit("card-duel:room_joined", { roomState: state });
    } catch (err) {
      socket.emit("card-duel:error", {
        message:
          err instanceof Error ? err.message : "Erro na busca por partida",
      });
    }
  });

  socket.on("card-duel:leave_room", async () => {
    try {
      const roomId = getPlayerRoom(userId);
      if (roomId) {
        await leaveRoom(userId);
        socket.leave(`card-duel:room:${roomId}`);
      }
    } catch (err) {
      socket.emit("card-duel:error", {
        message: err instanceof Error ? err.message : "Erro ao sair da sala",
      });
    }
  });

  socket.on("card-duel:cancel_room", async () => {
    try {
      const roomId = getPlayerRoom(userId);
      await cancelRoom(userId);
      if (roomId) socket.leave(`card-duel:room:${roomId}`);
    } catch (err) {
      socket.emit("card-duel:error", {
        message:
          err instanceof Error ? err.message : "Erro ao cancelar sala",
      });
    }
  });

  socket.on("card-duel:player_ready", async () => {
    try {
      await setPlayerReady(userId);
    } catch (err) {
      socket.emit("card-duel:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("card-duel:start_match", async () => {
    try {
      await startMatch(userId);
    } catch (err) {
      socket.emit("card-duel:error", {
        message:
          err instanceof Error ? err.message : "Erro ao iniciar partida",
      });
    }
  });

  socket.on("card-duel:revenge_accept", async () => {
    try {
      await acceptRevenge(userId);
    } catch (err) {
      socket.emit("card-duel:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("card-duel:revenge_decline", async () => {
    try {
      await declineRevenge(userId);
    } catch (err) {
      socket.emit("card-duel:error", {
        message: err instanceof Error ? err.message : "Erro",
      });
    }
  });

  socket.on("card-duel:reconnect", async ({ roomId }) => {
    try {
      await handleReconnect(userId, socket.id, roomId);
      socket.join(`card-duel:room:${roomId}`);
      const state = getRoomState(roomId);
      socket.emit("card-duel:room_state", { roomState: state });
    } catch (err) {
      socket.emit("card-duel:error", {
        message:
          err instanceof Error ? err.message : "Erro ao reconectar",
      });
    }
  });

  socket.on("disconnect", () => {
    const roomId = getPlayerRoom(userId);
    if (roomId) {
      handleDisconnect(userId, socket.id);
    }
  });
}
