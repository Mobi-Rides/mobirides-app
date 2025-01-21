import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const RoleSelector = () => {
  const [role, setRole] = useState<UserRole>("renter");
  const [loading, setLoading] = useState(true);
  const [hasListedCar, setHasListedCar] = useState(false);
  const { toast } = useToast();

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
    try {
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
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasListedCar && role === "renter") {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <p className="text-sm text-gray-600">
          List a car to unlock host features
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <Tabs value={role} onValueChange={(value) => updateRole(value as UserRole)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="renter">Renter</TabsTrigger>
          <TabsTrigger value="host">Host</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};