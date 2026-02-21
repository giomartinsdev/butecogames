export const DEFAULT_EVENT_BETTING_HOUSE_EDGE = 0.05; // 5% house edge
export const DEFAULT_EVENT_BETTING_MIN_BET = 10;
export const DEFAULT_EVENT_BETTING_MAX_BET = 10000;
export const DEFAULT_EVENT_BETTING_MAX_BETS_PER_EVENT = 3;

export const EVENT_CATEGORIES = {
  ufc: "UFC",
  sports: "Esportes",
  esports: "eSports",
  entertainment: "Entretenimento",
  other: "Outro",
} as const;

export const EVENT_CATEGORY_COLORS: Record<string, string> = {
  ufc: "#CC0B09",
  sports: "#C1F800",
  esports: "#E65993",
  entertainment: "#3EB3D7",
  other: "#ACCAD3",
};

export const DEFAULT_DRAW_IMAGE = "/imgs/events/draw_default.svg";
