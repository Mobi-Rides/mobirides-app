/**
 * Displays guide progress bar and step completion checkboxes.
 * 
 * @author Modisa Maphanyane
 * @ticket MOB-311
 */

import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getRouteForAction } from "@/utils/guideActionRoutes";

interface GuideStep {
  title: string;
  content: string;
  action?: { label: string } | string;
}

interface GuideProgressTrackerProps {
  steps: GuideStep[];
  completedSteps: number[];
  progress: number;
  isCompleted: boolean;
  isSaving: boolean;
  onToggleStep: (stepIndex: number, totalSteps: number) => void;
}

export const GuideProgressTracker = ({
  steps,
  completedSteps,
  progress,
  isCompleted,
  isSaving,
  onToggleStep,
}: GuideProgressTrackerProps) => {
  const navigate = useNavigate();
  const totalSteps = steps.length;

  return (
    <>
      {totalSteps > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted
                ? "✓ Completed"
                : `${completedSteps.length} of ${totalSteps} completed`}
            </Badge>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="space-y-4">
        {steps.map((step, index) => {
          const label =
            typeof step.action === "object" ? step.action.label : step.action;
          const route = label ? getRouteForAction(label) : null;

          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => onToggleStep(index, totalSteps)}
                    disabled={isSaving}
                    className="mt-1 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2
                      className={`h-5 w-5 ${
                        completedSteps.includes(index)
                          ? "fill-current"
                          : "fill-none"
                      }`}
                    />
                  </button>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.content}
                    </p>
                    {label && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => route && navigate(route)}
                        disabled={!route}
                      >
                        {label}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};
