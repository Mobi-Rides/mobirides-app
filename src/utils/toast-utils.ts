
import { toast as sonnerToast } from "sonner";
import { toast as shadcnToast } from "@/hooks/use-toast";
import { ToastActionElement } from "@/components/ui/toast";

/**
 * A unified toast utility that supports both sonner and shadcn/ui toast systems
 * This prevents issues when different parts of the app use different toast implementations
 */
export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: { duration?: number }) => {
    sonnerToast.success(message, {
      duration: options?.duration || 4000,
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: { duration?: number }) => {
    sonnerToast.error(message, {
      duration: options?.duration || 6000,
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: { duration?: number }) => {
    sonnerToast.info(message, {
      duration: options?.duration || 4000,
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: { duration?: number }) => {
    sonnerToast.warning(message, {
      duration: options?.duration || 5000,
    });
  },

  /**
   * Show a loading toast that can be updated
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * Show a promise toast that handles loading/success/error states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Show a custom toast with more options (using shadcn/ui toast)
   */
  custom: (options: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
    action?: ToastActionElement;
    duration?: number;
  }) => {
    return shadcnToast({
      title: options.title,
      description: options.description,
      variant: options.variant,
      action: options.action,
      duration: options.duration,
    });
  }
};

// Export the hook for more complex use cases
export { useToast } from "@/hooks/use-toast";
