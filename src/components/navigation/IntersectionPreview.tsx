import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { getMapboxToken } from "@/utils/mapbox";

interface IntersectionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  location: { latitude: number; longitude: number };
  instruction?: string;
}

export const IntersectionPreview = ({
  isOpen,
  onClose,
  location,
  instruction
}: IntersectionPreviewProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen && location) {
      loadPreviewImage();
    }
  }, [isOpen, location]);

  const loadPreviewImage = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await getMapboxToken();
      if (!token) throw new Error("No Mapbox token");

      // Construct Mapbox Static Image URL
      // Use satellite-streets-v12 for a realistic view
      // Size: 600x400
      // Zoom: 18 (close up)
      // Pitch: 60 (angled view)
      const { latitude, longitude } = location;
      const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${longitude},${latitude},18,60/600x400?access_token=${token}&logo=false&attribution=false`;
      
      setImageUrl(url);
    } catch (err) {
      console.error("Failed to load preview:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Intersection Preview</DialogTitle>
        </DialogHeader>
        <div className="aspect-video relative bg-muted rounded-md overflow-hidden border">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Preview unavailable</p>
              <Button variant="outline" size="sm" onClick={loadPreviewImage}>
                Retry
              </Button>
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Intersection preview" 
              className="w-full h-full object-cover"
              onError={() => setError(true)}
            />
          ) : null}
          
          {instruction && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 text-sm font-medium">
              {instruction}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
           <span>Satellite view via Mapbox</span>
           <a 
             href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.latitude},${location.longitude}`}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center hover:text-primary transition-colors"
           >
             Open Google Street View <ExternalLink className="h-3 w-3 ml-1" />
           </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
