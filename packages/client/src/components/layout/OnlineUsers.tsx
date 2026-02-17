import { useState, useRef, useEffect, useMemo } from "react";
import type { OnlineUser } from "@butecogames/shared";
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
    if (!currentUserId) return users;
    return [...users].sort((a, b) => {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
      return 0;
    });
  }, [users, currentUserId]);

  if (users.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-1 cursor-pointer">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-muted-foreground">{users.length} online</span>
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
                <img
                  src={user.avatar || "/default-avatar.png"}
                  alt={user.displayName}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
                  {user.displayName}
                </span>
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
