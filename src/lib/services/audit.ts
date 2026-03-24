import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

export type AuditAction =
  | "reservation.created"
  | "reservation.confirmed"
  | "reservation.cancelled"
  | "reservation.updated"
  | "reservation.status_changed"
  | "blocked_period.created"
  | "blocked_period.updated"
  | "blocked_period.deleted"
  | "payment.registered"
  | "payment.deleted";

export type AuditEntityType = "reservation" | "blocked_period";

interface LogAuditParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

/**
 * Log an audit entry. Fire-and-forget — errors are caught and logged
 * to avoid breaking the main flow.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      description: params.description,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      userId: params.userId ?? null,
    });
  } catch (error) {
    console.error("[audit] Failed to log audit entry:", error);
  }
}

/**
 * Get audit logs for a specific entity (e.g. a reservation).
 */
export async function getAuditLogsForEntity(
  entityType: AuditEntityType,
  entityId: string
) {
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId)
      )
    )
    .orderBy(desc(auditLogs.createdAt));
}
