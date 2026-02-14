export interface UserProfile {
  _id: string;
  userId: string;
  displayName: string;
  xp: number;
  level: number;
  role: "user" | "admin";
  achievements: string[];
  lastDailyReward: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  level: number;
}
