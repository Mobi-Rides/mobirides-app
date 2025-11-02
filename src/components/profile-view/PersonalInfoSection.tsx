import { User, Calendar, CreditCard, Mail, Phone, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullProfileData } from "@/hooks/useFullProfile";
import { EditableField } from "./EditableField";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PersonalInfoSectionProps {
  profile: FullProfileData;
}

export const PersonalInfoSection = ({ profile }: PersonalInfoSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for editing DOB and National ID
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [dobValue, setDobValue] = useState(profile.dateOfBirth || "");
  const [dobError, setDobError] = useState<string | null>(null);

  const [isEditingId, setIsEditingId] = useState(false);
  const [idValue, setIdValue] = useState(profile.nationalIdNumber || "");
  const [idError, setIdError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDobValue(profile.dateOfBirth || "");
    setIdValue(profile.nationalIdNumber || "");
  }, [profile.dateOfBirth, profile.nationalIdNumber]);

  const validateDOB = (dob: string) => {
    if (!dob) return "Date of birth is required";
    // Expect YYYY-MM-DD
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) return "Use format YYYY-MM-DD";
    const birth = new Date(dob + "T00:00:00");
    if (isNaN(birth.getTime())) return "Invalid date";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 18) return "You must be at least 18";
    if (age > 100) return "Age must be under 100";
    return null;
  };

  const validateNationalId = (id: string) => {
    if (!id) return "National ID is required";
    const digitsOnly = id.replace(/\D/g, "");
    if (digitsOnly.length < 9 || digitsOnly.length > 11) return "ID must be 9-11 digits";
    return null;
  };

  const maskNationalId = (id: string | undefined) => {
    if (!id) return "Not provided";
    return `****${id.slice(-4)}`;
  };

  const handleSaveProfileField = async (field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const saveVerificationPersonalInfo = async (updates: any) => {
    // Merge into user_verifications.personal_info
    const { data: verification } = await supabase
      .from('user_verifications')
      .select('personal_info')
      .eq('user_id', profile.id)
      .maybeSingle();

    const personalInfo = (verification?.personal_info as any) || {};
    const updatedPersonalInfo = { ...personalInfo, ...updates };

    if (verification) {
      const { error } = await supabase
        .from('user_verifications')
        .update({ personal_info: updatedPersonalInfo })
        .eq('user_id', profile.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_verifications')
        .insert({ user_id: profile.id, personal_info: updatedPersonalInfo, user_role: profile.role });
      if (error) throw error;
    }
  };

  const handleSaveDob = async () => {
    const err = validateDOB(dobValue);
    setDobError(err);
    if (err) return;

    setIsSaving(true);
    try {
      await saveVerificationPersonalInfo({ dateOfBirth: dobValue });
      queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
      toast({ title: "Success", description: "Date of birth updated" });
      setIsEditingDob(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveId = async () => {
    const err = validateNationalId(idValue);
    setIdError(err);
    if (err) return;

    setIsSaving(true);
    try {
      await saveVerificationPersonalInfo({ nationalIdNumber: idValue });
      queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
      toast({ title: "Success", description: "National ID updated" });
      setIsEditingId(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
        {/* Full name editable in profiles */}
        <EditableField
          label="Full Name"
          value={profile.full_name || ""}
          onSave={(value) => handleSaveProfileField('full_name', value)}
          icon={<User className="w-4 h-4" />}
        />

        {/* Date of Birth editable in verification.personal_info */}
        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4" />
            Date of Birth
          </label>
          {isEditingDob ? (
            <div className="space-y-2">
              <Input
                type="date"
                value={dobValue}
                onChange={(e) => setDobValue(e.target.value)}
                disabled={isSaving}
              />
              {dobError && (
                <p className="text-xs text-destructive">{dobError}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveDob} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setIsEditingDob(false); setDobValue(profile.dateOfBirth || ""); setDobError(null); }}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <p className="text-sm text-foreground">{profile.dateOfBirth || "Not provided"}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingDob(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* National ID editable in verification.personal_info */}
        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4" />
            National ID
          </label>
          {isEditingId ? (
            <div className="space-y-2">
              <Input
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                disabled={isSaving}
                placeholder="Enter 9-11 digit ID"
              />
              {idError && (
                <p className="text-xs text-destructive">{idError}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveId} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setIsEditingId(false); setIdValue(profile.nationalIdNumber || ""); setIdError(null); }}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <p className="text-sm text-foreground font-mono">{maskNationalId(profile.nationalIdNumber)}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingId(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit
              </Button>
            </div>
          )}
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
          onSave={(value) => handleSaveProfileField('phone_number', value)}
          icon={<Phone className="w-4 h-4" />}
        />
      </CardContent>
    </Card>
  );
};
