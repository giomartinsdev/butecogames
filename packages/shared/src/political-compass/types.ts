export type PoliticalAxis = "economic" | "social" | "both" | "none";

/** 0 = Strongly Disagree, 1 = Disagree, 2 = Agree, 3 = Strongly Agree */
export type LikertAnswer = 0 | 1 | 2 | 3;

export interface PoliticalCompassQuestion {
  id: number;
  page: number;
  text: string;
  /** Scoring values for [Strongly Disagree, Disagree, Agree, Strongly Agree] */
  scoring: {
    economic: [number, number, number, number];
    social: [number, number, number, number];
  };
  affects: PoliticalAxis;
}

export interface PoliticalCompassAnswer {
  questionId: number;
  answer: LikertAnswer;
}

export interface PoliticalCompassResult {
  userId: string;
  displayName: string;
  image: string | null;
  economicScore: number;
  socialScore: number;
  answers: PoliticalCompassAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface PoliticalCompassPage {
  page: number;
  title: string;
  questionIds: number[];
}

export const LIKERT_OPTIONS: { value: LikertAnswer; label: string }[] = [
  { value: 0, label: "Discordo totalmente" },
  { value: 1, label: "Discordo" },
  { value: 2, label: "Concordo" },
  { value: 3, label: "Concordo totalmente" },
];
