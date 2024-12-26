import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CarDescriptionProps {
  description: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const CarDescription = ({ description, onChange }: CarDescriptionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        value={description}
        onChange={onChange}
        className="h-32"
      />
    </div>
  );
};