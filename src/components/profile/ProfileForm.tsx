import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { ExtendedProfile } from "@/utils/profileTypes";

// Form values interface
interface ProfileFormValues {
  full_name: string;
  phone_number?: string;
}

interface ProfileFormProps {
  initialValues: ProfileFormValues;
}

export const ProfileForm = ({ initialValues }: ProfileFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const form = useForm<ProfileFormValues>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    const fetchPhoneNumber = async () => {
      console.log("Fetching phone number...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session:", session);
      
      if (session?.user) {
        // First try to get from user metadata
        const { data: { user } } = await supabase.auth.getUser();
        console.log("User metadata:", user?.user_metadata);
        
        if (user?.user_metadata?.unverified_phone) {
          console.log("Found phone number in metadata:", user.user_metadata.unverified_phone);
          setPhoneNumber(user.user_metadata.unverified_phone);
          return;
        }

        // If not in metadata, try to get from profiles table
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const profile = data as ExtendedProfile | null;

        if (!profileError && profile?.phone_number) {
          console.log("Found phone number in profiles:", profile.phone_number);
          setPhoneNumber(profile.phone_number);
          
          // Update metadata to sync it
          await supabase.auth.updateUser({
            data: {
              unverified_phone: profile.phone_number
            }
          });
        } else {
          console.log("No phone number found in either location");
        }
      } else {
        console.log("No session found");
      }
    };
    
    fetchPhoneNumber();
  }, []);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      const updateData = {
        full_name: values.full_name,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);

      if (error) throw error;

      console.log("Profile updated successfully");
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          
          {phoneNumber && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>Phone: {phoneNumber}</span>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};
