import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarPublicUrl, getUserInitials } from '@/utils/avatarUtils';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    /** Raw avatar path from database or full URL */
    avatarUrl?: string | null;
    /** User's display name for initials fallback */
    name?: string | null;
    /** Additional CSS classes */
    className?: string;
    /** Size variant - maps to common sizes */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Show online status indicator */
    showOnlineStatus?: boolean;
    /** Whether user is currently online */
    isOnline?: boolean;
    /** Custom fallback text (overrides initials from name) */
    fallback?: string;
    /** Alt text for the avatar image */
    alt?: string;
}

/**
 * Standardized UserAvatar component for consistent avatar display across the app.
 * Handles:
 * - Raw avatar paths from Supabase storage
 * - External URLs
 * - Fallback to initials
 * - Online status indicators
 */
export function UserAvatar({
    avatarUrl,
    name,
    className,
    size = 'md',
    showOnlineStatus = false,
    isOnline = false,
    fallback,
    alt
}: UserAvatarProps) {
    // Convert raw avatar path to public URL
    const publicAvatarUrl = getAvatarPublicUrl(avatarUrl);

    // Get initials for fallback
    const initials = fallback || getUserInitials(name);

    // Size mappings
    const sizeClasses = {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg'
    };

    // Online status size adjustments
    const statusSizeClasses = {
        xs: 'h-2 w-2 -bottom-0.5 -right-0.5',
        sm: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
        md: 'h-3 w-3 -bottom-0.5 -right-0.5',
        lg: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
        xl: 'h-4 w-4 -bottom-1 -right-1'
    };

    return (
        <div className="relative inline-block">
            <Avatar className={cn(sizeClasses[size], className)}>
                <AvatarImage
                    src={publicAvatarUrl || undefined}
                    alt={alt || name || 'User avatar'}
                />
                <AvatarFallback className={cn(
                    "bg-primary/10 text-primary font-medium",
                    !publicAvatarUrl && "dark:bg-gray-800 dark:text-gray-300"
                )}>
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Online status indicator */}
            {showOnlineStatus && (
                <span
                    className={cn(
                        "absolute rounded-full border-2 border-background",
                        statusSizeClasses[size],
                        isOnline ? "bg-green-500" : "bg-gray-400"
                    )}
                />
            )}
        </div>
    );
}

/**
 * Avatar variant that shows a circle with initials for users without photos.
 * Useful for compact displays like in lists.
 */
export function InitialsAvatar({
    name,
    className,
    size = 'sm'
}: {
    name: string | null | undefined;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
    const initials = getUserInitials(name);

    const sizeClasses = {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base'
    };

    return (
        <div
            className={cn(
                "flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium",
                sizeClasses[size],
                className
            )}
        >
            {initials}
        </div>
    );
}

export default UserAvatar;
