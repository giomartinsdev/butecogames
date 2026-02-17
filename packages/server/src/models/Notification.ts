import mongoose, { Schema, type Document } from "mongoose";

export interface INotification extends Document {
  type: "info" | "success" | "warning" | "error" | "announcement";
  title: string;
  message?: string;
  sentBy: string;
  sentByName: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      enum: ["info", "success", "warning", "error", "announcement"],
    },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, maxlength: 500 },
    sentBy: { type: String, required: true },
    sentByName: { type: String, required: true },
  },
  { timestamps: true },
);

notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
