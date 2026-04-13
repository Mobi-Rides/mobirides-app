import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Extended Input props for mobile optimization
 */
export interface InputProps extends React.ComponentProps<"input"> {
  /** Input mode for mobile keyboards (tel, email, numeric, etc.) */
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** Autocomplete hints for better autofill */
  autoComplete?: string;
  /** Whether to show loading state */
  isLoading?: boolean;
  /** Error state */
  error?: boolean;
  /** Helper text or error message */
  helperText?: string;
}

/**
 * Input Component
 * 
 * Mobile-optimized input with:
 * - text-base font size to prevent iOS zoom on focus
 * - Proper touch targets
 * - Support for inputmode and autocomplete attributes
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * // Email input with proper mobile keyboard
 * <Input 
 *   type="email" 
 *   inputMode="email"
 *   autoComplete="email"
 *   placeholder="Enter your email"
 * />
 * 
 * // Phone input with tel keyboard
 * <Input 
 *   type="tel" 
 *   inputMode="tel"
 *   autoComplete="tel"
 *   placeholder="Phone number"
 * />
 * 
 * // Numeric input
 * <Input 
 *   type="text" 
 *   inputMode="numeric"
 *   pattern="[0-9]*"
 *   placeholder="Enter amount"
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    inputMode,
    autoComplete,
    isLoading = false,
    error = false,
    helperText,
    disabled,
    ...props
  }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={cn(
            // Base styles - increased height for better touch target
            "flex h-12 w-full rounded-md border border-input bg-background px-4 py-3",
            // Text size - text-base prevents iOS zoom on focus
            "text-base ring-offset-background",
            // File input styles
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            // Placeholder
            "placeholder:text-muted-foreground",
            // Focus states with increased visibility
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Error state
            error && "border-destructive focus-visible:ring-destructive",
            // Loading state
            isLoading && "pr-10",
            // Override md:text-sm to keep mobile-friendly size
            "md:text-base",
            className
          )}
          ref={ref}
          disabled={disabled || isLoading}
          {...props}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full block" />
          </div>
        )}

        {/* Helper text / Error message */}
        {helperText && (
          <p className={cn(
            "mt-1.5 text-sm",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

/**
 * MobileInput Component
 * Pre-configured input variants for common mobile use cases
 */
export interface MobileInputProps extends Omit<InputProps, 'type' | 'inputMode' | 'autoComplete'> {
  variant?: 'email' | 'phone' | 'password' | 'numeric' | 'text' | 'search' | 'url';
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ variant = 'text', ...props }, ref) => {
    const variantConfig: Record<string, {
      type: string;
      inputMode: React.HTMLAttributes<HTMLInputElement>['inputMode'];
      autoComplete: string;
      pattern?: string;
    }> = {
      email: {
        type: 'email',
        inputMode: 'email',
        autoComplete: 'email',
      },
      phone: {
        type: 'tel',
        inputMode: 'tel',
        autoComplete: 'tel',
      },
      password: {
        type: 'password',
        inputMode: 'text',
        autoComplete: 'current-password',
      },
      numeric: {
        type: 'text',
        inputMode: 'numeric',
        autoComplete: 'off',
        pattern: '[0-9]*',
      },
      text: {
        type: 'text',
        inputMode: 'text',
        autoComplete: 'on',
      },
      search: {
        type: 'search',
        inputMode: 'search',
        autoComplete: 'off',
      },
      url: {
        type: 'url',
        inputMode: 'url',
        autoComplete: 'url',
      },
    };

    const config = variantConfig[variant];

    return (
      <Input
        ref={ref}
        type={config.type}
        inputMode={config.inputMode}
        autoComplete={config.autoComplete}
        {...(config.pattern ? { pattern: config.pattern } : {})}
        {...props}
      />
    );
  }
);

MobileInput.displayName = "MobileInput";

export { Input, MobileInput }
