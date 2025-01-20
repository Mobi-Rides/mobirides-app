import type { Database } from "@/integrations/supabase/types";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export type ReviewType = Database["public"]["Enums"]["review_type"];