import { Bell, Car, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HandoverPrompt } from "@/services/handoverPromptService";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface HandoverNotificationCardProps {
  prompt: HandoverPrompt;
  onStartHandover: (bookingId: string) => void;
  compact?: boolean;
}

export const HandoverNotificationCard = ({ 
  prompt, 
  onStartHandover, 
  compact = false 
}: HandoverNotificationCardProps) => {
  const navigate = useNavigate();

  const getUrgencyColor = () => {
    switch (prompt.urgencyLevel) {
      case 'immediate':
        return "text-destructive";
      case 'soon':
        return "text-orange-600 dark:text-orange-400";
      case 'morning':
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  const handleAction = () => {
    if (prompt.shouldInitiate) {
      onStartHandover(prompt.bookingId);
    } else {
      navigate(`/rental-details/${prompt.bookingId}`);
    }
  };

  if (compact) {
    return (
      <Card className="p-3 bg-accent/50 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className={`h-4 w-4 ${getUrgencyColor()}`} />
            <span className="text-sm font-medium">
              {prompt.handoverType === 'pickup' ? 'Pickup' : 'Return'} today
            </span>
          </div>
          <Button 
            onClick={handleAction}
            size="sm" 
            variant="outline"
            className="text-xs"
          >
            {prompt.shouldInitiate ? 'Start' : 'View'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full bg-accent ${getUrgencyColor()}`}>
          <Car className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {prompt.handoverType === 'pickup' ? 'Car Pickup' : 'Car Return'} Required
            </h4>
            {prompt.isUrgent && (
              <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
                Urgent
              </span>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Car className="h-3 w-3" />
              <span>{prompt.carBrand} {prompt.carModel}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>{prompt.otherPartyName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                {format(
                  prompt.handoverType === 'pickup' ? prompt.startDate : prompt.endDate, 
                  'MMM d, h:mm a'
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleAction}
              size="sm"
              variant={prompt.shouldInitiate ? "default" : "outline"}
            >
              {prompt.shouldInitiate 
                ? `Start ${prompt.handoverType === 'pickup' ? 'Pickup' : 'Return'}`
                : 'View Details'
              }
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};