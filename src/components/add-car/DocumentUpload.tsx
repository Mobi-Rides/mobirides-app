import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DocumentUploadProps {
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
}

export const DocumentUpload = ({ onDocumentChange }: DocumentUploadProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="registration" className="text-base">Car Registration Document</Label>
        <Input
          id="registration"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => onDocumentChange(e, 'registration')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="insurance" className="text-base">Insurance Document (First Page)</Label>
        <Input
          id="insurance"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => onDocumentChange(e, 'insurance')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional" className="text-base">Additional Documents</Label>
        <Input
          id="additional"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={(e) => onDocumentChange(e, 'additional')}
        />
      </div>
    </div>
  );
};