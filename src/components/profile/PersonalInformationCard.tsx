import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Calendar, CreditCard, Mail, Phone, Shield } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { maskNationalId } from "@/utils/privacyMasking";

interface PersonalInformationCardProps {
  profile: FullProfileData;
}

export const PersonalInformationCard = ({ profile }: PersonalInformationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            Full Name
          </Label>
          <p className="text-sm font-medium mt-1">
            {profile.full_name || 'Not provided'}
          </p>
        </div>

        {profile.dateOfBirth && (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date of Birth
            </Label>
            <p className="text-sm font-medium mt-1">{profile.dateOfBirth}</p>
          </div>
        )}

        {profile.nationalIdNumber && (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              National ID Number
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-medium font-mono">
                {maskNationalId(profile.nationalIdNumber)}
              </p>
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Masked for privacy
              </span>
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Email Address
          </Label>
          <p className="text-sm font-medium mt-1">{profile.email}</p>
        </div>

        {profile.phone_number && (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Phone Number
            </Label>
            <p className="text-sm font-medium mt-1">{profile.phone_number}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
