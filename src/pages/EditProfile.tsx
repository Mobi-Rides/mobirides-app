// src/pages/EditProfile.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countryCodes from "@/constants/Countries";

interface ProfileData {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ProfileEditViewProps {
  profileData: ProfileData | null;
}

const ProfileEditView: React.FC<ProfileEditViewProps> = ({ profileData }) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profileData?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(profileData?.phone_number ? profileData.phone_number.slice(4) : "");
  const [countryCode, setCountryCode] = useState(profileData?.phone_number ? profileData.phone_number.slice(0, 4) : "+267");
  const [avatarUrl, setAvatarUrl] = useState(profileData?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || "");
      setPhoneNumber(profileData?.phone_number ? profileData.phone_number.slice(4) : "");
      setCountryCode(profileData?.phone_number ? profileData.phone_number.slice(0, 4) : "+267");
      setAvatarUrl(profileData.avatar_url || "");
    }
  }, [profileData]);

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/[^\d+]/g, "");
    return cleaned;
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      const formattedPhoneNumber = formatPhoneNumber(`${countryCode}${phoneNumber}`);

      const updates = {
        id: profileData?.id,
        full_name: fullName,
        phone_number: formattedPhoneNumber,
        updated_at: new Date().toISOString(),
        avatar_url: avatarUrl,
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${profileData?.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

      const updates = {
        id: profileData?.id,
        full_name: fullName,
        phone_number: formatPhoneNumber(`${countryCode}${phoneNumber}`),
        updated_at: new Date().toISOString(),
        avatar_url: filePath,
      };

      const { error: profileError } = await supabase.from("profiles").upsert(updates);

      if (profileError) {
        throw profileError;
      }

      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto mt-8 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Edit Profile</h2>

        {/* Avatar Section */}
        <div className="mb-4 flex flex-col items-center">
          <Avatar className="h-24 w-24 rounded-full overflow-hidden mb-2">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Avatar" />
            ) : (
              <AvatarFallback>
                {profileData?.full_name ? profileData.full_name[0].toUpperCase() : "👤"}
              </AvatarFallback>
            )}
          </Avatar>
          <Label htmlFor="avatar" className="cursor-pointer">
            {uploading ? "Uploading..." : "Change Avatar"}
            <Input
              type="file"
              id="avatar"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </Label>
        </div>

        {/* Full Name */}
        <div className="mb-4">
          <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </Label>
          <Input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 p-2 w-full border rounded-md"
          />
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </Label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map(({ code, country }) => (
                  <SelectItem key={code} value={code}>
                    {country} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              className="mt-1 p-2 w-full border rounded-md flex-1"
            />
          </div>
        </div>

        {/* Update Button */}
        <Button
          onClick={handleUpdateProfile}
          disabled={loading}
          className="w-full bg-primary text-white rounded-md p-2 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        >
          {loading ? "Updating..." : "Update Profile"}
        </Button>
      </div>
    </div>
  );
};

const EditProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error("User not found");
          toast.error("User not found. Please sign in.");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfileData(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to fetch profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <p>Loading profile...</p>
        </div>
      ) : (
        <ProfileEditView profileData={profileData} />
      )}
    </div>
  );
};

export default EditProfile;
