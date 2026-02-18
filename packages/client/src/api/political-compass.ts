import { apiFetch } from "./client.js";
import type {
  PoliticalCompassQuestion,
  PoliticalCompassResult,
  PoliticalCompassAnswer,
} from "@butecogames/shared";

interface QuestionsResponse {
  questions: PoliticalCompassQuestion[];
}

interface ResultResponse {
  result: PoliticalCompassResult | null;
}

interface ResultsResponse {
  results: PoliticalCompassResult[];
}

export function fetchPoliticalCompassQuestions() {
  return apiFetch<QuestionsResponse>("/api/political-compass/questions");
}

export function fetchMyPoliticalCompassResult() {
  return apiFetch<ResultResponse>("/api/political-compass/result");
}

export function fetchAllPoliticalCompassResults() {
  return apiFetch<ResultsResponse>("/api/political-compass/results");
}

export function fetchUserPoliticalCompassResult(userId: string) {
  return apiFetch<ResultResponse>(`/api/political-compass/results/${userId}`);
}

export function submitPoliticalCompass(answers: PoliticalCompassAnswer[]) {
  return apiFetch<ResultResponse>("/api/political-compass/submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
