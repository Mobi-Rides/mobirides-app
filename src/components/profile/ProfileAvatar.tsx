
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import { useState } from "react";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string) => void;
}

export const ProfileAvatar = ({ avatarUrl, setAvatarUrl }: ProfileAvatarProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user found');

      console.log("Uploading avatar...");
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      console.log("Avatar uploaded, updating profile...");
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setAvatarUrl(filePath);
      console.log("Avatar update complete");
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const avatarPublicUrl = avatarUrl 
    ? supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl 
    : null;

  return (
    <div className="relative">
      <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
        <AvatarImage 
          src={avatarPublicUrl || undefined}
          alt="Profile Avatar" 
        />
        <AvatarFallback className="text-2xl">👤</AvatarFallback>
      </Avatar>
      <Button 
        size="sm"
        variant="outline" 
        disabled={uploading}
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs px-3 py-1"
      >
        <input
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <Upload className="w-3 h-3 mr-1" />
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  );
};
