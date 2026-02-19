export type {
  PoliticalAxis,
  LikertAnswer,
  PoliticalCompassQuestion,
  PoliticalCompassAnswer,
  PoliticalCompassResult,
  PoliticalCompassPage,
} from "./types.js";
export { LIKERT_OPTIONS } from "./types.js";
export { POLITICAL_COMPASS_QUESTIONS, POLITICAL_COMPASS_PAGES } from "./questions.js";
export { calculatePoliticalCompass } from "./calculate.js";

export const DEFAULT_RETEST_COOLDOWN_DAYS = 180;
