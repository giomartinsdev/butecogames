import mongoose, { Schema, type Document } from "mongoose";

export type AuditAction =
  | "user.role_change"
  | "user.ban_change"
  | "settings.update"
  | "event.create"
  | "event.update"
  | "event.status_change"
  | "event.resolve"
  | "event.update_images"
  | "event.delete"
  | "notification.create"
  | "notification.resend"
  | "xp.awarded";

export interface IAuditLog extends Document {
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetId: string | null;
  targetLabel: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: String, required: true, index: true },
    adminName: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: [
        "user.role_change",
        "user.ban_change",
        "settings.update",
        "event.create",
        "event.status_change",
        "event.resolve",
        "notification.create",
        "notification.resend",
        "xp.awarded",
      ],
    },
    targetId: { type: String, default: null },
    targetLabel: { type: String, default: null },
    oldData: { type: Schema.Types.Mixed, default: null },
    newData: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
