import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useWallet } from "@/hooks/useWallet.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { formatCoins } from "@/lib/utils.js";
import { Link } from "react-router-dom";
import { TransferModal } from "@/components/wallet/TransferModal.js";
import { OnlineUsers } from "./OnlineUsers.js";
import { useOnlineUsersStore } from "@/stores/onlineUsersStore.js";

export function Header() {
  const { user, signOut } = useAuth();
  const { data: wallet } = useWallet();
  const { isAdmin } = useUserProfile();
  const onlineUsers = useOnlineUsersStore((s) => s.users);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setDropdownOpen(true);
  }

  function handleMouseLeave() {
    closeTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

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
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <OnlineUsers users={onlineUsers} />

              {wallet && (
                <div className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-accent">
                  {formatCoins(wallet.balance)} coins
                </div>
              )}

              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center gap-2 cursor-pointer">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm">{user.name}</span>
                </div>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setTransferOpen(true);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
                      >
                        Transferir
                      </button>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Configurações
                      </Link>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </header>
  );
}
