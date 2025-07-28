import { useQuery } from "@tanstack/react-query";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { HandoverPromptService, HandoverPrompt } from "@/services/handoverPromptService";
import { logger } from "@/utils/logger";

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
      try {
        if (!userId || !userRole) {
          logger.debug("useHandoverPrompts: No userId or userRole, returning empty array");
          return [];
        }
        
        logger.debug("useHandoverPrompts: Fetching handover prompts", { userId, userRole });
        const prompts = await HandoverPromptService.detectHandoverPrompts(userId, userRole);
        logger.debug("useHandoverPrompts: Successfully fetched prompts", { count: prompts.length });
        return prompts;
      } catch (error) {
        logger.error("useHandoverPrompts: Failed to fetch handover prompts", error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    retry: (failureCount, error) => {
      logger.warn("useHandoverPrompts: Query failed, retry attempt", { failureCount, error });
      return failureCount < 2; // Only retry twice
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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