import * as React from "react";
import { cn } from "@/lib/utils";
import { BackButton } from "./BackButton";

/**
 * MobileHeader Props
 */
export interface MobileHeaderProps {
    /** Page title displayed in the center */
    title: string;

    /** Show back button on the left */
    showBackButton?: boolean;

    /** Back button destination (defaults to -1 for go back) */
    backTo?: string | number | "back";

    /** Custom back button label */
    backButtonLabel?: string;

    /** Show label alongside back button icon */
    showBackLabel?: boolean;

    /** Right-side action buttons or content */
    rightActions?: React.ReactNode;

    /** Make header transparent (for overlays on images/maps) */
    transparent?: boolean;

    /** Hide bottom border */
    hideBorder?: boolean;

    /** Additional CSS classes */
    className?: string;

    /** Sticky positioning (default: true) */
    sticky?: boolean;

    /** Z-index for the header (default: 50) */
    zIndex?: number;
}

/**
 * MobileHeader Component
 *
 * A mobile-optimized header component with:
 * - Back button integration
 * - Centered title
 * - Right-side action support
 * - Safe area handling for notched devices
 * - Sticky positioning
 * - Dark mode support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <MobileHeader title="Booking Details" showBackButton backTo="/bookings" />
 *
 * // With right actions
 * <MobileHeader
 *   title="Car Details"
 *   showBackButton
 *   backTo="/"
 *   rightActions={
 *     <>
 *       <ShareButton />
 *       <FavoriteButton />
 *     </>
 *   }
 * />
 *
 * // Transparent header (for overlay on images)
 * <MobileHeader
 *   title="Photo Gallery"
 *   transparent
 *   showBackButton
 *   backTo="/cars/123"
 * />
 * ```
 */
const MobileHeader = React.forwardRef<HTMLElement, MobileHeaderProps>(
    (
        {
            title,
            showBackButton = true,
            backTo,
            backButtonLabel = "Back",
            showBackLabel = false,
            rightActions,
            transparent = false,
            hideBorder = false,
            className,
            sticky = true,
            zIndex = 50,
            ...props
        },
        ref
    ) => {
        return (
            <header
                ref={ref}
                className={cn(
                    // Base styles
                    "w-full",
                    // Background
                    transparent
                        ? "bg-transparent"
                        : "bg-background/95 backdrop-blur-sm dark:bg-gray-900/95",
                    // Border
                    !hideBorder && !transparent && "border-b border-border dark:border-gray-800",
                    // Positioning
                    sticky && "sticky top-0",
                    // Safe area support for notched devices
                    "pt-[env(safe-area-inset-top,0px)]",
                    // Z-index
                    className
                )}
                style={{ zIndex }}
                {...props}
            >
                <div className="flex items-center justify-between px-4 h-14">
                    {/* Left side - Back Button */}
                    <div className="flex items-center flex-1 min-w-0">
                        {showBackButton ? (
                            <BackButton
                                to={backTo}
                                label={backButtonLabel}
                                showLabel={showBackLabel}
                                variant="ghost"
                                size="md"
                                className="-ml-2"
                            />
                        ) : (
                            <div className="w-11" /> // Spacer for alignment
                        )}
                    </div>

                    <div className="flex-1 min-w-0 px-2">
                        <h1
                            className={cn(
                                "text-base font-semibold text-center line-clamp-2 leading-tight",
                                transparent
                                    ? "text-white drop-shadow-md"
                                    : "text-foreground dark:text-white"
                            )}
                        >
                            {title}
                        </h1>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center justify-end flex-1 min-w-0 gap-1">
                        {rightActions ? (
                            <div className="flex items-center gap-1">{rightActions}</div>
                        ) : (
                            <div className="w-11" /> // Spacer for centering title
                        )}
                    </div>
                </div>
            </header>
        );
    }
);

MobileHeader.displayName = "MobileHeader";

export { MobileHeader };
