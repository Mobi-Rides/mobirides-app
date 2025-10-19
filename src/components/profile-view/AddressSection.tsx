import { MapPin, Map, Copy, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FullProfileData } from "@/hooks/useFullProfile";
import { EditableField } from "./EditableField";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddressSectionProps {
  profile: FullProfileData;
}

export const AddressSection = ({ profile }: AddressSectionProps) => {
  const { toast } = useToast();

  const handleSave = async (field: string, value: string) => {
    try {
      const currentPersonalInfo = profile.address || {};
      const updatedAddress = { ...currentPersonalInfo, [field]: value };

      const { data: verification } = await supabase
        .from('user_verifications')
        .select('personal_info')
        .eq('user_id', profile.id)
        .single();

      const personalInfo = verification?.personal_info as any || {};
      
      const { error } = await supabase
        .from('user_verifications')
        .update({ 
          personal_info: { ...personalInfo, address: updatedAddress }
        })
        .eq('user_id', profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    const address = `${profile.address?.street || ''}, ${profile.address?.area || ''}, ${profile.address?.city || ''}, ${profile.address?.postalCode || ''}`;
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Address
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <EditableField
          label="Street"
          value={profile.address?.street || ""}
          onSave={(value) => handleSave('street', value)}
          icon={<MapPin className="w-4 h-4" />}
        />

        <EditableField
          label="Area"
          value={profile.address?.area || ""}
          onSave={(value) => handleSave('area', value)}
          icon={<MapPin className="w-4 h-4" />}
        />

        <div>
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <Search className="w-4 h-4" />
            City/Village/Town
          </label>
          <EditableField
            label=""
            value={profile.address?.city || ""}
            onSave={(value) => handleSave('city', value)}
            showLabel={false}
          />
        </div>

        <EditableField
          label="Postal Code"
          value={profile.address?.postalCode || ""}
          onSave={(value) => handleSave('postalCode', value)}
          icon={<MapPin className="w-4 h-4" />}
        />

        <div className="pt-2">
          <Button variant="outline" className="w-full" size="sm" onClick={copyAddress}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
