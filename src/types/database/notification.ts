import type { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export type NotificationType = Database["public"]["Enums"]["notification_type"];