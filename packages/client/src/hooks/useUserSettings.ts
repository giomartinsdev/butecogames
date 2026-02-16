import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserSettings,
  updateUserSettings,
  type UserSettingsResponse,
} from "@/api/user-settings.js";
import { useSoundStore } from "@/stores/soundStore.js";

export function useUserSettings() {
  const query = useQuery({
    queryKey: ["user-settings"],
    queryFn: fetchUserSettings,
    select: (data): UserSettingsResponse => data,
  });

  // Sync sound enabled state from server settings to local store
  const setEnabled = useSoundStore((s) => s.setEnabled);
  useEffect(() => {
    if (query.data) {
      setEnabled(query.data.settings.soundEnabled);
    }
  }, [query.data, setEnabled]);

  return query;
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { cursorSetId?: string; soundEnabled?: boolean }) =>
      updateUserSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["user-settings"], updated);
    },
  });
}
