import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSuperAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data: a } = await supabase.from("audit_analytics").select("*");
      const { data: e } = await supabase.from("audit_logs").select("event_type,severity,created_at").limit(50).order("created_at", { ascending: false });
      setAnalytics(a ?? []);
      setEvents(e ?? []);
      setLoading(false);
    };
    run();
  }, []);

  return { analytics, events, loading };
};

