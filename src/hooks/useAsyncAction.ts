
import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useAsyncAction = <T extends any[], R>(
  action: (...args: T) => Promise<R>,
  options?: {
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: T) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await action(...args);
      
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      setError(error);
      
      if (options?.errorMessage) {
        toast.error(options.errorMessage);
      } else {
        toast.error(error.message);
      }
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [action, options]);

  return {
    execute,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
