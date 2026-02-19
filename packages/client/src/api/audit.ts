import { apiFetch } from "./client.js";

export interface AuditLogEntry {
  _id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId: string | null;
  targetLabel: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function fetchAuditLogs(
  page: number,
  limit: number,
  search: string,
  action: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  if (action) params.set("action", action);
  return apiFetch<AuditLogsResponse>(`/api/admin/audit?${params}`);
}
