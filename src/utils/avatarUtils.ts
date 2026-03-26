import { supabase } from "@/integrations/supabase/client";

/**
 * Get a public URL for an avatar path.
 * Handles null, undefined, empty strings, and already-absolute URLs.
 * Returns null for invalid inputs (easier to work with in React).
 */
export const getAvatarPublicUrl = (avatarPath: string | null | undefined): string | null => {
    if (!avatarPath || typeof avatarPath !== 'string' || avatarPath.trim() === '') {
        return null;
    }

    // Already an absolute URL (external image)
    if (avatarPath.startsWith("http")) {
        return avatarPath;
    }

    try {
        const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
        return data.publicUrl;
    } catch (error) {
        console.warn('[AvatarUtils] Error getting public URL for:', avatarPath, error);
        return null;
    }
};

/**
 * Get avatar URL with fallback to placeholder.
 * Always returns a usable URL string for AvatarImage src.
 */
export const getAvatarUrlWithFallback = (
    avatarPath: string | null | undefined,
    fallbackUrl: string = '/placeholder.svg'
): string => {
    const publicUrl = getAvatarPublicUrl(avatarPath);
    return publicUrl || fallbackUrl;
};

/**
 * Get user initials from a name for AvatarFallback.
 */
export const getUserInitials = (name: string | null | undefined, maxLength: number = 1): string => {
    if (!name || typeof name !== 'string') return '?';
    const trimmed = name.trim();
    if (trimmed.length === 0) return '?';

    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }

    // For multiple words, take first letter of each up to maxLength
    return words.slice(0, maxLength).map(w => w.charAt(0).toUpperCase()).join('');
};
