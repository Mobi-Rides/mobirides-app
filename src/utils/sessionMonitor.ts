import { Session } from "@supabase/supabase-js";

export async function reportLogin(session: Session): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    await fetch(`${supabaseUrl}/functions/v1/session-monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "log_login",
        user_agent: navigator.userAgent,
      }),
    });
  } catch {
    // Never break login flow
  }
}
