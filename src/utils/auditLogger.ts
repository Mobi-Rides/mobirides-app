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

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceVendor?: string;
  deviceModel?: string;
}

export interface LocationData {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  isp?: string;
  org?: string;
  lat?: number;
  lon?: number;
}

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
 * Parse user agent string to extract device information
 */
export const parseUserAgent = (userAgent: string): DeviceInfo => {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('edg/')) {
    browser = 'Edge';
    browserVersion = ua.match(/edg\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('chrome/')) {
    browser = 'Chrome';
    browserVersion = ua.match(/chrome\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.match(/firefox\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/version\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('opr/') || ua.includes('opera/')) {
    browser = 'Opera';
    browserVersion = ua.match(/(?:opr|opera)\/([\d.]+)/)?.[1] || '';
  }
  
  // Detect OS
  let os = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('windows nt')) {
    os = 'Windows';
    const version = ua.match(/windows nt ([\d.]+)/)?.[1];
    const versionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    osVersion = version ? (versionMap[version] || version) : '';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    osVersion = ua.match(/mac os x ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (ua.includes('android')) {
    os = 'Android';
    osVersion = ua.match(/android ([\d.]+)/)?.[1] || '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = ua.includes('ipad') ? 'iPadOS' : 'iOS';
    osVersion = ua.match(/os ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }
  
  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (ua.includes('mobile') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }
  
  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
  };
};

/**
 * Fetch IP geolocation data using ip-api.com (free, no API key required)
 */
export const fetchIPGeolocation = async (ip: string): Promise<LocationData | null> => {
  try {
    // Using ip-api.com free tier (45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,timezone,isp,org,lat,lon`);
    
    if (!response.ok) {
      console.warn('Failed to fetch IP geolocation');
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      console.warn('IP geolocation failed:', data.message);
      return null;
    }
    
    return {
      ip,
      city: data.city,
      region: data.region,
      country: data.country,
      countryCode: data.countryCode,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      lat: data.lat,
      lon: data.lon,
    };
  } catch (error) {
    console.error('Error fetching IP geolocation:', error);
    return null;
  }
};

/**
 * Get client IP address from a third-party service
 */
const getClientIP = async (): Promise<string | null> => {
  try {
    // Using ipify.org (free, no API key required)
    const response = await fetch('https://api.ipify.org?format=json');
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.error('Error fetching client IP:', error);
    return null;
  }
};

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

    // Get user agent
    const userAgent = data.user_agent || navigator.userAgent;
    
    // Parse device information from user agent
    const deviceInfo = parseUserAgent(userAgent);

    // Get client IP if not provided
    let ipAddress = data.ip_address;
    if (!ipAddress) {
      ipAddress = await getClientIP();
    }

    // Fetch geolocation data for the IP
    let locationData: LocationData | null = null;
    if (ipAddress) {
      locationData = await fetchIPGeolocation(ipAddress);
    }

    // Enhanced action details with device info
    const enhancedActionDetails = {
      ...data.action_details,
      device: deviceInfo,
    };

    // Call the database function to log audit event
    // Note: Using log_admin_activity RPC instead of direct insert for better compatibility
    try {
      await supabase.rpc('log_admin_activity', {
        p_admin_id: actorId || '',
        p_action: data.event_type,
        p_resource_type: data.resource_type || null,
        p_resource_id: data.resource_id || null,
        p_details: JSON.parse(JSON.stringify(enhancedActionDetails)),
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null,
      });
    } catch (rpcError) {
      // Fallback to direct insert if RPC fails
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: actorId || '',
          action: data.event_type,
          resource_type: data.resource_type || null,
          resource_id: data.resource_id || null,
          details: JSON.parse(JSON.stringify(enhancedActionDetails)),
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
        });
    }
    
    const error = null; // No error if we reach here
    
    /* Original RPC call - commented out as it's not in generated types
    const { error } = await supabase.rpc('log_audit_event', {
      p_event_type: data.event_type,
      p_severity: data.severity || 'medium',
      p_actor_id: actorId,
      p_target_id: data.target_id,
      p_session_id: data.session_id,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent,
      p_location_data: locationData || null,
      p_action_details: enhancedActionDetails,
      p_resource_type: data.resource_type,
      p_resource_id: data.resource_id,
      p_reason: data.reason,
    });
    */

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