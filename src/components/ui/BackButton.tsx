import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Back Button Variants
 * - ghost: Transparent background, subtle hover state (default for headers)
 * - outline: Subtle border, transparent background (for floating positions)
 * - default: Filled background (for high-visibility back actions)
 */
const backButtonVariants = cva(
    // Base styles with minimum 44x44px touch target for mobile
    "inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                ghost: "hover:bg-accent hover:text-accent-foreground",
                outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
            },
            size: {
                sm: "h-9 px-2",
                md: "h-11 px-3",
                lg: "h-12 px-4",
                icon: "h-11 w-11 p-0",
            },
            position: {
                header: "",
                floating: "shadow-lg backdrop-blur-sm bg-background/90",
                inline: "",
            },
        },
        defaultVariants: {
            variant: "ghost",
            size: "md",
            position: "header",
        },
    }
);

/**
 * Back Button Props
 */
export interface BackButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof backButtonVariants> {
    /**
     * Navigation destination.
     * - string: Navigate to specific path
     * - number: Navigate back N steps (e.g., -1)
     * - 'back': Use browser back (navigate(-1))
     * - undefined: Default to navigate(-1)
     */
    to?: string | number | "back";

    /** Show text label alongside icon */
    showLabel?: boolean;

    /** Custom label text (default: "Back") */
    label?: string;

    /** Icon size in pixels */
    iconSize?: number;

    /** Whether to replace current history entry instead of push */
    replace?: boolean;

    /** Optional callback when navigation occurs */
    onNavigate?: () => void;

    /** Disable the button */
    disabled?: boolean;

    /**
     * Position mode for mobile layouts
     * - 'header': Positioned in page header (default)
     * - 'floating': Floating button with shadow/background
     * - 'inline': Inline with content
     */
    position?: "header" | "floating" | "inline";

    /**
     * Safe area handling for notched devices
     * Adds padding-top for iOS safe areas when in header position
     */
    respectSafeArea?: boolean;

    /** Additional CSS classes */
    className?: string;
}

/**
 * BackButton Component
 *
 * A standardized back button for mobile navigation with support for:
 * - Multiple visual variants (ghost, outline, default)
 * - Different positioning modes (header, floating, inline)
 * - Custom navigation targets
 * - Safe area support for notched devices
 * - Minimum 44x44px touch target for mobile accessibility
 *
 * @example
 * ```tsx
 * // Basic usage - goes back one step
 * <BackButton />
 *
 * // Navigate to specific route
 * <BackButton to="/bookings" />
 *
 * // With label in header
 * <BackButton to="/bookings" showLabel label="Bookings" />
 *
 * // Floating position on map
 * <BackButton position="floating" className="absolute top-4 left-4 z-10" />
 * ```
 */
const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
    (
        {
            to,
            showLabel = false,
            label = "Back",
            variant = "ghost",
            size = "md",
            position = "header",
            respectSafeArea = false,
            iconSize = 24,
            replace = false,
            onNavigate,
            onClick,
            disabled,
            className,
            ...props
        },
        ref
    ) => {
        const navigate = useNavigate();

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            // Call custom onClick if provided
            if (onClick) {
                onClick(e);
            }

            // Handle navigation
            if (!disabled) {
                if (typeof to === "string") {
                    if (to === "back") {
                        navigate(-1);
                    } else {
                        navigate(to, { replace });
                    }
                } else if (typeof to === "number") {
                    navigate(to);
                } else {
                    // Default: go back one step
                    navigate(-1);
                }

                onNavigate?.();
            }
        };

        // Calculate safe area padding for header position
        const safeAreaClass = respectSafeArea && position === "header"
            ? "pt-[env(safe-area-inset-top,0px)]"
            : "";

        return (
            <button
                ref={ref}
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className={cn(
                    backButtonVariants({ variant, size, position }),
                    safeAreaClass,
                    className
                )}
                aria-label={showLabel ? undefined : label}
                {...props}
            >
                <ChevronLeft
                    size={iconSize}
                    className="shrink-0"
                    aria-hidden="true"
                />
                {showLabel && (
                    <span className="text-base font-medium leading-none">{label}</span>
                )}
            </button>
        );
    }
);

BackButton.displayName = "BackButton";

export { BackButton, backButtonVariants };
