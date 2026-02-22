import { create } from "zustand";
import type { UnecoRoomInfo, UnecoGameState } from "@butecogames/shared";

interface UnecoState {
  lobbyRooms: UnecoRoomInfo[];
  setLobbyRooms: (rooms: UnecoRoomInfo[]) => void;
  gameState: UnecoGameState | null;
  setGameState: (state: UnecoGameState | null) => void;
  isInLobby: boolean;
  setIsInLobby: (v: boolean) => void;
  colorPickerOpen: boolean;
  setColorPickerOpen: (v: boolean) => void;
  pendingCardId: string | null;
  setPendingCardId: (id: string | null) => void;
  reset: () => void;
}

export const useUnecoStore = create<UnecoState>((set) => ({
  lobbyRooms: [],
  setLobbyRooms: (rooms) => set({ lobbyRooms: rooms }),
  gameState: null,
  setGameState: (state) => set({ gameState: state }),
  isInLobby: true,
  setIsInLobby: (v) => set({ isInLobby: v }),
  colorPickerOpen: false,
  setColorPickerOpen: (v) => set({ colorPickerOpen: v }),
  pendingCardId: null,
  setPendingCardId: (id) => set({ pendingCardId: id }),
  reset: () =>
    set({
      lobbyRooms: [],
      gameState: null,
      isInLobby: true,
      colorPickerOpen: false,
      pendingCardId: null,
    }),
}));
