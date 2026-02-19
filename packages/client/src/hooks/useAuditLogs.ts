import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/api/audit.js";

export function useAuditLogs(
  page: number,
  limit: number,
  search: string,
  action: string,
) {
  return useQuery({
    queryKey: ["audit-logs", page, limit, search, action],
    queryFn: () => fetchAuditLogs(page, limit, search, action),
    refetchInterval: 10_000,
  });
}
