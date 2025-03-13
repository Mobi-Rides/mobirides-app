import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type LocationSharingScope = "none" | "trip_only" | "all";

export const OnlineStatusToggle = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [sharingScope, setSharingScope] =
    useState<LocationSharingScope>("none");

  useEffect(() => {
    const loadOnlineStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if car has location data (indicating online status)
      const { data: cars } = await supabase
        .from("cars")
        .select("latitude, longitude")
        .eq("owner_id", user.id)
        .not("latitude", "is", null);

      if (cars && cars.length > 0) {
        setIsOnline(true);
      }

      // Since is_sharing_location column might not exist yet,
      // we'll use a safer approach to check if the column exists first
      try {
        // First check if the column exists
        const { error: columnCheckError } = await supabase.rpc(
          "check_column_exists",
          {
            table_name: "cars",
            column_name: "is_sharing_location",
          }
        );

        if (!columnCheckError) {
          const { data: locationSettings } = await supabase
            .from("cars")
            .select("is_sharing_location, location_sharing_scope")
            .eq("owner_id", user.id)
            .single();

          if (locationSettings?.is_sharing_location) {
            const scope = locationSettings.location_sharing_scope || "all";
            setSharingScope(scope as LocationSharingScope);
          }
        } else {
          console.log("Location sharing columns not available yet");
        }
      } catch (error) {
        console.log("Could not retrieve location sharing settings:", error);
      }
    };

    loadOnlineStatus();

    // Create function to check column existence for Supabase
    const createColumnCheckFunction = async () => {
      const { error } = await supabase.rpc("create_check_column_function");
      if (error) console.error("Error creating column check function:", error);
    };

    createColumnCheckFunction();
  }, []);

  const handleToggle = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !isOnline;

      if (newStatus) {
        // Enable tracking
        setIsOnline(true);
        toast.success("Location tracking enabled");
      } else {
        setSharingScope("none");
        // Clear location data from cars
        const { data: cars } = await supabase
          .from("cars")
          .select("id")
          .eq("owner_id", user.id);

        if (cars) {
          for (const car of cars) {
            const updateData: any = {
              latitude: null,
              longitude: null,
              updated_at: new Date().toISOString(),
            };

            // Check if we have location sharing columns
            try {
              const { error: columnCheckError } = await supabase.rpc(
                "check_column_exists",
                {
                  table_name: "cars",
                  column_name: "is_sharing_location",
                }
              );

              if (!columnCheckError) {
                updateData.is_sharing_location = false;
                updateData.location_sharing_scope = "none";
              }
            } catch (error) {
              console.log(
                "Could not check for location sharing columns:",
                error
              );
            }

            await supabase.from("cars").update(updateData).eq("id", car.id);
          }
        }
        setIsOnline(false);
        toast.success("Location tracking disabled");
      }
    } catch (error) {
      console.error("Error updating online status:", error);
      toast.error("Failed to update tracking status");
    }
  };

  const handleSharingChange = async (value: string) => {
    try {
      const newScope = value as LocationSharingScope;
      setSharingScope(newScope);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if we have location sharing columns before updating
      try {
        const { error: columnCheckError } = await supabase.rpc(
          "check_column_exists",
          {
            table_name: "cars",
            column_name: "is_sharing_location",
          }
        );

        if (!columnCheckError) {
          // Update cars table with sharing settings
          const { data: cars } = await supabase
            .from("cars")
            .select("id")
            .eq("owner_id", user.id);

          if (cars) {
            for (const car of cars) {
              await supabase
                .from("cars")
                .update({
                  is_sharing_location: newScope !== "none",
                  location_sharing_scope: newScope,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", car.id);
            }
          }

          toast.success(`Location sharing set to: ${newScope}`);
        } else {
          toast.info("Location sharing feature not available yet");
        }
      } catch (error) {
        console.error("Error updating location sharing:", error);
        toast.error("Could not update sharing settings");
      }
    } catch (error) {
      console.error("Error updating sharing scope:", error);
      toast.error("Failed to update sharing settings");
    }
  };

  return (
    <div
      className="space-y-4 py-4"
      style={{ position: "absolute", backgroundColor: "red", zIndex: 10 }}
    >
      <div className="flex items-center space-x-4">
        <Switch
          id="online-mode"
          checked={isOnline}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="online-mode">
          {isOnline
            ? "Online - Location tracking enabled"
            : "Offline - Location tracking disabled"}
        </Label>
      </div>

      {isOnline && (
        <div className="border rounded-md p-4 bg-muted/20">
          <div className="mb-2">
            <Label htmlFor="sharing-scope">Location sharing settings</Label>
          </div>
          <Select value={sharingScope} onValueChange={handleSharingChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sharing settings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Don't share my location</SelectItem>
              <SelectItem value="trip_only">Share only during trips</SelectItem>
              <SelectItem value="all">Share my location always</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            {sharingScope === "none"
              ? "Your location will not be shared with anyone."
              : sharingScope === "trip_only"
              ? "Your location will only be shared with renters during active trips."
              : "Your location will be publicly visible to all app users."}
          </p>
        </div>
      )}
    </div>
  );
};
