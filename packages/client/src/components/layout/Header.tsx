import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useWallet } from "@/hooks/useWallet.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { formatCoins } from "@/lib/utils.js";
import { Link, useLocation } from "react-router-dom";
import { TransferModal } from "@/components/wallet/TransferModal.js";
import type { SearchUser } from "@/api/wallet.js";
import { OnlineUsers } from "./OnlineUsers.js";
import { useOnlineUsersStore } from "@/stores/onlineUsersStore.js";
import type { OnlineUser } from "@butecogames/shared";
import { HandCoins, Settings, LogOut, Volume2, VolumeOff } from "lucide-react";
import { useSoundStore } from "@/stores/soundStore.js";
import { useUpdateUserSettings } from "@/hooks/useUserSettings.js";
import { XpBar } from "@/components/gamification/XpBar.js";
import { NotificationBell } from "./NotificationBell.js";

export function Header() {
  const { user, signOut } = useAuth();
  const { data: wallet } = useWallet();
  const { isAdmin } = useUserProfile();
  const onlineUsers = useOnlineUsersStore((s) => s.users);
  const soundEnabled = useSoundStore((s) => s.enabled);
  const setSoundEnabled = useSoundStore((s) => s.setEnabled);
  const updateSettings = useUpdateUserSettings();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUser, setTransferUser] = useState<SearchUser | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pathname } = useLocation();

  const handleTransferFromOnline = useCallback((onlineUser: OnlineUser) => {
    setTransferUser({
      id: onlineUser.userId,
      name: onlineUser.displayName,
      image: onlineUser.avatar || null,
      discordId: null,
    });
    setTransferOpen(true);
  }, []);

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
    <header className="border-b border-border bg-card px-6 py-3 select-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="/imgs/logo_buteco.png"
            alt="Buteco Games"
            className="h-10"
          />
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/games"
            className={`text-lg transition-colors ${pathname === "/games" || pathname.startsWith("/games/") ? "text-card-foreground font-semibold" : "text-muted-foreground hover:text-card-foreground"}`}
          >
            Jogos
          </Link>
          <Link
            to="/leaderboard"
            className={`text-lg transition-colors ${pathname === "/leaderboard" ? "text-card-foreground font-semibold" : "text-muted-foreground hover:text-card-foreground"}`}
          >
            Ranking
          </Link>
          <Link
            to="/profile"
            className={`text-lg transition-colors ${pathname === "/profile" ? "text-card-foreground font-semibold" : "text-muted-foreground hover:text-card-foreground"}`}
          >
            Perfil
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`text-lg transition-colors font-medium ${pathname === "/admin" || pathname.startsWith("/admin/") ? "text-accent" : "text-accent/70 hover:text-accent"}`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <OnlineUsers users={onlineUsers} currentUserId={user.id} onTransferClick={handleTransferFromOnline} />

              <XpBar />

              {wallet && (
                <div className="rounded-lg bg-secondary px-3 py-1.5 text-md font-medium text-accent">
                  <img src="/imgs/coin.png" alt="Coins" className="inline-block h-4 w-4 mr-1" />
                  {formatCoins(wallet.balance)}
                </div>
              )}

              <NotificationBell />

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
                  <span className="text-md">{user.name}</span>
                </div>

                {dropdownOpen && (
                  <div className="absolute -right-10 top-full mt-3 w-48 rounded-lg border border-border bg-card shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setTransferOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
                      >
                        <HandCoins size={15} />
                        Transferir
                      </button>
                      <button
                        onClick={() => {
                          const next = !soundEnabled;
                          setSoundEnabled(next);
                          updateSettings.mutate({ soundEnabled: next });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
                      >
                        {soundEnabled ? <Volume2 size={15} /> : <VolumeOff size={15} />}
                        {soundEnabled ? "Sons ligados" : "Sons desligados"}
                      </button>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Settings size={15} />
                        Configurações
                      </Link>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      >
                        <LogOut size={15} />
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
      <TransferModal
        open={transferOpen}
        onClose={() => {
          setTransferOpen(false);
          setTransferUser(null);
        }}
        preselectedUser={transferUser}
      />
    </header>
  );
}
