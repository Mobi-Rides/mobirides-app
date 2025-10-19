import { Upload, Shield, CheckCircle2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { StatsCards } from "./StatsCards";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileViewHeaderProps {
  profile: FullProfileData;
}

export const ProfileViewHeader = ({ profile }: ProfileViewHeaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Invalidate profile query to refetch data
      queryClient.invalidateQueries({ queryKey: ['fullProfile'] });

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = profile.avatar_url 
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      {/* Trust Badge - Desktop Only */}
      <div className="hidden md:flex justify-end mb-4">
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Shield className="w-3 h-3 mr-1" />
          Trust & Safety Profile
        </Badge>
      </div>

      {/* Main Header Content */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar Section */}
        <div className="relative flex-shrink-0">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            <img
              src={avatarUrl || "/placeholder.svg"}
              alt={profile.full_name || "User"}
              className="w-full h-full rounded-full object-cover border-4 border-border"
            />
            <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-success/10 text-success border-success/20 px-2 py-0.5">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {profile.role}
            </Badge>
          </div>
          
          <label
            htmlFor="avatar-upload"
            className={`absolute top-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Camera className="w-4 h-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {profile.full_name || "User"}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 text-muted-foreground">
            <span>{profile.email}</span>
            {profile.phone_number && (
              <>
                <span className="hidden md:inline">•</span>
                <span>{profile.phone_number}</span>
              </>
            )}
          </div>

          {/* Stats Cards */}
          <StatsCards profile={profile} />
        </div>
      </div>
    </div>
  );
};
