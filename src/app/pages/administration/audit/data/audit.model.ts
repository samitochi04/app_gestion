export interface AuditEntry {
  id: number;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  actionLabel: string;
  userId: string;
  userEmail: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  ipAddress: string;
  occurredAt: string;
}
