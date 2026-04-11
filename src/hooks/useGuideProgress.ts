/**
 * Hook for persisting user guide progress to Supabase.
 * 
 * @author Modisa Maphanyane
 * @ticket MOB-305
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GuideProgress {
  id: string;
  user_id: string;
  guide_id: string;
  completed_steps: number[];
  progress: number;
  started_at: string;
  completed_at: string | null;
}

export const useGuideProgress = (guideId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const progressQuery = useQuery({
    queryKey: ['guide-progress', guideId, user?.id],
    queryFn: async (): Promise<GuideProgress | null> => {
      if (!user?.id || !guideId) return null;

      const { data, error } = await supabase
        .from('user_guide_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('guide_id', guideId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching guide progress:', error);
        throw error;
      }

      if (data) {
        return {
          ...data,
          completed_steps: (data.completed_steps as number[]) || [],
        };
      }

      return null;
    },
    enabled: !!user?.id && !!guideId,
    staleTime: 2 * 60 * 1000,
  });

  const toggleStepMutation = useMutation({
    mutationFn: async ({ stepIndex, totalSteps }: { stepIndex: number; totalSteps: number }) => {
      if (!user?.id || !guideId) throw new Error('Missing user or guide ID');

      const currentSteps = progressQuery.data?.completed_steps || [];
      const newSteps = currentSteps.includes(stepIndex)
        ? currentSteps.filter((i: number) => i !== stepIndex)
        : [...currentSteps, stepIndex];

      const progress = Math.round((newSteps.length / totalSteps) * 100);
      const completed_at = newSteps.length === totalSteps ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('user_guide_progress')
        .upsert(
          {
            user_id: user.id,
            guide_id: guideId,
            completed_steps: newSteps,
            progress,
            completed_at,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,guide_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving guide progress:', error);
        throw error;
      }

      return {
        ...data,
        completed_steps: (data.completed_steps as number[]) || [],
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['guide-progress', guideId, user?.id], data);
    },
  });

  return {
    completedSteps: (progressQuery.data?.completed_steps || []) as number[],
    progress: progressQuery.data?.progress || 0,
    isCompleted: !!progressQuery.data?.completed_at,
    isLoading: progressQuery.isLoading,
    toggleStep: (stepIndex: number, totalSteps: number) =>
      toggleStepMutation.mutate({ stepIndex, totalSteps }),
    isSaving: toggleStepMutation.isPending,
  };
};
