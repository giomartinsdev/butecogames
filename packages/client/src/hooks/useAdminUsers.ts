import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminUsers, updateUserRole, updateUserBan } from "@/api/admin-users.js";

export function useAdminUsers(page = 1, limit = 25, search = "") {
  return useQuery({
    queryKey: ["admin-users", page, limit, search],
    queryFn: () => fetchAdminUsers(page, limit, search),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "admin" | "user" }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateUserBan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      updateUserBan(userId, banned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
