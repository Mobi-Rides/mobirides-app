
import { Button } from "@/components/ui/button";
import { RoleSection } from "@/components/profile/RoleSection";
import { OnlineStatusToggle } from "@/components/profile/OnlineStatusToggle";

interface RoleEditViewProps {
  latitude: number;
  longitude: number;
  onBack: () => void;
}

export const RoleEditView = ({ latitude, longitude, onBack }: RoleEditViewProps) => {
  return (
    <>
      <Button 
        variant="ghost"
        onClick={onBack}
        className="mb-6"
      >
        ← Back to Settings
      </Button>
      
      <RoleSection />
      <div className="mt-6">
        <OnlineStatusToggle lat={latitude} long={longitude} />
      </div>
    </>
  );
};
