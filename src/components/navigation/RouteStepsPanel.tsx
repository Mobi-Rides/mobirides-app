import { ChevronRight, MapPin, Flag, Navigation2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  road_name?: string;
}

interface RouteStepsPanelProps {
  steps: RouteStep[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const RouteStepsPanel = ({
  steps,
  currentStepIndex,
  onStepClick,
  className = ""
}: RouteStepsPanelProps) => {
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getStepIcon = (index: number) => {
    if (index === 0) {
      return <MapPin className="h-4 w-4" />;
    }
    if (index === steps.length - 1) {
      return <Flag className="h-4 w-4" />;
    }
    return <Navigation2 className="h-4 w-4" />;
  };

  const getStepColor = (index: number) => {
    if (index < currentStepIndex) {
      return "text-muted-foreground";
    }
    if (index === currentStepIndex) {
      return "text-primary";
    }
    return "text-foreground";
  };

  const getStepBg = (index: number) => {
    if (index < currentStepIndex) {
      return "bg-muted/50";
    }
    if (index === currentStepIndex) {
      return "bg-primary/10 border-primary/20";
    }
    return "bg-background";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Navigation2 className="h-5 w-5" />
          Turn-by-Turn Directions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`
                  flex items-start space-x-3 p-3 rounded-lg border transition-all
                  ${getStepBg(index)}
                  ${onStepClick ? 'cursor-pointer hover:bg-muted/30' : ''}
                  ${index === currentStepIndex ? 'border-primary/20' : 'border-transparent'}
                `}
                onClick={() => onStepClick?.(index)}
              >
                <div className={`mt-1 ${getStepColor(index)}`}>
                  {getStepIcon(index)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${getStepColor(index)}`}>
                        {step.instruction}
                      </p>
                      {step.road_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          on {step.road_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <Badge 
                        variant="secondary" 
                        className="text-xs shrink-0"
                      >
                        {formatDistance(step.distance)}
                      </Badge>
                      {index === currentStepIndex && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
                
                {onStepClick && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};