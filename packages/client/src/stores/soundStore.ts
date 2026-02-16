import { create } from "zustand";

type SoundName = "bet_placed" | "bet_win" | "bet_lost";

interface SoundState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  playSound: (name: SoundName) => void;
}

const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(name: SoundName): HTMLAudioElement {
  const cached = audioCache.get(name);
  if (cached) return cached;
  const audio = new Audio(`/sounds/${name}.wav`);
  audioCache.set(name, audio);
  return audio;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  enabled: true,

  setEnabled: (enabled: boolean) => {
    set({ enabled });
  },

  playSound: (name: SoundName) => {
    if (!get().enabled) return;
    const audio = getAudio(name);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  },
}));
