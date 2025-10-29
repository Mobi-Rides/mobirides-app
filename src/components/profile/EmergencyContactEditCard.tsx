import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, User, Save, X, Pencil } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContactEditCardProps {
  profile: FullProfileData;
  onSave: (contact: EmergencyContactForm) => Promise<void>;
}

interface EmergencyContactForm {
  name: string;
  relationship: string;
  phoneNumber: string;
}

const RELATIONSHIPS = [
  "Spouse", "Parent", "Child", "Sibling", "Friend", 
  "Colleague", "Neighbor", "Other"
];

export const EmergencyContactEditCard = ({ 
  profile, 
  onSave 
}: EmergencyContactEditCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EmergencyContactForm>({
    name: profile.emergencyContact?.name || '',
    relationship: profile.emergencyContact?.relationship || '',
    phoneNumber: profile.emergencyContact?.phoneNumber || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const validatePhoneNumber = (phone: string): boolean => {
    // Botswana phone number validation
    const phoneRegex = /^\+?267[0-9]{8}$|^0[0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.relationship || !formData.phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Botswana phone number",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      await onSave(formData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Emergency contact updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update emergency contact",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.emergencyContact?.name || '',
      relationship: profile.emergencyContact?.relationship || '',
      phoneNumber: profile.emergencyContact?.phoneNumber || ''
    });
    setIsEditing(false);
  };

  // Display component for read-only mode
  const EmergencyContactDisplay = ({ profile }: { profile: FullProfileData }) => {
    if (!profile.emergencyContact) {
      return (
        <p className="text-sm text-muted-foreground">
          No emergency contact provided
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            Name
          </p>
          <p className="text-sm font-medium mt-1">
            {profile.emergencyContact.name}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Relationship</p>
          <p className="text-sm font-medium mt-1">
            {profile.emergencyContact.relationship}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Phone Number
          </p>
          <p className="text-sm font-medium mt-1 font-mono">
            {profile.emergencyContact.phoneNumber}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </div>
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter contact name"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Relationship</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((relationship) => (
                    <SelectItem key={relationship} value={relationship}>
                      {relationship}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Phone Number</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+267xxxxxxxxx or 0xxxxxxxxx"
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
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
                    Save
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
          </>
        ) : (
          <EmergencyContactDisplay profile={profile} />
        )}
      </CardContent>
    </Card>
  );
};