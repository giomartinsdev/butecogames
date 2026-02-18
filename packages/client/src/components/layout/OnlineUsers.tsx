import { useState, useRef, useEffect, useMemo } from "react";
import type { OnlineUser } from "@butecogames/shared";
import { getRouteLabel } from "@butecogames/shared";
import { HandCoins } from "lucide-react";

interface OnlineUsersProps {
  users: OnlineUser[];
  currentUserId?: string;
  onTransferClick: (user: OnlineUser) => void;
}

export function OnlineUsers({ users, currentUserId, onTransferClick }: OnlineUsersProps) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  }

  function handleMouseLeave() {
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // Current user always first
      if (currentUserId) {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
      }
      // Online before away
      if (a.status === "online" && b.status === "away") return -1;
      if (a.status === "away" && b.status === "online") return 1;
      return 0;
    });
  }, [users, currentUserId]);

  const onlineCount = users.filter((u) => u.status === "online").length;
  const awayCount = users.filter((u) => u.status === "away").length;

  if (users.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-1 cursor-pointer">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-muted-foreground">
          {onlineCount} online{awayCount > 0 ? `, ${awayCount} ausente${awayCount > 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-4 w-64 rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              Usuários Online ({users.length})
            </span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
            {sortedUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors"
              >
                <div className="relative shrink-0">
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.displayName}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                      user.status === "online" ? "bg-green-500" : "bg-orange-400"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-card-foreground">
                    {user.displayName}
                  </span>
                  {user.currentPage && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {getRouteLabel(user.currentPage)}
                    </span>
                  )}
                </div>
                {user.userId !== currentUserId && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      onTransferClick(user);
                    }}
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-accent transition-colors"
                    title={`Transferir coins para ${user.displayName}`}
                  >
                    <HandCoins size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
