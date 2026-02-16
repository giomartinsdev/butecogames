import type { UserSettings } from "@butecogames/shared";
import { apiFetch } from "./client.js";

export interface UserSettingsResponse {
  settings: UserSettings;
  cursorSize: number;
}

export function fetchUserSettings() {
  return apiFetch<UserSettingsResponse>("/api/user-settings");
}

export function updateUserSettings(data: { cursorSetId?: string; soundEnabled?: boolean }) {
  return apiFetch<UserSettingsResponse>("/api/user-settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
