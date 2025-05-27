
import { useState, useEffect } from "react";
import { RoleSwitchModal } from "./RoleSwitchModal";
import { Info, ArrowRightLeft, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const RoleSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("renter");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentRole();
  }, []);

  const getCurrentRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        setCurrentRole(profile.role);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching role:', error);
      setLoading(false);
    }
  };

  const handleRoleUpdate = (newRole: UserRole) => {
    setCurrentRole(newRole);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center space-x-2">
                <span>Your Role</span>
                <Badge variant="secondary" className="capitalize">
                  {currentRole}
                </Badge>
              </CardTitle>
              <CardDescription>
                Choose how you want to use MobiRides. Switch anytime to explore different features.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-primary/20 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-foreground">
                  Currently active as: <span className="capitalize font-bold text-primary">{currentRole}</span>
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Renter:</strong> Browse and book cars from verified hosts in your area. Perfect for occasional trips and adventures.
                  </p>
                  <p>
                    <strong>Host:</strong> List your vehicles and earn money by renting them out to trusted renters. Turn your idle car into income.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 h-12 text-base font-medium"
              size="lg"
            >
              <ArrowRightLeft className="h-5 w-5 mr-2" />
              Switch Role
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 h-12 text-base"
              size="lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Explore Options
            </Button>
          </div>
        </CardContent>
      </Card>

      <RoleSwitchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentRole={currentRole}
        onRoleUpdate={handleRoleUpdate}
      />
    </div>
  );
};
