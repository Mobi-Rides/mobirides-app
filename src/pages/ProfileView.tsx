import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileViewHeader } from "@/components/profile-view/ProfileViewHeader";
import { ActionButtons } from "@/components/profile-view/ActionButtons";
import { PersonalInfoSection } from "@/components/profile-view/PersonalInfoSection";
import { AddressSection } from "@/components/profile-view/AddressSection";
import { EmergencyContactSection } from "@/components/profile-view/EmergencyContactSection";
import { VerificationStatusSection } from "@/components/profile-view/VerificationStatusSection";
import { DocumentsSection } from "@/components/profile-view/DocumentsSection";
import { useFullProfile } from "@/hooks/useFullProfile";
import { Loader2 } from "lucide-react";

const ProfileView = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useFullProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6 max-w-7xl">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <ProfileViewHeader profile={profile} />

        {/* Action Buttons */}
        <ActionButtons />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <PersonalInfoSection profile={profile} />
          <AddressSection profile={profile} />
          <EmergencyContactSection profile={profile} />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <VerificationStatusSection profile={profile} />
          <DocumentsSection userId={profile.id} />
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
