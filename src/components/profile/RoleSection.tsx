
import { RoleSelector } from "@/components/RoleSelector";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const RoleSection = () => {
  return (
    <div className="mb-8 space-y-4">
      <h2 className="text-lg font-semibold mb-4">Select Your Role</h2>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Renter:</strong> Book and rent cars from hosts.
          <br />
          <strong>Host:</strong> List your cars and earn money from rentals. You need to list at least one car to become a host.
        </AlertDescription>
      </Alert>
      
      <RoleSelector />
    </div>
  );
};
