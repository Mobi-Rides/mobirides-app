import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  label: string;
  onChange: (file: File) => void;
}

export const ImageUpload = ({ label, onChange }: ImageUploadProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="cursor-pointer"
      />
    </div>
  );
};