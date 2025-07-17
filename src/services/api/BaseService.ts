import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class BaseService {
  protected static async handleRequest<T>(
    request: () => Promise<{ data: T; error: any }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await request();
      
      if (error) {
        console.error("API Error:", error);
        return {
          data: null,
          error: error.message || "An unexpected error occurred",
          success: false,
        };
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (err) {
      console.error("Service Error:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "An unexpected error occurred",
        success: false,
      };
    }
  }

  protected static showError(message: string) {
    toast.error(message);
  }

  protected static showSuccess(message: string) {
    toast.success(message);
  }

  protected static async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }
}