import mongoose, { Schema, type Document } from "mongoose";

export interface IUserProfile extends Document {
  userId: string;
  displayName: string;
  xp: number;
  level: number;
  role: "user" | "admin";
  achievements: string[];
  lastDailyReward: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    achievements: { type: [String], default: [] },
    lastDailyReward: { type: Date, default: null },
  },
  { timestamps: true },
);

export const UserProfile = mongoose.model<IUserProfile>("UserProfile", userProfileSchema);
