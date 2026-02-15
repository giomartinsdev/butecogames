import type { AppSettings } from "@butecogames/shared";
import { apiFetch } from "./client.js";

export function fetchSettings() {
  return apiFetch<AppSettings>("/api/settings");
}

export function updateSettings(data: Partial<AppSettings>) {
  return apiFetch<AppSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
