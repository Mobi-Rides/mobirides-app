import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

export const ImageUpload = ({ onImageChange, label }: ImageUploadProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="image">{label}</Label>
      <Input
        id="image"
        type="file"
        accept="image/*"
        onChange={onImageChange}
      />
    </div>
  );
};