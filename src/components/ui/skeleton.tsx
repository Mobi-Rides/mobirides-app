import { cn } from "@/lib/utils"

/**
 * Skeleton Props
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant style for different skeleton types */
  variant?: "default" | "circle" | "text" | "card" | "button";
  /** Animation style */
  animation?: "pulse" | "shimmer" | "none";
}

/**
 * Skeleton Component
 * 
 * Loading placeholder with multiple variants and animations.
 * Optimized for mobile with accessible reduced-motion support.
 * 
 * @example
 * ```tsx
 * // Default pulsing skeleton
 * <Skeleton className="h-4 w-32" />
 * 
 * // Circle avatar skeleton
 * <Skeleton variant="circle" className="h-12 w-12" />
 * 
 * // Text line skeleton
 * <Skeleton variant="text" className="h-4 w-full" />
 * 
 * // Card skeleton
 * <Skeleton variant="card" className="h-48 w-full" />
 * 
 * // Shimmer animation
 * <Skeleton animation="shimmer" className="h-4 w-32" />
 * ```
 */
function Skeleton({
  className,
  variant = "default",
  animation = "pulse",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    circle: "rounded-full",
    text: "rounded-sm",
    card: "rounded-lg",
    button: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    shimmer: "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
    none: "",
  };

  return (
    <div
      className={cn(
        "bg-muted",
        variantClasses[variant],
        animationClasses[animation],
        // Support for prefers-reduced-motion
        "motion-reduce:animate-none",
        className
      )}
      {...props}
      aria-hidden="true"
      role="presentation"
    />
  );
}

/**
 * SkeletonText Component
 * Multiple lines of text skeleton with consistent spacing
 */
interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines to render */
  lines?: number;
  /** Width of each line (can be array for different widths) */
  widths?: string[] | string;
  /** Space between lines */
  gap?: number;
}

function SkeletonText({
  lines = 3,
  widths,
  gap = 2,
  className,
  ...props
}: SkeletonTextProps) {
  const getWidth = (index: number): string => {
    if (!widths) return "100%";
    if (Array.isArray(widths)) {
      return widths[index % widths.length] || "100%";
    }
    return widths;
  };

  return (
    <div
      className={cn("flex flex-col", className)}
      style={{ gap: `${gap * 0.25}rem` }}
      {...props}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className="h-4"
          style={{ width: getWidth(index) }}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard Component
 * Card-shaped skeleton with image and content areas
 */
interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show image area */
  hasImage?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Image height */
  imageHeight?: string;
}

function SkeletonCard({
  hasImage = true,
  contentLines = 3,
  imageHeight = "h-48",
  className,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
      {...props}
      role="status"
      aria-label="Loading content"
    >
      {hasImage && (
        <Skeleton variant="card" className={cn("w-full", imageHeight)} />
      )}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton variant="text" className="h-5 w-24" />
          <Skeleton variant="text" className="h-4 w-12" />
        </div>
        <SkeletonText lines={contentLines} widths={["100%", "80%", "60%"]} />
      </div>
    </div>
  );
}

/**
 * SkeletonAvatar Component
 * Circular avatar skeleton
 */
interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Avatar size */
  size?: "sm" | "md" | "lg" | "xl";
}

function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton
      variant="circle"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
}

/**
 * SkeletonButton Component
 * Button-shaped skeleton
 */
interface SkeletonButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Button width */
  width?: string;
  /** Full width button */
  fullWidth?: boolean;
}

function SkeletonButton({
  width = "w-24",
  fullWidth = false,
  className,
  ...props
}: SkeletonButtonProps) {
  return (
    <Skeleton
      variant="button"
      className={cn(
        "h-11", // 44px for touch target
        fullWidth ? "w-full" : width,
        className
      )}
      {...props}
    />
  );
}

/**
 * CarCardSkeleton Component
 * Specialized skeleton for car cards
 */
function CarCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card overflow-hidden h-auto min-h-[20rem]",
        className
      )}
      {...props}
      role="status"
      aria-label="Loading car details"
    >
      {/* Image area */}
      <Skeleton variant="card" className="h-40 sm:h-48 w-full" />

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Type and rating row */}
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="h-6 w-16 rounded-md" />
          <div className="flex items-center gap-1">
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
        </div>

        {/* Title and price row */}
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2 space-y-1">
            <Skeleton variant="text" className="h-5 w-3/4" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton variant="text" className="h-6 w-16" />
            <Skeleton variant="text" className="h-3 w-8 ml-auto" />
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-muted my-2" />

        {/* Specs row */}
        <div className="grid grid-cols-3 gap-2">
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  CarCardSkeleton,
};
