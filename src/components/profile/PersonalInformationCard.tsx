import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Calendar, CreditCard, Mail, Phone, Shield, Pencil, Save, X } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { maskNationalId } from "@/utils/privacyMasking";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PersonalInformationCardProps {
  profile: FullProfileData;
}

export const PersonalInformationCard = ({ profile }: PersonalInformationCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    full_name: profile.full_name || '',
    dateOfBirth: profile.dateOfBirth || '',
    nationalIdNumber: profile.nationalIdNumber || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateDateOfBirth = (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    const dateObj = new Date(date);
    const now = new Date();
    const age = now.getFullYear() - dateObj.getFullYear();
    return age >= 18 && age <= 100;
  };

  const validateNationalId = (id: string): boolean => {
    // Botswana national ID validation (9-11 digits)
    const idRegex = /^\d{9,11}$/;
    return idRegex.test(id);
  };

  const handleSave = async () => {
    // Validate inputs
    if (!validateDateOfBirth(editedData.dateOfBirth)) {
      toast({
        title: "Invalid Date of Birth",
        description: "Please enter a valid date in YYYY-MM-DD format",
        variant: "destructive"
      });
      return;
    }

    if (!validateNationalId(editedData.nationalIdNumber)) {
      toast({
        title: "Invalid National ID",
        description: "Please enter a valid 9-11 digit national ID",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Unauthorized");

      // Update profiles table (full_name only here)
      const profileUpdates: any = {};
      if (editedData.full_name !== undefined) profileUpdates.full_name = editedData.full_name;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);
        if (profileError) throw new Error(profileError.message);
      }

      // Prepare verification info updates
      const verificationUpdates: any = {};
      if (editedData.dateOfBirth !== undefined) verificationUpdates.dateOfBirth = editedData.dateOfBirth;
      if (editedData.nationalIdNumber !== undefined) verificationUpdates.nationalIdNumber = editedData.nationalIdNumber;

      if (Object.keys(verificationUpdates).length > 0) {
        const { data: existingVerification, error: selectError } = await supabase
          .from('user_verifications')
          .select('id, personal_info')
          .eq('user_id', user.id)
          .maybeSingle();
        if (selectError) throw new Error(selectError.message);

        if (!existingVerification) {
          const { error: insertVerificationError } = await supabase
            .from('user_verifications')
            .insert({
              user_id: user.id,
              personal_info: verificationUpdates
            });
          if (insertVerificationError) throw new Error(insertVerificationError.message);
        } else {
          const currentPersonalInfo = (existingVerification as any)?.personal_info || {};
          const updatedPersonalInfo = { ...currentPersonalInfo, ...verificationUpdates };

          const { error: verificationError } = await supabase
            .from('user_verifications')
            .update({ personal_info: updatedPersonalInfo })
            .eq('user_id', user.id);
          if (verificationError) throw new Error(verificationError.message);
        }
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      setIsEditing(false);
      // Trigger profile refetch
      queryClient.invalidateQueries({ queryKey: ['fullProfile'] });

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      full_name: profile.full_name || '',
      dateOfBirth: profile.dateOfBirth || '',
      nationalIdNumber: profile.nationalIdNumber || ''
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
              value={editedData.full_name}
              onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
              className="text-sm"
              placeholder="Enter your full name"
            />
          ) : (
            <p className="text-sm font-medium">
              {profile.full_name || 'Not provided'}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            Date of Birth
          </Label>
          {isEditing ? (
            <Input
              type="date"
              value={editedData.dateOfBirth}
              onChange={(e) => setEditedData({ ...editedData, dateOfBirth: e.target.value })}
              className="text-sm"
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {profile.dateOfBirth || 'Not provided'}
              </p>
              {profile.dateOfBirth && (
                <span className="text-xs text-muted-foreground">YYYY-MM-DD</span>
              )}
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            National ID
          </Label>
          {isEditing ? (
            <Input
              value={editedData.nationalIdNumber}
              onChange={(e) => setEditedData({ ...editedData, nationalIdNumber: e.target.value })}
              className="text-sm"
              placeholder="Enter your 9-11 digit national ID"
              maxLength={11}
            />
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium font-mono">
                {profile.nationalIdNumber ? maskNationalId(profile.nationalIdNumber) : 'Not provided'}
              </p>
              {profile.nationalIdNumber && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Masked for privacy
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

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
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
