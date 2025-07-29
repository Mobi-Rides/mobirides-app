import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface BookingBreadcrumbsProps {
  currentStep: "selection" | "confirmation" | "success" | "handover";
  bookingId?: string;
}

export const BookingBreadcrumbs = ({
  currentStep,
  bookingId,
}: BookingBreadcrumbsProps) => {
  const steps = [
    { key: "selection", label: "Car Selection", completed: true },
    {
      key: "confirmation",
      label: "Booking Details",
      completed: currentStep !== "selection",
    },
    {
      key: "success",
      label: "Confirmation",
      completed: ["success", "handover"].includes(currentStep),
    },
    {
      key: "handover",
      label: "Handover",
      completed: currentStep === "handover",
    },
  ];

  const getStepIcon = (step: typeof steps[0]) => {
    if (step.completed && currentStep !== step.key) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (currentStep === step.key) {
      return <Clock className="h-4 w-4 text-primary" />;
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="p-4 bg-muted/50 border-b">
      <Breadcrumb>
        <BreadcrumbList>
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <BreadcrumbItem className="flex items-center gap-2">
                {getStepIcon(step)}
                {currentStep === step.key ? (
                  <BreadcrumbPage className="font-medium">
                    {step.label}
                  </BreadcrumbPage>
                ) : (
                  <span
                    className={`text-sm ${
                      step.completed
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                )}
              </BreadcrumbItem>
              {index < steps.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {bookingId && (
        <p className="text-xs text-muted-foreground mt-2">
          Booking ID: {bookingId}
        </p>
      )}
    </div>
  );
};