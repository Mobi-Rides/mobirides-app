import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUpload = ({ onImageChange }: ImageUploadProps) => {
  return (
    <div className="space-y-4">
      <Label 
        htmlFor="image" 
        className="cursor-pointer flex items-center gap-2 bg-white rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors shadow-sm"
      >
        <Camera className="h-5 w-5 text-primary" />
        <span className="font-medium text-primary">Add Photo</span>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={onImageChange}
          multiple
          className="hidden"
        />
      </Label>
    </div>
  );
};
