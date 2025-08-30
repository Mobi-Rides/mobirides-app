import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

interface HandoverProgress {
  total_steps: number;
  completed_steps: number;
  current_step: number;
  progress_percentage: number;
  is_completed: boolean;
}

interface RealtimeHandoverData {
  handoverProgress: HandoverProgress | null;
  isLoading: boolean;
  error: string | null;
}

export const useRealtimeHandover = (handoverSessionId: string | null): RealtimeHandoverData => {
  const [handoverProgress, setHandoverProgress] = useState<HandoverProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial progress
  const fetchProgress = async () => {
    if (!handoverSessionId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .rpc('calculate_handover_progress', { 
          handover_session_id_param: handoverSessionId 
        });

      if (error) throw error;
      
      // Safely parse the JSON data
      if (data && typeof data === 'object') {
        const progressData = data as unknown as HandoverProgress;
        setHandoverProgress(progressData);
      } else {
        setHandoverProgress(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching handover progress:", err);
      setError("Failed to load handover progress");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [handoverSessionId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!handoverSessionId) return;



    const channel = supabase
      .channel(`handover_progress_${handoverSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handover_step_completion',
          filter: `handover_session_id=eq.${handoverSessionId}`
        },
        async (payload) => {
          // Refetch progress when steps are updated
          await fetchProgress();
          
          // Show toast for completed steps
          if (payload.eventType === 'UPDATE' && payload.new?.is_completed) {
            const stepName = payload.new.step_name?.replace(/_/g, ' ');
            toast.success(`${stepName} completed!`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handover_sessions',
          filter: `id=eq.${handoverSessionId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new?.handover_completed) {
            toast.success("Handover process completed successfully!");
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error("Failed to subscribe to handover updates");
          setError("Real-time updates unavailable");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handoverSessionId]);

  return {
    handoverProgress,
    isLoading,
    error
  };
};