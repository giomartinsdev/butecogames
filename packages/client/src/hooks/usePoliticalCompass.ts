import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPoliticalCompassQuestions,
  fetchMyPoliticalCompassResult,
  fetchAllPoliticalCompassResults,
  fetchUserPoliticalCompassResult,
  submitPoliticalCompass,
} from "@/api/political-compass.js";
import type { PoliticalCompassAnswer } from "@butecogames/shared";

export function usePoliticalCompassQuestions() {
  return useQuery({
    queryKey: ["political-compass-questions"],
    queryFn: fetchPoliticalCompassQuestions,
    staleTime: 60 * 60 * 1000,
  });
}

export function useMyPoliticalCompassResult() {
  return useQuery({
    queryKey: ["political-compass-result"],
    queryFn: fetchMyPoliticalCompassResult,
  });
}

export function useAllPoliticalCompassResults() {
  return useQuery({
    queryKey: ["political-compass-results"],
    queryFn: fetchAllPoliticalCompassResults,
  });
}

export function useUserPoliticalCompassResult(userId: string | null) {
  return useQuery({
    queryKey: ["political-compass-result", userId],
    queryFn: () => fetchUserPoliticalCompassResult(userId!),
    enabled: !!userId,
  });
}

export function useSubmitPoliticalCompass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: PoliticalCompassAnswer[]) =>
      submitPoliticalCompass(answers),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["political-compass-result"],
      });
      queryClient.invalidateQueries({
        queryKey: ["political-compass-results"],
      });
    },
  });
}
