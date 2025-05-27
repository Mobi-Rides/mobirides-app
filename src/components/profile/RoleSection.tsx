
import { RoleSelector } from "@/components/RoleSelector";
import { Info, ArrowRightLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const RoleSection = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Choose Your Role</CardTitle>
          </div>
          <CardDescription>
            Select how you want to use MobiRides. You can switch between roles anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Renter:</strong> Browse and book cars from verified hosts in your area.
                </p>
                <p>
                  <strong>Host:</strong> List your vehicles and earn money by renting them out to trusted renters.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          <RoleSelector />
        </CardContent>
      </Card>
    </div>
  );
};
