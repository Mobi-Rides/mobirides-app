import { RoleSelector } from "@/components/RoleSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import { useState } from "react";

const Profile = () => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Avatar</h2>
        <div className="flex items-center gap-4">
          {avatarUrl && (
            <img
              src={`${supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl}`}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
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

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Select Your Role</h2>
        <RoleSelector />
      </div>
    </div>
  );
};

export default Profile;