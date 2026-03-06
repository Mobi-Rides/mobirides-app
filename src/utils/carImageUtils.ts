import { supabase } from "@/integrations/supabase/client";

export const getCarImagePublicUrl = (imagePath: string | null | undefined): string | undefined => {
    if (!imagePath || imagePath === "null" || imagePath === "undefined") return undefined;

    // Sometimes the image is stored as a stringified JSON array in the DB: e.g. '["car-images/xyz.jpg"]'
    let parsedPath = imagePath;
    try {
        if (imagePath.startsWith('[') && imagePath.endsWith(']')) {
            const parsedArray = JSON.parse(imagePath);
            if (Array.isArray(parsedArray) && parsedArray.length > 0) {
                parsedPath = parsedArray[0];
            }
        }
    } catch (e) {
        // Not a JSON array, ignore and continue with raw string
    }

    if (!parsedPath || parsedPath === "null" || parsedPath === "undefined") return undefined;


    // Base64 or external HTTP link or absolute Supabase URL
    if (parsedPath.startsWith("http") || parsedPath.startsWith("/") || parsedPath.startsWith("data:")) {
        return parsedPath;
    }
    // If it's a raw filename/UUID stored in the car-images bucket
    return supabase.storage.from("car-images").getPublicUrl(parsedPath).data.publicUrl;
};
