export interface UserProfile {
  _id: string;
  userId: string;
  displayName: string;
  xp: number;
  level: number;
  role: "user" | "admin";
  banned: boolean;
  bannedAt: string | null;
  achievements: string[];
  totalBets: number;
  totalWins: number;
  totalTransfers: number;
  totalDailyRewards: number;
  totalChallengesCompleted: number;
  gamesPlayed: string[];
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

export interface OnlineUser {
  userId: string;
  displayName: string;
  avatar: string;
}
