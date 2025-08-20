import { Database } from "@/integrations/supabase/types";

type DatabaseNotification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationType = Database["public"]["Enums"]["notification_type"];
type NotificationRole = Database["public"]["Enums"]["notification_role"];

export interface NormalizedNotification {
  id: number;
  user_id: string;
  type: NotificationType;
  title: string;
  description: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  role_target: NotificationRole;
  related_booking_id: string | null;
  related_car_id: string | null;
  // Optional relationships from joins
  bookings?: {
    brand: string;
    model: string;
  } | null;
}

export function normalizeNotification(notification: DatabaseNotification & { bookings?: { cars?: { brand: string; model: string } } }): NormalizedNotification {
  return {
    id: notification.id,
    user_id: notification.user_id || '',
    type: notification.type,
    title: notification.title || '',
    description: notification.description || notification.content || notification.title || '',
    content: notification.content || notification.description || notification.title || '',
    is_read: notification.is_read || false,
    created_at: notification.created_at || new Date().toISOString(),
    updated_at: notification.updated_at || notification.created_at || new Date().toISOString(),
    expires_at: notification.expires_at || null,
    metadata: notification.metadata || {},
    role_target: notification.role_target || 'system_wide',
    related_booking_id: notification.related_booking_id || null,
    related_car_id: notification.related_car_id || null,
    bookings: notification.bookings?.cars ? {
      brand: notification.bookings.cars.brand,
      model: notification.bookings.cars.model,
    } : null,
  };
}