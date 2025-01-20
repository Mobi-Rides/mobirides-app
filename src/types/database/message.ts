import type { Database } from "@/integrations/supabase/types";

export type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  sender: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
};
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

export type MessageStatus = Database["public"]["Enums"]["message_status"];