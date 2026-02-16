import type { OnlineUser } from "@butecogames/shared";

interface OnlineUsersProps {
  users: OnlineUser[];
}

const MAX_VISIBLE = 5;

export function OnlineUsers({ users }: OnlineUsersProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, MAX_VISIBLE);
  const extra = users.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <div className="flex">
        {extra > 0 && (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium text-secondary-foreground"
            title={`+${extra} online`}
          >
            +{extra}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{users.length} online</span>
    </div>
  );
}
