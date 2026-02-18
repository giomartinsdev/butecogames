import { useEffect } from "react";
import type { PresenceStatus } from "@butecogames/shared";
import { useSocketStore } from "@/stores/socketStore.js";
import { useOnlineUsersStore } from "@/stores/onlineUsersStore.js";

export function useOnlineUsers() {
  const socket = useSocketStore((s) => s.socket);
  const { users, setUsers, addUser, removeUser, updateUser } = useOnlineUsersStore();

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (data: { users: typeof users }) => {
      setUsers(data.users);
    };

    const handleUserJoined = (data: { user: (typeof users)[number] }) => {
      addUser(data.user);
    };

    const handleUserLeft = (data: { userId: string }) => {
      removeUser(data.userId);
    };

    const handleUserUpdated = (data: {
      userId: string;
      status?: PresenceStatus;
      currentPage?: string | null;
    }) => {
      updateUser(data.userId, data);
    };

    socket.on("presence:online_users", handleOnlineUsers);
    socket.on("presence:user_joined", handleUserJoined);
    socket.on("presence:user_left", handleUserLeft);
    socket.on("presence:user_updated", handleUserUpdated);

    return () => {
      socket.off("presence:online_users", handleOnlineUsers);
      socket.off("presence:user_joined", handleUserJoined);
      socket.off("presence:user_left", handleUserLeft);
      socket.off("presence:user_updated", handleUserUpdated);
    };
  }, [socket, setUsers, addUser, removeUser, updateUser]);

  return { users, onlineCount: users.length };
}
