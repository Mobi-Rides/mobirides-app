import { useQuery } from "@tanstack/react-query";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { HandoverPromptService, HandoverPrompt } from "@/services/handoverPromptService";

export const useHandoverPrompts = () => {
  const { userId, userRole } = useAuthStatus();

  const { 
    data: handoverPrompts = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<HandoverPrompt[]>({
    queryKey: ["handover-prompts", userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) return [];
      return HandoverPromptService.detectHandoverPrompts(userId, userRole);
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  // Filter prompts by priority
  const urgentPrompts = handoverPrompts.filter(p => p.isUrgent);
  const todayPrompts = handoverPrompts.filter(p => !p.isUrgent);
  const userShouldInitiate = handoverPrompts.filter(p => p.shouldInitiate);
  const userShouldPrepare = handoverPrompts.filter(p => !p.shouldInitiate);

  return {
    handoverPrompts,
    urgentPrompts,
    todayPrompts,
    userShouldInitiate,
    userShouldPrepare,
    hasHandoverPrompts: handoverPrompts.length > 0,
    hasUrgentPrompts: urgentPrompts.length > 0,
    isLoading,
    error,
    refetch
  };
};