
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Car, Users, Check, Loader2, ArrowRightLeft, Sparkles, TrendingUp, Shield } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleUpdate: (newRole: UserRole) => void;
}

interface RoleOption {
  value: UserRole;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  features: string[];
  icon: typeof Car | typeof Users;
  color: string;
  bgGradient: string;
  badgeColor: string;
}

const roleOptions: RoleOption[] = [
  {
    value: "renter",
    title: "Renter",
    subtitle: "Explore & Book Cars",
    description: "Discover amazing vehicles from trusted hosts in your area. Book instantly and enjoy flexible rental periods.",
    benefits: [
      "Browse thousands of verified cars",
      "Instant booking confirmation",
      "Flexible rental periods",
      "24/7 customer support",
      "Insurance coverage included"
    ],
    features: [
      "Save favorite cars",
      "Rate and review hosts",
      "Real-time availability",
      "Secure payments"
    ],
    icon: Car,
    color: "text-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
    badgeColor: "bg-blue-100 text-blue-700"
  },
  {
    value: "host",
    title: "Host",
    subtitle: "Share & Earn",
    description: "Turn your idle car into a money-making asset. List your vehicle and start earning passive income today.",
    benefits: [
      "Earn up to $500+ per month",
      "Comprehensive insurance coverage",
      "Verified renter community",
      "Flexible hosting schedule",
      "Host protection guarantee"
    ],
    features: [
      "Smart pricing suggestions",
      "Automated availability",
      "Instant messaging",
      "Performance analytics"
    ],
    icon: Users,
    color: "text-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
    badgeColor: "bg-purple-100 text-purple-700"
  },
];

export const RoleSwitchModal = ({ isOpen, onClose, currentRole, onRoleUpdate }: RoleSwitchModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateRole = async (newRole: UserRole) => {
    if (newRole === currentRole || isUpdating) return;
    
    try {
      setIsUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Updating role to:", newRole);
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);

      if (error) throw error;

      onRoleUpdate(newRole);
      toast({
        title: "Role Updated Successfully! 🎉",
        description: `Welcome to your new ${newRole} experience. You can switch back anytime.`,
      });
      onClose();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-center space-x-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-bold text-center">
              Switch Your Role
            </DialogTitle>
          </div>
          <DialogDescription className="text-center text-lg">
            Choose how you want to experience MobiRides. You can switch between roles anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roleOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = currentRole === option.value;
            const isOtherRole = currentRole !== option.value;
            
            return (
              <Card
                key={option.value}
                className={`
                  relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02] cursor-pointer
                  ${isSelected 
                    ? `ring-2 ring-primary bg-gradient-to-br ${option.bgGradient}` 
                    : `hover:shadow-lg bg-gradient-to-br ${option.bgGradient} hover:shadow-xl`
                  }
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isUpdating && updateRole(option.value)}
              >
                <CardContent className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                        <IconComponent className={`h-8 w-8 ${option.color}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground flex items-center space-x-2">
                          <span>{option.title}</span>
                          {isSelected && (
                            <Badge className={`${option.badgeColor} text-xs`}>
                              Current
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground">
                          {option.subtitle}
                        </p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center space-x-1 text-primary">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>

                  {/* Key Benefits */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Key Benefits</h4>
                    </div>
                    <ul className="space-y-2">
                      {option.benefits.slice(0, 3).map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${option.color.replace('text-', 'bg-')}`} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Features</h4>
                    </div>
                    <ul className="space-y-2">
                      {option.features.slice(0, 2).map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${option.color.replace('text-', 'bg-')}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {isOtherRole && (
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="w-full mt-4"
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateRole(option.value);
                      }}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Switching...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Switch to {option.title}
                        </>
                      )}
                    </Button>
                  )}

                  {isSelected && (
                    <div className="flex items-center justify-center space-x-2 text-primary text-sm font-medium">
                      <Shield className="h-4 w-4" />
                      <span>You're currently a {option.title}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            You can switch between roles anytime from your profile settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
