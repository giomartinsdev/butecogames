import { create } from "zustand";
import type { UnoRoomInfo, UnoGameState } from "@butecogames/shared";

interface UnoState {
  lobbyRooms: UnoRoomInfo[];
  setLobbyRooms: (rooms: UnoRoomInfo[]) => void;
  gameState: UnoGameState | null;
  setGameState: (state: UnoGameState | null) => void;
  isInLobby: boolean;
  setIsInLobby: (v: boolean) => void;
  colorPickerOpen: boolean;
  setColorPickerOpen: (v: boolean) => void;
  pendingCardId: string | null;
  setPendingCardId: (id: string | null) => void;
  reset: () => void;
}

export const useUnoStore = create<UnoState>((set) => ({
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
