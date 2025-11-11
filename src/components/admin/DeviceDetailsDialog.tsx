import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Monitor, Globe, Smartphone } from "lucide-react";

interface DeviceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ipAddress: string | null;
  userAgent: string | null;
  locationData: {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    isp?: string;
    org?: string;
    lat?: number;
    lon?: number;
  } | null;
  deviceInfo: {
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  } | null;
}

const DeviceDetailsDialog: React.FC<DeviceDetailsDialogProps> = ({
  isOpen,
  onClose,
  ipAddress,
  userAgent,
  locationData,
  deviceInfo,
}) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Device & Location Details
          </DialogTitle>
          <DialogDescription>
            Technical details about the device and location for this audit event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Information */}
          {deviceInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getDeviceIcon(deviceInfo.deviceType)}
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Device Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getDeviceIcon(deviceInfo.deviceType)}
                      <Badge variant="outline" className="capitalize">
                        {deviceInfo.deviceType}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Operating System</Label>
                    <p className="text-sm mt-1">{deviceInfo.os} {deviceInfo.osVersion}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Browser</Label>
                    <p className="text-sm mt-1">{deviceInfo.browser} {deviceInfo.browserVersion}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">User Agent</Label>
                    <p className="text-xs font-mono mt-1 break-all bg-muted p-2 rounded">
                      {userAgent || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          {locationData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">IP Address</Label>
                    <p className="text-sm font-mono mt-1">{ipAddress || locationData.ip || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm mt-1">
                      {locationData.city && locationData.region
                        ? `${locationData.city}, ${locationData.region}`
                        : locationData.city || locationData.region || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Country</Label>
                    <p className="text-sm mt-1">
                      {locationData.country}
                      {locationData.countryCode && ` (${locationData.countryCode})`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Timezone</Label>
                    <p className="text-sm mt-1">{locationData.timezone || "N/A"}</p>
                  </div>
                  {locationData.isp && (
                    <div>
                      <Label className="text-sm font-medium">ISP</Label>
                      <p className="text-sm mt-1">{locationData.isp}</p>
                    </div>
                  )}
                  {locationData.org && (
                    <div>
                      <Label className="text-sm font-medium">Organization</Label>
                      <p className="text-sm mt-1">{locationData.org}</p>
                    </div>
                  )}
                  {(locationData.lat && locationData.lon) && (
                    <div>
                      <Label className="text-sm font-medium">Coordinates</Label>
                      <p className="text-sm font-mono mt-1">
                        {locationData.lat.toFixed(4)}, {locationData.lon.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback for missing data */}
          {!deviceInfo && !locationData && (
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No device or location information available for this audit event.
                </p>
                {ipAddress && (
                  <p className="text-sm font-mono mt-2">
                    IP Address: {ipAddress}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsDialog;
