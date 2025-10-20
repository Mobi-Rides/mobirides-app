import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Map, Copy } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { formatAddress } from "@/utils/privacyMasking";
import { useToast } from "@/hooks/use-toast";

interface AddressCardProps {
  profile: FullProfileData;
}

export const AddressCard = ({ profile }: AddressCardProps) => {
  const { toast } = useToast();

  const handleCopyAddress = () => {
    if (profile.address) {
      const formattedAddress = formatAddress(profile.address);
      navigator.clipboard.writeText(formattedAddress);
      toast({
        title: "Address copied",
        description: "Address has been copied to clipboard"
      });
    }
  };

  if (!profile.address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No address provided</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {profile.address.street && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Street</Label>
              <p className="text-sm font-medium">{profile.address.street}</p>
            </div>
          )}
          {profile.address.area && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Area</Label>
              <p className="text-sm font-medium">{profile.address.area}</p>
            </div>
          )}
          {profile.address.city && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1">City/Village/Town</Label>
              <p className="text-sm font-medium">{profile.address.city}</p>
            </div>
          )}
          {profile.address.postalCode && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Postal Code</Label>
              <p className="text-sm font-medium">{profile.address.postalCode}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden md:inline">View on</span> Map
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleCopyAddress}
          >
            <Copy className="h-4 w-4" />
            Copy<span className="hidden md:inline"> Address</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
