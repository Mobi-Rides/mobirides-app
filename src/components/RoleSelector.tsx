
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Car, Users, Check, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface RoleOption {
  value: UserRole;
  title: string;
  description: string;
  benefits: string[];
  icon: typeof Car | typeof Users;
  color: string;
  bgColor: string;
}

const roleOptions: RoleOption[] = [
  {
    value: "renter",
    title: "Renter",
    description: "Book and rent cars from trusted hosts",
    benefits: ["Browse available cars", "Book instantly", "Flexible rental periods", "24/7 support"],
    icon: Car,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    value: "host",
    title: "Host",
    description: "List your cars and earn money from rentals",
    benefits: ["Earn passive income", "Flexible hosting", "Insurance coverage", "Host community"],
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100 border-purple-200",
  },
];

export const RoleSelector = () => {
  const [role, setRole] = useState<UserRole>("renter");
  const [loading, setLoading] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getInitialRole();
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

  const updateRole = async (newRole: UserRole) => {
    if (newRole === role || isUpdatingRole) return;
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roleOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = role === option.value;
          const isDisabled = isUpdatingRole;
          
          return (
            <Card
              key={option.value}
              className={`
                relative cursor-pointer transition-all duration-200 transform hover:scale-[1.02]
                ${isSelected 
                  ? `ring-2 ring-primary ${option.bgColor.replace('hover:', '')}` 
                  : `${option.bgColor} hover:shadow-md`
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !isDisabled && updateRole(option.value)}
            >
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${option.bgColor.replace('hover:bg-', 'bg-').replace('border-', 'bg-').replace('-200', '-100')}`}>
                      <IconComponent className={`h-6 w-6 ${option.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {option.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center space-x-1 text-primary">
                      <Check className="h-5 w-5" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  )}
                  
                  {isUpdatingRole && role !== option.value && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {option.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full ${option.color.replace('text-', 'bg-')}`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                {!isSelected && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateRole(option.value);
                    }}
                  >
                    {isUpdatingRole ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Switching...
                      </>
                    ) : (
                      `Switch to ${option.title}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
