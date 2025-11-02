import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Upload, Shield } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileDisplayHeaderProps {
  profile: FullProfileData;
  onEditClick: () => void;
}

export const ProfileDisplayHeader = ({ profile, onEditClick }: ProfileDisplayHeaderProps) => {
  const completedSteps = Object.values(profile.verificationSteps).filter(Boolean).length;
  const totalSteps = Object.keys(profile.verificationSteps).length;

  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAvatarUrl = async () => {
      if (!profile.avatar_url) {
        if (isMounted) setAvatarDisplayUrl(null);
        return;
      }
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(profile.avatar_url, 3600);
        if (!error && data?.signedUrl) {
          if (isMounted) setAvatarDisplayUrl(data.signedUrl);
          return;
        }
        const publicUrl = supabase.storage
          .from('avatars')
          .getPublicUrl(profile.avatar_url).data.publicUrl;
        if (isMounted) setAvatarDisplayUrl(publicUrl || null);
      } catch (e) {
        const publicUrl = supabase.storage
          .from('avatars')
          .getPublicUrl(profile.avatar_url).data.publicUrl;
        if (isMounted) setAvatarDisplayUrl(publicUrl || null);
      }
    };
    loadAvatarUrl();
    return () => { isMounted = false; };
  }, [profile.avatar_url]);

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

      queryClient.invalidateQueries({ queryKey: ['fullProfile'] });

      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Trust & Safety Badge - Desktop Only */}
      <div className="hidden md:flex justify-end">
        <Badge variant="outline" className="gap-2 px-4 py-2">
          <Shield className="h-4 w-4" />
          Trust & Safety Profile
        </Badge>
      </div>

      {/* Shared hidden file input for both mobile and desktop */}
      <input
        id="profile-header-avatar-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
        disabled={uploading}
      />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarDisplayUrl || undefined} />
            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{profile.full_name}</h2>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.verificationStatus === 'completed' && (
            <Badge className="bg-green-500 gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => document.getElementById('profile-header-avatar-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarDisplayUrl || undefined} />
              <AvatarFallback className="text-xl">
                {profile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {profile.verificationStatus === 'completed' && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || 'User'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground capitalize">{profile.role}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                Member since {format(new Date(profile.created_at), 'MMM yyyy')}
              </span>
              {profile.phone_number && (
                <>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    Phone: {profile.phone_number}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile.verificationStatus === 'completed' && (
            <Badge className="bg-green-500 gap-1 px-3 py-1">
              <CheckCircle className="h-4 w-4" />
              Verified
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => document.getElementById('profile-header-avatar-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Avatar'}
          </Button>
        </div>
      </div>

      {/* Stats Cards - Desktop */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Verification Steps</p>
          <p className="text-3xl font-bold">{completedSteps}/{totalSteps}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Documents</p>
          <p className="text-3xl font-bold">
            {Object.values(profile.verificationSteps).filter(Boolean).length}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Completion</p>
          <p className="text-3xl font-bold">{profile.verificationProgress}%</p>
        </div>
      </div>

      {/* Stats Row - Mobile */}
      <div className="md:hidden bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{profile.full_name || 'User'}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>Member since {format(new Date(profile.created_at), 'MMM yyyy')}</span>
          {profile.phone_number && (
            <>
              <span>•</span>
              <span>Phone: {profile.phone_number}</span>
            </>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Verification Steps</p>
            <p className="text-xl font-bold">{completedSteps}/{totalSteps}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Documents</p>
            <p className="text-xl font-bold">
              {Object.values(profile.verificationSteps).filter(Boolean).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Completion</p>
            <p className="text-xl font-bold">{profile.verificationProgress}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
