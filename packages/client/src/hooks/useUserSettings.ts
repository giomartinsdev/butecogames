import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserSettings,
  updateUserSettings,
  type UserSettingsResponse,
} from "@/api/user-settings.js";

export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: fetchUserSettings,
    select: (data): UserSettingsResponse => data,
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { cursorSetId: string }) => updateUserSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["user-settings"], updated);
    },
  });
}
