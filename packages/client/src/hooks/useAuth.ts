import { useSession, signIn, signOut } from "@/lib/auth-client.js";

export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user ?? null,
    session: session.data?.session ?? null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    signInWithDiscord: () => signIn.social({ provider: "discord" }),
    signOut: () => signOut(),
  };
}
