import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileErrorProps {
  error: string | Error | unknown;
}

const formatError = (error: string | Error | unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unexpected error occurred";
};

export const ProfileError = ({ error }: ProfileErrorProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive">
        <AlertDescription>{formatError(error)}</AlertDescription>
      </Alert>
      <Navigation />
    </div>
  );
};
