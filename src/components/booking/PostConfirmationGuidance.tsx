import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, MapPin, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PostConfirmationGuidanceProps {
  userRole: 'host' | 'renter';
  startDate: string;
  startTime?: string;
  carName: string;
}

export const PostConfirmationGuidance = ({ 
  userRole, 
  startDate, 
  startTime,
  carName 
}: PostConfirmationGuidanceProps) => {
  const steps = userRole === 'host' ? [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: "Prepare Your Vehicle",
      description: `Clean your ${carName} inside and out. Check fluids, tire pressure, and ensure it's in perfect condition.`
    },
    {
      icon: <MapPin className="h-5 w-5 text-blue-600" />,
      title: "Fuel Up",
      description: "Fill the fuel tank completely before handover. This ensures a smooth start for your renter."
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      title: "Be Ready Early",
      description: `Arrive 15 minutes before ${startTime || '09:00'} on ${startDate} for a smooth handover process.`
    },
    {
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      title: "Documentation",
      description: "Have your vehicle registration and any relevant documents ready for the renter."
    }
  ] : [
    {
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      title: "Verify Your Documents",
      description: "Ensure your driver's license is valid and complete any required verification steps."
    },
    {
      icon: <Clock className="h-5 w-5 text-green-600" />,
      title: "Plan Your Pickup",
      description: `Arrive 15 minutes early on ${startDate} at ${startTime || '09:00'} for vehicle inspection.`
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-orange-600" />,
      title: "Inspect the Vehicle",
      description: `Thoroughly inspect the ${carName} and document any existing damage before driving.`
    },
    {
      icon: <MapPin className="h-5 w-5 text-purple-600" />,
      title: "Contact Information",
      description: "Save the host's contact information and familiarize yourself with the pickup location."
    }
  ];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          What's Next?
          <Badge variant="secondary" className="ml-auto">
            {userRole === 'host' ? 'For Host' : 'For Renter'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};