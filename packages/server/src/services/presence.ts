import type { OnlineUser, PresenceStatus } from "@butecogames/shared";

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
  onlineUsers.set(userId, {
    userId,
    displayName,
    avatar,
    status: "online",
    currentPage: null,
    connectionCount: 1,
  });
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

/** Returns true if the status actually changed. */
export function updateUserStatus(userId: string, status: PresenceStatus): boolean {
  const user = onlineUsers.get(userId);
  if (!user || user.status === status) return false;
  user.status = status;
  return true;
}

/** Returns true if the page actually changed. */
export function updateUserPage(userId: string, page: string): boolean {
  const user = onlineUsers.get(userId);
  if (!user || user.currentPage === page) return false;
  user.currentPage = page;
  return true;
}

export function getUserPresence(userId: string): { status: PresenceStatus; currentPage: string | null } | null {
  const user = onlineUsers.get(userId);
  if (!user) return null;
  return { status: user.status, currentPage: user.currentPage };
}

export function getOnlineUsers(): OnlineUser[] {
  return Array.from(onlineUsers.values()).map(({ userId, displayName, avatar, status, currentPage }) => ({
    userId,
    displayName,
    avatar,
    status,
    currentPage,
  }));
}
