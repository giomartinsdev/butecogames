import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client.js";
import type { UserProfile } from "@butecogames/shared";

interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
  profile: UserProfile;
}

export function useUserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => apiFetch<UserProfileResponse>("/api/users/me"),
  });

  return {
    profile: data?.profile ?? null,
    user: data?.user ?? null,
    isAdmin: data?.profile?.role === "admin",
    isLoading,
    error,
  };
}
