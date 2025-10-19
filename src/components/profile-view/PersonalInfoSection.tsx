import { User, Calendar, CreditCard, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullProfileData } from "@/hooks/useFullProfile";
import { EditableField } from "./EditableField";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PersonalInfoSectionProps {
  profile: FullProfileData;
}

export const PersonalInfoSection = ({ profile }: PersonalInfoSectionProps) => {
  const { toast } = useToast();

  const handleSave = async (field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const maskNationalId = (id: string | undefined) => {
    if (!id) return "Not provided";
    return `****${id.slice(-4)}`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <EditableField
          label="Full Name"
          value={profile.full_name || ""}
          onSave={(value) => handleSave('full_name', value)}
          icon={<User className="w-4 h-4" />}
        />

        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4" />
            Date of Birth
          </label>
          <p className="text-sm text-foreground">
            {profile.dateOfBirth || "Not provided"}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4" />
            National ID
          </label>
          <p className="text-sm text-foreground font-mono">
            {maskNationalId(profile.nationalIdNumber)}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <p className="text-sm text-foreground">
            {profile.email}
          </p>
        </div>

        <EditableField
          label="Phone"
          value={profile.phone_number || ""}
          onSave={(value) => handleSave('phone_number', value)}
          icon={<Phone className="w-4 h-4" />}
        />
      </CardContent>
    </Card>
  );
};
