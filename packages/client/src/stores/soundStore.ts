import { create } from "zustand";

type SoundName = "bet_placed" | "bet_win" | "bet_lost" | "system_alert" | "direita_autoritaria" | "esquerda_autoritaria" | "centro" | "uneco_sua_vez_1" | "uneco_sua_vez_2" | "uneco_sua_vez_3";

interface SoundState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  playSound: (name: SoundName) => void;
}

const MP3_SOUNDS: Set<SoundName> = new Set(["uneco_sua_vez_1", "uneco_sua_vez_2", "uneco_sua_vez_3"]);

const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(name: SoundName): HTMLAudioElement {
  const cached = audioCache.get(name);
  if (cached) return cached;
  const ext = MP3_SOUNDS.has(name) ? "mp3" : "wav";
  const audio = new Audio(`/sounds/${name}.${ext}`);
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
