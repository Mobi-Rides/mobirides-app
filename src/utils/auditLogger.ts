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
  eventType: AuditEventType;
  severity?: AuditSeverity;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  locationData?: Record<string, unknown>;
  actionDetails?: Record<string, unknown>;
  resourceType?: string;
  resourceId?: string;
  reason?: string;
  anomalyFlags?: Record<string, unknown>;
  complianceTags?: string[];
}

/**
 * Logs an audit event to the database
 * This function handles all audit logging for admin actions
 */
export async function logAuditEvent(data: AuditLogData): Promise<string | null> {
  try {
    // Get client IP and user agent from browser if not provided
    const ipAddress = data.ipAddress || getClientIP();
    const userAgent = data.userAgent || navigator.userAgent;

    // Get session ID from localStorage or generate one
    const sessionId = data.sessionId || getSessionId();

    // Get location data if available
    const locationData = data.locationData || await getLocationData();

    // Call the database function
    const { data: result, error } = await supabase.rpc('log_audit_event', {
      p_event_type: data.eventType,
      p_severity: data.severity || 'medium',
      p_actor_id: data.actorId,
      p_target_id: data.targetId,
      p_session_id: sessionId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_location_data: locationData,
      p_action_details: data.actionDetails || {},
      p_resource_type: data.resourceType,
      p_resource_id: data.resourceId,
      p_reason: data.reason,
      p_anomaly_flags: data.anomalyFlags,
      p_compliance_tags: data.complianceTags
    });

    if (error) {
      console.error('Failed to log audit event:', error);
      return null;
    }

    return result as string;
  } catch (error) {
    console.error('Audit logging error:', error);
    return null;
  }
}

/**
 * Helper function to get client IP address
 * Note: This is a best-effort attempt and may not always work
 */
function getClientIP(): string | undefined {
  // This is a simplified approach - in production, you'd want to get this from the server
  // For now, we'll return undefined and let the server determine the IP
  return undefined;
}

/**
 * Get or create a session ID for tracking
 */
function getSessionId(): string {
  const sessionKey = 'audit_session_id';
  let sessionId = localStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(sessionKey, sessionId);
  }

  return sessionId;
}

/**
 * Get location data from browser geolocation API
 */
async function getLocationData(): Promise<Record<string, unknown> | undefined> {
  try {
    if (!navigator.geolocation) return undefined;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        () => resolve(undefined),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  } catch {
    return undefined;
  }
}

/**
 * Verify audit chain integrity
 */
export async function verifyAuditIntegrity(): Promise<{
  valid: boolean;
  totalEvents: number;
  invalidEvents: number;
  details: Array<{
    auditId: string;
    expectedHash: string;
    actualHash: string;
    valid: boolean;
  }>;
}> {
  try {
    const { data, error } = await supabase.rpc('verify_audit_chain_integrity');

    if (error) throw error;

    const results = data || [];
    const invalidEvents = results.filter((r: any) => !r.chain_valid);

    return {
      valid: invalidEvents.length === 0,
      totalEvents: results.length,
      invalidEvents: invalidEvents.length,
      details: results.map((r: any) => ({
        auditId: r.audit_id,
        expectedHash: r.expected_hash,
        actualHash: r.actual_hash,
        valid: r.chain_valid
      }))
    };
  } catch (error) {
    console.error('Failed to verify audit integrity:', error);
    return {
      valid: false,
      totalEvents: 0,
      invalidEvents: 0,
      details: []
    };
  }
}

/**
 * Get audit analytics
 */
export async function getAuditAnalytics(dateRange?: { from: Date; to: Date }) {
  try {
    let query = supabase
      .from('audit_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0]);
    }

    const { data, error } = await query.limit(30);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get audit analytics:', error);
    return [];
  }
}

/**
 * Convenience functions for common audit events
 */
export const auditEvents = {
  userRestrictionCreated: (actorId: string, targetId: string, restrictionType: string, reason: string) =>
    logAuditEvent({
      eventType: 'user_restriction_created',
      severity: 'high',
      actorId,
      targetId,
      actionDetails: { restrictionType, reason },
      resourceType: 'user',
      resourceId: targetId,
      reason,
      complianceTags: ['user-management', 'restriction']
    }),

  userRestrictionRemoved: (actorId: string, targetId: string, reason: string) =>
    logAuditEvent({
      eventType: 'user_restriction_removed',
      severity: 'medium',
      actorId,
      targetId,
      actionDetails: { action: 'restriction_removed' },
      resourceType: 'user',
      resourceId: targetId,
      reason,
      complianceTags: ['user-management', 'restriction']
    }),

  userDeleted: (actorId: string, targetId: string, reason: string, assetsTransferred?: Record<string, unknown>) =>
    logAuditEvent({
      eventType: 'user_deleted',
      severity: 'critical',
      actorId,
      targetId,
      actionDetails: { assetsTransferred },
      resourceType: 'user',
      resourceId: targetId,
      reason,
      complianceTags: ['user-management', 'deletion', 'gdpr']
    }),

  passwordResetSent: (actorId: string, targetId: string) =>
    logAuditEvent({
      eventType: 'user_password_reset',
      severity: 'medium',
      actorId,
      targetId,
      actionDetails: { action: 'password_reset_sent' },
      resourceType: 'user',
      resourceId: targetId,
      complianceTags: ['user-management', 'security']
    }),

  vehicleTransferred: (actorId: string, vehicleId: string, fromUserId: string, toUserId: string, reason: string) =>
    logAuditEvent({
      eventType: 'vehicle_transferred',
      severity: 'high',
      actorId,
      targetId: toUserId,
      actionDetails: { vehicleId, fromUserId, toUserId },
      resourceType: 'vehicle',
      resourceId: vehicleId,
      reason,
      complianceTags: ['vehicle-management', 'transfer']
    }),

  vehicleDeleted: (actorId: string, vehicleId: string, ownerId: string, reason: string) =>
    logAuditEvent({
      eventType: 'vehicle_deleted',
      severity: 'high',
      actorId,
      targetId: ownerId,
      actionDetails: { vehicleId },
      resourceType: 'vehicle',
      resourceId: vehicleId,
      reason,
      complianceTags: ['vehicle-management', 'deletion']
    }),

  adminLogin: (actorId: string, ipAddress?: string, userAgent?: string) =>
    logAuditEvent({
      eventType: 'admin_login',
      severity: 'low',
      actorId,
      ipAddress,
      userAgent,
      actionDetails: { action: 'admin_login' },
      complianceTags: ['authentication', 'admin']
    }),

  adminLogout: (actorId: string) =>
    logAuditEvent({
      eventType: 'admin_logout',
      severity: 'low',
      actorId,
      actionDetails: { action: 'admin_logout' },
      complianceTags: ['authentication', 'admin']
    })
};
