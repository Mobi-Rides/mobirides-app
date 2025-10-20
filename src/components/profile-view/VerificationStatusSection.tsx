import { Shield, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FullProfileData } from "@/hooks/useFullProfile";

interface VerificationStatusSectionProps {
  profile: FullProfileData;
}

export const VerificationStatusSection = ({ profile }: VerificationStatusSectionProps) => {
  const steps = [
    { key: 'personal_info', label: 'Personal Information', completed: profile.verificationSteps.personal_info },
    { key: 'documents', label: 'Documents Upload', completed: profile.verificationSteps.documents },
    { key: 'selfie', label: 'Selfie Verification', completed: profile.verificationSteps.selfie },
    { key: 'phone', label: 'Phone Verification', completed: profile.verificationSteps.phone },
    { key: 'address', label: 'Address Confirmation', completed: profile.verificationSteps.address },
  ];

  const completedSteps = steps.filter(s => s.completed).length;

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/30 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Verification Status
          </CardTitle>
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Overall Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-foreground">
              {completedSteps}/{steps.length} steps completed
            </span>
          </div>
          <Progress value={profile.verificationProgress} className="h-2" />
        </div>

        <div className="space-y-3 mt-4">
          {steps.map((step) => (
            <div key={step.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{step.label}</span>
              {step.completed ? (
                <Badge className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Done
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
