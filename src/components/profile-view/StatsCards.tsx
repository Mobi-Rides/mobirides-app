import { CheckCircle2, FileText, TrendingUp } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";

interface StatsCardsProps {
  profile: FullProfileData;
}

export const StatsCards = ({ profile }: StatsCardsProps) => {
  const completedSteps = Object.values(profile.verificationSteps).filter(Boolean).length;
  const totalSteps = Object.keys(profile.verificationSteps).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
      {/* Verification Steps */}
      <div className="bg-accent/50 rounded-lg p-3 border border-accent">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Verification Steps</span>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {completedSteps}/{totalSteps}
        </p>
      </div>

      {/* Documents */}
      <div className="bg-accent/50 rounded-lg p-3 border border-accent">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <FileText className="w-4 h-4" />
          <span>Documents</span>
        </div>
        <p className="text-2xl font-bold text-foreground">3</p>
      </div>

      {/* Completion */}
      <div className="bg-accent/50 rounded-lg p-3 border border-accent col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <TrendingUp className="w-4 h-4" />
          <span>Completion</span>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {profile.verificationProgress}%
        </p>
      </div>
    </div>
  );
};
