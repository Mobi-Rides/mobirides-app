
import { BarLoader } from "react-spinners";

export const LoadingView = ({ message = "Loading your profile..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
      <p className="text-sm text-muted-foreground mb-3">
        {message}
      </p>
      <BarLoader color="#7c3aed" width={100} />
    </div>
  );
};
