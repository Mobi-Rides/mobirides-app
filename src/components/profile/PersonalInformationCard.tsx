import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Calendar, CreditCard, Mail, Phone, Shield, Pencil } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { maskNationalId } from "@/utils/privacyMasking";
import { useToast } from "@/hooks/use-toast";

interface PersonalInformationCardProps {
  profile: FullProfileData;
}

export const PersonalInformationCard = ({ profile }: PersonalInformationCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.full_name || '');
  const { toast } = useToast();

  const handleSave = () => {
    // TODO: Implement save functionality
    toast({
      title: "Changes saved",
      description: "Your profile has been updated"
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </div>
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden md:inline">Edit</span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            Full Name
          </Label>
          {isEditing ? (
            <Input 
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-sm"
            />
          ) : (
            <p className="text-sm font-medium">
              {profile.full_name || 'Not provided'}
            </p>
          )}
        </div>

        {profile.dateOfBirth && (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              Date of Birth
            </Label>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{profile.dateOfBirth}</p>
              <span className="text-xs text-muted-foreground">YYYY-MM-DD</span>
            </div>
          </div>
        )}

        {profile.nationalIdNumber && (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              National ID
            </Label>
            <div className="space-y-1">
              <p className="text-sm font-medium font-mono">
                {maskNationalId(profile.nationalIdNumber)}
              </p>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Masked for privacy
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            Email
          </Label>
          <p className="text-sm font-medium">{profile.email}</p>
        </div>

        {profile.phone_number && (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              Phone
            </Label>
            <p className="text-sm font-medium">{profile.phone_number}</p>
          </div>
        )}

        {isEditing && (
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
