import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const RoleSelector = () => {
  const [role, setRole] = useState<UserRole>("renter");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getInitialRole();
  }, []);

  const getInitialRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        setRole(profile.role);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching role:', error);
      setLoading(false);
    }
  };

  const updateRole = async (newRole: UserRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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