import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-2">
          {profile.address.street && (
            <div>
              <p className="text-xs text-muted-foreground">Street</p>
              <p className="text-sm font-medium">{profile.address.street}</p>
            </div>
          )}
          {profile.address.area && (
            <div>
              <p className="text-xs text-muted-foreground">Area</p>
              <p className="text-sm font-medium">{profile.address.area}</p>
            </div>
          )}
          {profile.address.city && (
            <div>
              <p className="text-xs text-muted-foreground">City/Village/Town</p>
              <p className="text-sm font-medium">{profile.address.city}</p>
            </div>
          )}
          {profile.address.postalCode && (
            <div>
              <p className="text-xs text-muted-foreground">Postal Code</p>
              <p className="text-sm font-medium">{profile.address.postalCode}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <Map className="h-4 w-4" />
            View on Map
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={handleCopyAddress}
          >
            <Copy className="h-4 w-4" />
            Copy Address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
