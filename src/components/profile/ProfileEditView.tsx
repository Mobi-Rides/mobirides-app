
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";

interface ProfileEditViewProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string) => void;
  initialFormValues: { full_name: string };
  onBack: () => void;
}

export const ProfileEditView = ({ 
  avatarUrl, 
  setAvatarUrl, 
  initialFormValues,
  onBack
}: ProfileEditViewProps) => {
  return (
    <>
      <Button 
        variant="ghost"
        onClick={onBack}
        className="mb-6"
      >
        ← Back to Settings
      </Button>
      
      <ProfileAvatar avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
      <ProfileForm initialValues={initialFormValues} />
    </>
  );
};
