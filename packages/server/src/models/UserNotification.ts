import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IUserNotification extends Document {
  userId: string;
  notificationId: Types.ObjectId;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

const userNotificationSchema = new Schema<IUserNotification>(
  {
    userId: { type: String, required: true },
    notificationId: { type: Schema.Types.ObjectId, ref: "Notification", required: true },
    read: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true },
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, read: 1 });

export const UserNotification = mongoose.model<IUserNotification>(
  "UserNotification",
  userNotificationSchema,
);
