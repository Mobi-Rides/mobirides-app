import { Database } from "@/integrations/supabase/types";

export type Car = Database["public"]["Tables"]["cars"]["Row"] & {
  isSaved?: boolean;
};

export interface CarQueryResponse {
  data: Car[];
  nextPage: number | undefined;
  count: number | null;
}