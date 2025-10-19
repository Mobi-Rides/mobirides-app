import { Phone, User, Heart, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FullProfileData } from "@/hooks/useFullProfile";
import { useState } from "react";

interface EmergencyContactSectionProps {
  profile: FullProfileData;
}

export const EmergencyContactSection = ({ profile }: EmergencyContactSectionProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const maskText = (text: string | undefined, visibleChars: number = 0) => {
    if (!text) return "Not provided";
    if (showDetails) return text;
    return "*".repeat(text.length - visibleChars) + (visibleChars > 0 ? text.slice(-visibleChars) : "");
  };

  const maskPhone = (phone: string | undefined) => {
    if (!phone) return "Not provided";
    if (showDetails) return phone;
    return `**** *** ${phone.slice(-3)}`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Emergency Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <User className="w-4 h-4" />
            Name
          </label>
          <p className="text-sm text-foreground font-mono">
            {maskText(profile.emergencyContact?.name, 0)}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4" />
            Relationship
          </label>
          <p className="text-sm text-foreground font-mono">
            {maskText(profile.emergencyContact?.relationship, 0)}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4" />
            Phone
          </label>
          <p className="text-sm text-foreground font-mono">
            {maskPhone(profile.emergencyContact?.phoneNumber)}
          </p>
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>

        <div className="bg-muted/50 rounded-lg p-3 mt-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your emergency contact information is private and only visible to you. 
            It may be shared in case of emergencies.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
