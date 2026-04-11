
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, HelpCircle } from "lucide-react";

interface RentalDetailsHeaderProps {
  status: string;
  onBack: () => void;
}

export const RentalDetailsHeader = ({ status, onBack }: RentalDetailsHeaderProps) => {
  // Generate status badge
  const getStatusBadge = () => {
    let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "danger" | "info" = "outline";
    let icon = <HelpCircle className="h-3 w-3 mr-1" />;

    switch (status) {
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
      <Badge variant={variant} className="flex items-center">
        {icon}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <BackButton onClick={onBack} showLabel label="Back" />
      {getStatusBadge()}
    </div>
  );
};
