import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppSettings } from "@butecogames/shared";
import { fetchSettings, updateSettings } from "@/api/settings.js";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<AppSettings>) => updateSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
    },
  });
}
