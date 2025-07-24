import { AlertTriangle, Car, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HandoverPrompt } from "@/services/handoverPromptService";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface HandoverBannerProps {
  prompt: HandoverPrompt;
  onStartHandover: (bookingId: string) => void;
}

export const HandoverBanner = ({ prompt, onStartHandover }: HandoverBannerProps) => {
  const navigate = useNavigate();

  const getBannerStyle = () => {
    switch (prompt.urgencyLevel) {
      case 'immediate':
        return "bg-destructive text-destructive-foreground border-destructive";
      case 'soon':
        return "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-800";
      case 'morning':
        return "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getIcon = () => {
    switch (prompt.urgencyLevel) {
      case 'immediate':
        return <AlertTriangle className="h-5 w-5 animate-pulse" />;
      case 'soon':
        return <Clock className="h-5 w-5" />;
      default:
        return <Car className="h-5 w-5" />;
    }
  };

  const handleStartHandover = () => {
    onStartHandover(prompt.bookingId);
  };

  const handleViewDetails = () => {
    navigate(`/rental-details/${prompt.bookingId}`);
  };

  return (
    <Card className={`p-4 border-l-4 ${getBannerStyle()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">
              {prompt.handoverType === 'pickup' ? 'Car Pickup Required' : 'Car Return Required'}
            </h3>
            {prompt.isUrgent && (
              <span className="px-2 py-1 text-xs bg-current/10 rounded-full font-medium">
                URGENT
              </span>
            )}
          </div>
          
          <p className="text-sm opacity-90 mb-2">
            {prompt.carBrand} {prompt.carModel} • {prompt.otherPartyName}
          </p>
          
          <div className="flex items-center gap-4 text-xs opacity-75 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(prompt.handoverType === 'pickup' ? prompt.startDate : prompt.endDate, 'MMM d, h:mm a')}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {prompt.location}
            </div>
          </div>

          <div className="flex gap-2">
            {prompt.shouldInitiate ? (
              <Button 
                onClick={handleStartHandover}
                size="sm"
                className="bg-current/20 hover:bg-current/30 text-current border-current/30"
                variant="outline"
              >
                Start {prompt.handoverType === 'pickup' ? 'Pickup' : 'Return'}
              </Button>
            ) : (
              <Button 
                onClick={handleViewDetails}
                size="sm"
                variant="outline"
                className="bg-current/20 hover:bg-current/30 text-current border-current/30"
              >
                Prepare for {prompt.handoverType === 'pickup' ? 'Pickup' : 'Return'}
              </Button>
            )}
            
            <Button 
              onClick={handleViewDetails}
              size="sm"
              variant="ghost"
              className="text-current hover:bg-current/10"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};