import { Shield, Download, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ActionButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      <Button
        variant="outline"
        className="flex items-center gap-2 h-auto py-3"
        onClick={() => navigate("/verification")}
      >
        <Shield className="w-5 h-5" />
        <span>Verification</span>
      </Button>

      <Button
        variant="outline"
        className="flex items-center gap-2 h-auto py-3"
      >
        <Download className="w-5 h-5" />
        <span>Download Data</span>
      </Button>
    </div>
  );
};
