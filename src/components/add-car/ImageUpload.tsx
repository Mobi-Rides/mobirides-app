
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ImageUploadProps {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUpload = ({ onImageChange }: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageChange(e);
    
    // Create preview
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6">
        {previewUrl ? (
          <div className="space-y-4 w-full">
            <div className="relative aspect-video mx-auto max-w-sm overflow-hidden rounded-lg">
              <img 
                src={previewUrl} 
                alt="Car preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-muted-foreground">Image uploaded successfully</p>
            <Label 
              htmlFor="image" 
              className="cursor-pointer flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-lg px-4 py-2 hover:bg-primary/20 transition-colors"
            >
              <Camera className="h-4 w-4" />
              <span className="font-medium">Change image</span>
            </Label>
          </div>
        ) : (
          <>
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium text-center">Upload car image</h3>
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Upload a clear photo of your vehicle. Front or 3/4 view recommended.
            </p>
            <Label 
              htmlFor="image" 
              className="cursor-pointer flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-4 py-2 hover:bg-primary/20 transition-colors"
            >
              <Camera className="h-4 w-4" />
              <span className="font-medium">Browse files</span>
            </Label>
          </>
        )}
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
