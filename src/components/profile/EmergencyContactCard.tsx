import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, User, Eye, EyeOff } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { maskEmergencyName, maskPhone, maskRelationship } from "@/utils/privacyMasking";

interface EmergencyContactCardProps {
  profile: FullProfileData;
}

export const EmergencyContactCard = ({ profile }: EmergencyContactCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!profile.emergencyContact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No emergency contact provided
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="gap-2"
          >
            {showDetails ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Details
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            Name
          </p>
          <p className="text-sm font-medium mt-1">
            {showDetails
              ? profile.emergencyContact.name
              : maskEmergencyName(profile.emergencyContact.name)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Relationship</p>
          <p className="text-sm font-medium mt-1">
            {showDetails
              ? profile.emergencyContact.relationship
              : maskRelationship(profile.emergencyContact.relationship)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Phone Number
          </p>
          <p className="text-sm font-medium mt-1 font-mono">
            {showDetails
              ? profile.emergencyContact.phoneNumber
              : maskPhone(profile.emergencyContact.phoneNumber)}
          </p>
        </div>

        {!showDetails && (
          <p className="text-xs text-muted-foreground italic">
            Contact details are masked for privacy
          </p>
        )}
      </CardContent>
    </Card>
  );
};
