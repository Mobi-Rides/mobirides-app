import { supabase } from "@/integrations/supabase/client";

export type AuditEventType =
  | 'user_restriction_created'
  | 'user_restriction_updated'
  | 'user_restriction_removed'
  | 'user_deleted'
  | 'user_password_reset'
  | 'vehicle_transferred'
  | 'vehicle_deleted'
  | 'admin_login'
  | 'admin_logout'
  | 'system_config_changed'
  | 'notification_campaign_created'
  | 'notification_sent'
  | 'verification_approved'
  | 'verification_rejected'
  | 'booking_cancelled_admin'
  | 'payment_refunded_admin';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogData {
  event_type: AuditEventType;
  severity?: AuditSeverity;
  actor_id?: string;
  target_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  action_details: Record<string, unknown>;
  resource_type?: string;
  resource_id?: string;
  reason?: string;
}

/**
 * Logs an audit event to the audit_logs table
 * @param data The audit event data
 * @returns Promise that resolves when the audit log is created
 */
export const logAuditEvent = async (data: AuditLogData): Promise<void> => {
  try {
    // Get current session for actor information
    const { data: session } = await supabase.auth.getSession();
    const actorId = data.actor_id || session?.session?.user?.id;

    // Get client IP and user agent if not provided
    const ipAddress = data.ip_address || getClientIP();
    const userAgent = data.user_agent || navigator.userAgent;

    // Call the log_audit_event function
    const { error } = await supabase.rpc('log_audit_event', {
      p_event_type: data.event_type,
      p_severity: data.severity || 'medium',
      p_actor_id: actorId,
      p_target_id: data.target_id,
      p_session_id: data.session_id,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_action_details: data.action_details,
      p_resource_type: data.resource_type,
      p_resource_id: data.resource_id,
      p_reason: data.reason,
    });

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

/**
 * Helper function to get client IP address
 * Note: This is a simplified implementation. In production, you might want to use a service
 * or get the IP from the server-side.
 */
const getClientIP = (): string | undefined => {
  // This is a placeholder - in a real implementation, you'd get this from the server
  // or use a service like ipify.org
  return undefined;
};

/**
 * Logs user restriction creation
 */
export const logUserRestrictionCreated = async (
  targetUserId: string,
  restrictionType: string,
  reason: string,
  createdBy?: string
): Promise<void> => {
  await logAuditEvent({
    event_type: 'user_restriction_created',
    severity: 'high',
    target_id: targetUserId,
    actor_id: createdBy,
    action_details: {
      restriction_type: restrictionType,
      reason: reason,
      action: 'created'
    },
    resource_type: 'user',
    resource_id: targetUserId,
    reason: reason,
  });
};

/**
 * Logs user restriction updates
 */
export const logUserRestrictionUpdated = async (
  targetUserId: string,
  restrictionId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  reason?: string,
  updatedBy?: string
): Promise<void> => {
  await logAuditEvent({
    event_type: 'user_restriction_updated',
    severity: 'medium',
    target_id: targetUserId,
    actor_id: updatedBy,
    action_details: {
      restriction_id: restrictionId,
      before: oldData,
      after: newData,
      changes: getObjectChanges(oldData, newData),
      action: 'updated'
    },
    resource_type: 'user_restriction',
    resource_id: restrictionId,
    reason: reason,
  });
};

/**
 * Logs user restriction removal
 */
export const logUserRestrictionRemoved = async (
  targetUserId: string,
  restrictionId: string,
  restrictionType: string,
  reason: string,
  removedBy?: string
): Promise<void> => {
  await logAuditEvent({
    event_type: 'user_restriction_removed',
    severity: 'high',
    target_id: targetUserId,
    actor_id: removedBy,
    action_details: {
      restriction_id: restrictionId,
      restriction_type: restrictionType,
      action: 'removed'
    },
    resource_type: 'user_restriction',
    resource_id: restrictionId,
    reason: reason,
  });
};

/**
 * Logs user deletion
 */
export const logUserDeleted = async (
  targetUserId: string,
  reason: string,
  deletedBy?: string
): Promise<void> => {
  await logAuditEvent({
    event_type: 'user_deleted',
    severity: 'critical',
    target_id: targetUserId,
    actor_id: deletedBy,
    action_details: {
      action: 'deleted'
    },
    resource_type: 'user',
    resource_id: targetUserId,
    reason: reason,
  });
};

/**
 * Logs admin login
 */
export const logAdminLogin = async (
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent({
    event_type: 'admin_login',
    severity: 'low',
    actor_id: adminId,
    ip_address: ipAddress,
    user_agent: userAgent,
    action_details: {
      action: 'login'
    },
    resource_type: 'admin',
    resource_id: adminId,
  });
};

/**
 * Logs admin logout
 */
export const logAdminLogout = async (
  adminId: string
): Promise<void> => {
  await logAuditEvent({
    event_type: 'admin_logout',
    severity: 'low',
    actor_id: adminId,
    action_details: {
      action: 'logout'
    },
    resource_type: 'admin',
    resource_id: adminId,
  });
};

/**
 * Logs user profile updates
 */
export const logUserProfileUpdated = async (
  targetUserId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  updatedBy?: string
): Promise<void> => {
  await logAuditEvent({
    event_type: 'user_restriction_updated', // Using this as a general user update event
    severity: 'low',
    target_id: targetUserId,
    actor_id: updatedBy,
    action_details: {
      before: oldData,
      after: newData,
      changes: getObjectChanges(oldData, newData),
      action: 'profile_updated'
    },
    resource_type: 'user',
    resource_id: targetUserId,
  });
};

/**
 * Helper function to get changes between two objects
 */
const getObjectChanges = (oldObj: Record<string, unknown>, newObj: Record<string, unknown>) => {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { from: oldValue, to: newValue };
    }
  }

  return changes;
};
