
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";

interface ProfileEditViewProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string) => void;
  initialFormValues: { full_name: string };
  onBack: () => void;
  onSuccess?: () => void;
}

export const ProfileEditView = ({
  avatarUrl,
  setAvatarUrl,
  initialFormValues,
  onBack,
  onSuccess
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

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
        <ProfileAvatar avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
      </div>

      <ProfileForm initialValues={initialFormValues} onSuccess={onSuccess} />
    </>
  );
};
