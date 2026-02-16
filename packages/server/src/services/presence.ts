import type { OnlineUser } from "@butecogames/shared";

interface TrackedUser extends OnlineUser {
  connectionCount: number;
}

const onlineUsers = new Map<string, TrackedUser>();

/** Returns true if this is a new user (first connection). */
export function userConnected(userId: string, displayName: string, avatar: string): boolean {
  const existing = onlineUsers.get(userId);
  if (existing) {
    existing.connectionCount++;
    existing.displayName = displayName;
    existing.avatar = avatar;
    return false;
  }
  onlineUsers.set(userId, { userId, displayName, avatar, connectionCount: 1 });
  return true;
}

/** Returns true if the user is now fully offline (last connection closed). */
export function userDisconnected(userId: string): boolean {
  const existing = onlineUsers.get(userId);
  if (!existing) return false;
  existing.connectionCount--;
  if (existing.connectionCount <= 0) {
    onlineUsers.delete(userId);
    return true;
  }
  return false;
}

export function getOnlineUsers(): OnlineUser[] {
  return Array.from(onlineUsers.values()).map(({ userId, displayName, avatar }) => ({
    userId,
    displayName,
    avatar,
  }));
}
