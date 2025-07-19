
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Car, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditView } from "@/components/profile/ProfileEditView";
import { RoleEditView } from "@/components/profile/RoleEditView";
import { ProfileAccountTab } from "@/components/profile/tabs/ProfileAccountTab";
import { ProfileVehicleTab } from "@/components/profile/tabs/ProfileVehicleTab";
import { ProfileSupportTab } from "@/components/profile/tabs/ProfileSupportTab";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileTabsViewProps {
  fullName: string;
  avatarUrl: string | null;
  setAvatarUrl: (url: string) => void;
  initialFormValues: { full_name: string };
  role: string;
  latitude: number;
  longitude: number;
}

export const ProfileTabsView = ({
  fullName,
  avatarUrl,
  setAvatarUrl,
  initialFormValues,
  role,
  latitude,
  longitude
}: ProfileTabsViewProps) => {
  const [activeView, setActiveView] = useState<'tabs' | 'profile' | 'role'>('tabs');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSwitchRole = () => {
    setActiveView('role');
  };

  const avatarPublicUrl = avatarUrl 
    ? supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl 
    : null;

  const switchRoleText = role === 'host' ? 'Switch to Renter' : 'Switch to Host';
  const RoleIcon = role === 'host' ? Car : Users;
  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

  if (activeView === 'profile') {
    return (
      <ProfileEditView 
        avatarUrl={avatarUrl}
        setAvatarUrl={setAvatarUrl}
        initialFormValues={initialFormValues}
        onBack={() => setActiveView('tabs')}
      />
    );
  }

  if (activeView === 'role') {
    return (
      <RoleEditView
        latitude={latitude}
        longitude={longitude}
        onBack={() => setActiveView('tabs')}
      />
    );
  }

  return (
    <>
      {/* Enhanced Floating Role Switch Button */}
      <div className="fixed bottom-[96px] left-0 right-0 z-50 flex justify-center px-4">
        <Button 
          type="button"
          onClick={handleSwitchRole}
          className="shadow-lg rounded-full px-6 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transform hover:scale-105"
          size="lg"
          aria-label={switchRoleText}
          title={switchRoleText}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-1">
              <RoleIcon className="h-4 w-4" />
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <span className="font-medium">{switchRoleText}</span>
          </div>
        </Button>
      </div>

      <div className="w-full px-4 pb-20">
        {/* Header with Avatar and Tabs Row */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl text-left font-semibold text-foreground mb-4">
            {roleCapitalized} Settings
          </h1>
          
          <div className="flex items-center gap-4 border-b border-border pb-4">
            {/* Avatar Section */}
            <button
              type="button"
              onClick={() => setActiveView('profile')}
              className="flex items-center gap-3 hover:bg-accent/70 rounded-lg p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              aria-label="View and edit profile"
            >
              <Avatar className="h-12 w-12 bg-[#2B2B2B] text-white">
                <AvatarImage 
                  src={avatarPublicUrl || undefined}
                  alt="Profile" 
                />
                <AvatarFallback className="text-sm font-medium">
                  {fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[15px] font-medium">{fullName?.split(' ')[0]}</span>
                <span className="text-[13px] text-muted-foreground">Edit profile</span>
              </div>
            </button>

            {/* Tabs Selector - Only show on larger screens or when needed */}
            <div className="flex-1 flex justify-end">
              <Tabs defaultValue="vehicle" className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="vehicle" className="text-xs">Vehicle</TabsTrigger>
                  <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
                  <TabsTrigger value="support" className="text-xs">Support</TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="vehicle" className="mt-0">
                    <ProfileVehicleTab role={role} />
                  </TabsContent>
                  
                  <TabsContent value="account" className="mt-0">
                    <ProfileAccountTab />
                  </TabsContent>
                  
                  <TabsContent value="support" className="mt-0">
                    <ProfileSupportTab />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
