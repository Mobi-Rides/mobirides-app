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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(filePath);
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Avatar</h2>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage 
            src={avatarUrl ? `${supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl}` : undefined}
            alt="Profile Avatar" 
          />
          <AvatarFallback>👤</AvatarFallback>
        </Avatar>
        <Button 
          variant="outline" 
          disabled={uploading}
          className="relative"
        >
          <input
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Avatar'}
        </Button>
      </div>
    </div>
  );
};