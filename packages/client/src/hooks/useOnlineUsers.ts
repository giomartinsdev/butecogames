import { useEffect } from "react";
import { useSocketStore } from "@/stores/socketStore.js";
import { useOnlineUsersStore } from "@/stores/onlineUsersStore.js";

export function useOnlineUsers() {
  const socket = useSocketStore((s) => s.socket);
  const { users, setUsers, addUser, removeUser } = useOnlineUsersStore();

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

    socket.on("presence:online_users", handleOnlineUsers);
    socket.on("presence:user_joined", handleUserJoined);
    socket.on("presence:user_left", handleUserLeft);

    return () => {
      socket.off("presence:online_users", handleOnlineUsers);
      socket.off("presence:user_joined", handleUserJoined);
      socket.off("presence:user_left", handleUserLeft);
    };
  }, [socket, setUsers, addUser, removeUser]);

  return { users, onlineCount: users.length };
}
