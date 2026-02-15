import type { GameInfo } from "../types/game.js";

export const GAMES: GameInfo[] = [
  {
    id: "roulette",
    name: "Roleta",
    description:
      "Aposte em cores, números ou combinações na roleta europeia. Todos jogam na mesma sala!",
    minPlayers: 1,
    maxPlayers: 100,
    available: true,
    requiresRoom: false,
    thumbnail: "/images/roulette.png",
  },
  {
    id: "event-betting",
    name: "Eventos",
    description:
      "Aposte em eventos esportivos, eSports e muito mais com odds dinâmicas!",
    minPlayers: 1,
    maxPlayers: 100,
    available: true,
    requiresRoom: false,
    thumbnail: "/images/event-betting.png",
  },
];

export const INITIAL_BALANCE = 1000;
export const DAILY_REWARD_AMOUNT = 100;
export const DAILY_REWARD_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
