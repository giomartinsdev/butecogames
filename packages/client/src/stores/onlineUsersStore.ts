import { create } from "zustand";
import type { OnlineUser, PresenceStatus } from "@butecogames/shared";

interface OnlineUsersState {
  users: OnlineUser[];
  setUsers: (users: OnlineUser[]) => void;
  addUser: (user: OnlineUser) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, data: { status?: PresenceStatus; currentPage?: string | null }) => void;
}

export const useOnlineUsersStore = create<OnlineUsersState>((set) => ({
  users: [],

  setUsers: (users) => set({ users }),

  addUser: (user) =>
    set((state) => {
      if (state.users.some((u) => u.userId === user.userId)) return state;
      return { users: [...state.users, user] };
    }),

  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.userId !== userId),
    })),

  updateUser: (userId, data) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.userId === userId ? { ...u, ...data } : u,
      ),
    })),
}));
