import { supabase } from "@/integrations/supabase/client";

export const getAvatarPublicUrl = (avatarPath: string | null | undefined): string | undefined => {
    if (!avatarPath) return undefined;
    if (avatarPath.startsWith("http")) return avatarPath;
    return supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
};
