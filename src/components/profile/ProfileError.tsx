import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileErrorProps {
  error: string;
}

export const ProfileError = ({ error }: ProfileErrorProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <Navigation />
    </div>
  );
};