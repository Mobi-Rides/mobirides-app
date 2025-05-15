
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
  success: (message: string) => {
    // Use sonner for simpler messages
    sonnerToast.success(message);
  },

  /**
   * Show an error toast
   */
  error: (message: string) => {
    // Use sonner for simpler messages
    sonnerToast.error(message);
  },

  /**
   * Show an info toast
   */
  info: (message: string) => {
    // Use sonner for simpler messages
    sonnerToast.info(message);
  },

  /**
   * Show a warning toast
   */
  warning: (message: string) => {
    // Use sonner for simpler messages
    sonnerToast.warning(message);
  },

  /**
   * Show a custom toast with more options (using shadcn/ui toast)
   */
  custom: (options: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
    action?: ToastActionElement;
  }) => {
    // Use shadcn toast for more complex toasts
    return shadcnToast({
      title: options.title,
      description: options.description,
      variant: options.variant,
      action: options.action,
    });
  }
};

// Export the hook for more complex use cases
export { useToast } from "@/hooks/use-toast";
