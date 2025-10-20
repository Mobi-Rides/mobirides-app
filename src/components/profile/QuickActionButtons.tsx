import { Button } from "@/components/ui/button";
import { CheckCircle, Download, MapPin, Phone, Edit, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionButtonsProps {
  onEditClick: () => void;
}

export const QuickActionButtons = ({ onEditClick }: QuickActionButtonsProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Action Buttons */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        <Button onClick={onEditClick} className="w-full gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <Upload className="h-4 w-4" />
          Avatar
        </Button>
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => navigate('/verification')}
        >
          <CheckCircle className="h-4 w-4" />
          Verify
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <MapPin className="h-4 w-4" />
          Address
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <Phone className="h-4 w-4" />
          Emergency
        </Button>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => navigate('/verification')}
        >
          <CheckCircle className="h-4 w-4" />
          Verification
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <Download className="h-4 w-4" />
          Download Data
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <MapPin className="h-4 w-4" />
          Address
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <Phone className="h-4 w-4" />
          Emergency
        </Button>
      </div>
    </>
  );
};
