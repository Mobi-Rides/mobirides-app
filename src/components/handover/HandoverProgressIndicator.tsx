import React from "react";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeHandover } from "@/hooks/useRealtimeHandover";

interface HandoverProgressIndicatorProps {
  handoverSessionId: string | null;
  showDetailed?: boolean;
}

export const HandoverProgressIndicator: React.FC<HandoverProgressIndicatorProps> = ({
  handoverSessionId,
  showDetailed = false
}) => {
  const { handoverProgress, isLoading, error } = useRealtimeHandover(handoverSessionId);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !handoverProgress) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error || "Unable to load progress"}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (handoverProgress.is_completed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    if (handoverProgress.is_completed) {
      return "Handover Complete";
    } else {
      return `Step ${handoverProgress.current_step} of ${handoverProgress.total_steps}`;
    }
  };

  if (!showDetailed) {
    // Compact view for use in other components
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <div className="flex-1">
          <Progress 
            value={handoverProgress.progress_percentage} 
            className="h-2"
          />
        </div>
        <Badge variant={handoverProgress.is_completed ? "default" : "secondary"}>
          {Math.round(handoverProgress.progress_percentage)}%
        </Badge>
      </div>
    );
  }

  // Detailed view for dedicated progress display
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>Handover Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{getStatusText()}</span>
            <Badge variant={handoverProgress.is_completed ? "default" : "secondary"}>
              {Math.round(handoverProgress.progress_percentage)}%
            </Badge>
          </div>
          <Progress 
            value={handoverProgress.progress_percentage} 
            className="h-3"
          />
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{handoverProgress.completed_steps} completed</span>
          <span>{handoverProgress.total_steps - handoverProgress.completed_steps} remaining</span>
        </div>

        {handoverProgress.is_completed && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                All handover steps completed successfully!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};