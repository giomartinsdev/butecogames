import { useAuth } from "@/hooks/useAuth.js";
import { useWallet } from "@/hooks/useWallet.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { formatCoins } from "@/lib/utils.js";
import { Link } from "react-router-dom";

export function Header() {
  const { user, signOut } = useAuth();
  const { data: wallet } = useWallet();
  const { isAdmin } = useUserProfile();

  return (
    <header className="border-b border-border bg-card px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="/logo-buteco.png"
            alt="Buteco Games"
            className="h-10"
          />
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/games" className="text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            Jogos
          </Link>
          <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            Ranking
          </Link>
          <Link to="/profile" className="text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            Perfil
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm text-accent hover:text-accent/80 transition-colors font-medium">
              ⚙️ Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              {wallet && (
                <div className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-accent">
                  {formatCoins(wallet.balance)} coins
                </div>
              )}
              <span className="text-sm">{user.name}</span>
              <button
                onClick={() => signOut()}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
