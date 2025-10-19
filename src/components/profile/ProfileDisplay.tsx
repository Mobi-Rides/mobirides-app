import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFullProfile } from "@/hooks/useFullProfile";
import { ProfileDisplayHeader } from "./ProfileDisplayHeader";
import { PersonalInformationCard } from "./PersonalInformationCard";
import { AddressCard } from "./AddressCard";
import { EmergencyContactCard } from "./EmergencyContactCard";
import { VerificationStatusCard } from "./VerificationStatusCard";
import { ProfileLoading } from "./ProfileLoading";

interface ProfileDisplayProps {
  onBack: () => void;
  onEditClick: () => void;
}

export const ProfileDisplay = ({ onBack, onEditClick }: ProfileDisplayProps) => {
  const { data: profile, isLoading, error } = useFullProfile();

  if (isLoading) return <ProfileLoading />;

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load profile</p>
        <Button onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Profile Header */}
      <ProfileDisplayHeader profile={profile} onEditClick={onEditClick} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <PersonalInformationCard profile={profile} />
          <AddressCard profile={profile} />
          <EmergencyContactCard profile={profile} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <VerificationStatusCard profile={profile} />
        </div>
      </div>
    </div>
  );
};
