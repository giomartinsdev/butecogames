import mongoose, { Schema, type Document } from "mongoose";
import type { ChallengePeriod, ChallengeType } from "@butecogames/shared";

export interface IUserChallengeProgress extends Document {
  userId: string;
  templateId: string;
  period: ChallengePeriod;
  type: ChallengeType;
  name: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  completedAt: Date | null;
  rewardCoins: number;
  rewardXp: number;
  icon: string;
  startsAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userChallengeProgressSchema = new Schema<IUserChallengeProgress>(
  {
    userId: { type: String, required: true, index: true },
    templateId: { type: String, required: true },
    period: { type: String, enum: ["daily", "weekly"], required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    target: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    rewardCoins: { type: Number, required: true },
    rewardXp: { type: Number, required: true },
    icon: { type: String, required: true },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

userChallengeProgressSchema.index({ userId: 1, expiresAt: 1 });
userChallengeProgressSchema.index(
  { userId: 1, templateId: 1, startsAt: 1 },
  { unique: true },
);

export const UserChallengeProgress = mongoose.model<IUserChallengeProgress>(
  "UserChallengeProgress",
  userChallengeProgressSchema,
);
