import mongoose, { Schema, type Document } from "mongoose";
import { DEFAULT_CURSOR_SET_ID } from "@butecogames/shared";

export interface IUserSettings extends Document {
  userId: string;
  cursorSetId: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    cursorSetId: { type: String, default: DEFAULT_CURSOR_SET_ID },
  },
  { timestamps: true },
);

export const UserSettings = mongoose.model<IUserSettings>(
  "UserSettings",
  userSettingsSchema,
);
