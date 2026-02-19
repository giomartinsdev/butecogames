import type { PresenceStatus } from "@butecogames/shared";
import { apiFetch } from "./client.js";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  profile: {
    _id: string;
    userId: string;
    displayName: string;
    role: "user" | "admin";
    banned: boolean;
    bannedAt: string | null;
    level: number;
    xp: number;
  } | null;
  presence: {
    status: PresenceStatus;
    currentPage: string | null;
  } | null;
}

interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function fetchAdminUsers(page = 1, limit = 25, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return apiFetch<AdminUsersResponse>(`/api/admin/users?${params}`);
}

export function updateUserRole(userId: string, role: "admin" | "user") {
  return apiFetch<{ profile: AdminUser["profile"] }>(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export function updateUserBan(userId: string, banned: boolean) {
  return apiFetch<{ profile: AdminUser["profile"] }>(`/api/admin/users/${userId}/ban`, {
    method: "PUT",
    body: JSON.stringify({ banned }),
  });
}
