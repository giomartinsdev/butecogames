import { create } from "zustand";
import type { CardDuelRoomInfo, CardDuelRoomState } from "@butecogames/shared";

interface CardDuelState {
  lobbyRooms: CardDuelRoomInfo[];
  setLobbyRooms: (rooms: CardDuelRoomInfo[]) => void;
  roomState: CardDuelRoomState | null;
  setRoomState: (state: CardDuelRoomState | null) => void;
  isInLobby: boolean;
  setIsInLobby: (v: boolean) => void;
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;
  cardRevealCountdown: number;
  setCardRevealCountdown: (v: number) => void;
  reset: () => void;
}

export const useCardDuelStore = create<CardDuelState>((set) => ({
  lobbyRooms: [],
  setLobbyRooms: (rooms) => set({ lobbyRooms: rooms }),
  roomState: null,
  setRoomState: (state) => set({ roomState: state }),
  isInLobby: true,
  setIsInLobby: (v) => set({ isInLobby: v }),
  isSearching: false,
  setIsSearching: (v) => set({ isSearching: v }),
  cardRevealCountdown: 0,
  setCardRevealCountdown: (v) => set({ cardRevealCountdown: v }),
  reset: () =>
    set({
      lobbyRooms: [],
      roomState: null,
      isInLobby: true,
      isSearching: false,
      cardRevealCountdown: 0,
    }),
}));
