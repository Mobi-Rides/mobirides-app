
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, HelpCircle } from "lucide-react";

interface RentalDetailsHeaderProps {
  status: string;
  onBack: () => void;
}

export const RentalDetailsHeader = ({ status, onBack }: RentalDetailsHeaderProps) => {
  // Generate status badge
  const getStatusBadge = () => {
    let variant = "outline";
    let icon = <HelpCircle className="h-3 w-3 mr-1" />;
    
    switch(status) {
      case "confirmed":
        variant = "success";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "pending":
        variant = "warning";
        icon = <Clock className="h-3 w-3 mr-1" />;
        break;
      case "completed":
        variant = "default";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "cancelled":
        variant = "destructive";
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
        break;
    }
    
    return (
      <Badge variant={variant as any} className="flex items-center">
        {icon}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      {getStatusBadge()}
    </div>
  );
};
