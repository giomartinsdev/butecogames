import { AuditLog, type AuditAction } from "../models/AuditLog.js";

interface AuditParams {
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetId?: string | null;
  targetLabel?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export function logAudit(params: AuditParams): void {
  AuditLog.create({
    adminId: params.adminId,
    adminName: params.adminName,
    action: params.action,
    targetId: params.targetId ?? null,
    targetLabel: params.targetLabel ?? null,
    oldData: params.oldData ?? null,
    newData: params.newData ?? null,
  }).catch((err) => {
    console.error("[AuditLog] Failed to write audit log:", err);
  });
}
