import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const listUserRoles = async () => {
  const { data } = await supabase.from("user_roles").select("user_id,role,assigned_by,created_at");
  return data ?? [];
};

export const assignUserRole = async (userId: string, role: UserRole) => {
  const { data, error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role })
    .select()
    .single();
  return { data, error };
};

export const listAdminCapabilities = async () => {
  const { data } = await supabase.from("admin_capabilities").select("admin_id,capability,created_at");
  return data ?? [];
};

