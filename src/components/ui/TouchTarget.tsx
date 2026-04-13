import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TouchTarget Props
 * Ensures a minimum 44x44px touch target for mobile accessibility
 * per Apple Human Interface Guidelines and Material Design
 */
export interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Minimum width in pixels (default: 44) */
    minWidth?: number;
    /** Minimum height in pixels (default: 44) */
    minHeight?: number;
    /** Additional padding to add around the touch target */
    padding?: number;
    /** Whether the element is disabled */
    disabled?: boolean;
    /** Whether to show visual feedback on active state */
    activeFeedback?: boolean;
}

/**
 * TouchTarget Component
 * 
 * Wraps interactive elements to ensure they meet minimum touch target sizes
 * for mobile accessibility. Following Apple HIG (44x44px) and Material Design (48x48dp).
 * 
 * @example
 * ```tsx
 * // Wrap a small icon button
 * <TouchTarget>
 *   <button className="w-6 h-6">
 *     <Icon />
 *   </button>
 * </TouchTarget>
 * 
 * // With custom size
 * <TouchTarget minWidth={48} minHeight={48}>
 *   <button>Small Button</button>
 * </TouchTarget>
 * ```
 */
const TouchTarget = React.forwardRef<HTMLDivElement, TouchTargetProps>(
    (
        {
            children,
            className,
            minWidth = 44,
            minHeight = 44,
            padding = 0,
            disabled = false,
            activeFeedback = true,
            style,
            ...props
        },
        ref
    ) => {
        const touchTargetStyles: React.CSSProperties = {
            minWidth: `${minWidth}px`,
            minHeight: `${minHeight}px`,
            ...(padding > 0 && {
                padding: `${padding}px`,
            }),
            ...style,
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center",
                    activeFeedback && "active:scale-95 transition-transform duration-150",
                    disabled && "opacity-50 pointer-events-none",
                    className
                )}
                style={touchTargetStyles}
                {...props}
            >
                {children}
            </div>
        );
    }
);

TouchTarget.displayName = "TouchTarget";

/**
 * TouchTargetButton Props
 */
export interface TouchTargetButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual size variant */
    size?: "sm" | "md" | "lg";
    /** Whether to show loading state */
    isLoading?: boolean;
    /** Loading text to display */
    loadingText?: string;
    /** Button variant */
    variant?: "default" | "primary" | "secondary" | "ghost" | "destructive";
}

/**
 * TouchTargetButton Component
 * A button that automatically meets touch target requirements
 */
const TouchTargetButton = React.forwardRef<
    HTMLButtonElement,
    TouchTargetButtonProps
>(
    (
        {
            children,
            className,
            size = "md",
            variant = "default",
            isLoading = false,
            loadingText,
            disabled,
            ...props
        },
        ref
    ) => {
        const sizeClasses = {
            sm: "min-w-[44px] min-h-[40px] px-3 py-2 text-sm",
            md: "min-w-[44px] min-h-[44px] px-4 py-2.5 text-base",
            lg: "min-w-[48px] min-h-[48px] px-6 py-3 text-base",
        };

        const variantClasses = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "active:scale-95 disabled:pointer-events-none disabled:opacity-50",
                    "touch-manipulation", // Prevents double-tap zoom on mobile browsers
                    sizeClasses[size],
                    variantClasses[variant],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        {loadingText || children}
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);

TouchTargetButton.displayName = "TouchTargetButton";

/**
 * IconButton Props
 * For icon-only buttons that need proper touch targets
 */
export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Icon size in pixels */
    iconSize?: number;
    /** Whether the button is in a loading state */
    isLoading?: boolean;
    /** Accessible label for the icon button (required for a11y) */
    ariaLabel: string;
    /** Visual variant */
    variant?: "default" | "ghost" | "outline";
}

/**
 * IconButton Component
 * Icon-only button with guaranteed 44x44px touch target
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            children,
            className,
            iconSize = 20,
            isLoading = false,
            ariaLabel,
            variant = "ghost",
            disabled,
            ...props
        },
        ref
    ) => {
        const variantClasses = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            ghost: "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        };

        return (
            <button
                ref={ref}
                type="button"
                aria-label={ariaLabel}
                className={cn(
                    "inline-flex items-center justify-center",
                    "w-11 h-11 min-w-[44px] min-h-[44px]", // Ensures 44x44px touch target
                    "rounded-full transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "active:scale-95 disabled:pointer-events-none disabled:opacity-50",
                    "touch-manipulation",
                    variantClasses[variant],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                    <span style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
                        {children}
                    </span>
                )}
            </button>
        );
    }
);

IconButton.displayName = "IconButton";

export { TouchTarget, TouchTargetButton, IconButton };
