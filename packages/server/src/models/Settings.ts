import mongoose, { Schema } from "mongoose";

export interface ISettings {
  _id: string;
  roulette: {
    bettingDuration: number;
    spinningDuration: number;
    resultDuration: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

const settingsSchema = new Schema(
  {
    _id: { type: String, default: "app_settings" },
    roulette: {
      bettingDuration: { type: Number, default: 10 },
      spinningDuration: { type: Number, default: 5 },
      resultDuration: { type: Number, default: 5 },
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
