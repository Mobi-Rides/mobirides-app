
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UserRole = Database["public"]["Enums"]["user_role"];

export const RoleSelector = () => {
  const [role, setRole] = useState<UserRole>("renter");
  const [loading, setLoading] = useState(true);
  const [hasListedCar, setHasListedCar] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getInitialRole();
    checkListedCars();
  }, []);

  const getInitialRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Fetching initial role for user:", user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        console.log("User role found:", profile.role);
        setRole(profile.role);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching role:', error);
      setLoading(false);
    }
  };

  const checkListedCars = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Checking listed cars for user:", user.id);
      const { data: cars, error } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      if (error) throw error;

      const hasListed = cars && cars.length > 0;
      console.log("User has listed cars:", hasListed);
      setHasListedCar(hasListed);
    } catch (error) {
      console.error('Error checking listed cars:', error);
    }
  };

  const updateRole = async (newRole: UserRole) => {
    // Prevent switching to host if no car is listed
    if (newRole === "host" && !hasListedCar) {
      toast({
        title: "Cannot Switch to Host",
        description: "You need to list at least one car before becoming a host.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingRole(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Updating role to:", newRole);
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);

      if (error) throw error;

      setRole(newRole);
      toast({
        title: "Role Updated",
        description: `You are now a ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleListCarClick = () => {
    navigate("/add-car");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const canSwitchToHost = hasListedCar;
  const isHostTabDisabled = role === "renter" && !canSwitchToHost;

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <Tabs 
        value={role} 
        onValueChange={(value) => updateRole(value as UserRole)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="renter" disabled={isUpdatingRole}>
            Renter
          </TabsTrigger>
          <TabsTrigger 
            value="host" 
            disabled={isHostTabDisabled || isUpdatingRole}
            className={isHostTabDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            Host
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {!hasListedCar && (
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {role === "renter" 
              ? "List your first car to unlock host features" 
              : "You need at least one listed car to remain a host"
            }
          </p>
          <Button 
            onClick={handleListCarClick}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            List Your First Car
          </Button>
        </div>
      )}

      {hasListedCar && role === "renter" && (
        <div className="text-center">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✓ You can now switch to host mode
          </p>
        </div>
      )}
    </div>
  );
};
