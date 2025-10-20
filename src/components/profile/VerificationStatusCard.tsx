import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { StatusBadge } from "./StatusBadge";
import { useNavigate } from "react-router-dom";

interface VerificationStatusCardProps {
  profile: FullProfileData;
}

const STEP_LABELS = {
  personal_info: 'Personal Information',
  documents: 'Document Upload',
  selfie: 'Selfie Verification',
  phone: 'Phone Verification',
  address: 'Address Confirmation'
};

export const VerificationStatusCard = ({ profile }: VerificationStatusCardProps) => {
  const navigate = useNavigate();
  const isFullyVerified = profile.verificationStatus === 'completed';

  const getOverallStatus = (): 'verified' | 'pending' | 'not_started' => {
    if (profile.verificationStatus === 'completed') return 'verified';
    if (profile.verificationStatus === 'pending_review') return 'pending';
    if (profile.verificationProgress > 0) return 'pending';
    return 'not_started';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Verification Status</span>
          <StatusBadge status={getOverallStatus()} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{profile.verificationProgress}%</span>
          </div>
          <Progress value={profile.verificationProgress} className="h-2" />
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Verification Steps</p>
          {Object.entries(profile.verificationSteps).map(([key, completed]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {STEP_LABELS[key as keyof typeof STEP_LABELS]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {completed ? 'Done' : 'Pending'}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {!isFullyVerified && (
          <Button 
            className="w-full gap-2" 
            onClick={() => navigate('/verification')}
          >
            {profile.verificationProgress === 0
              ? 'Start Verification'
              : 'Continue Verification'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {isFullyVerified && (
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Your account is fully verified!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
