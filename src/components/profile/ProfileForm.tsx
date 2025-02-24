
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Phone } from "lucide-react";

interface ProfileFormValues {
  full_name: string;
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

  // Fetch phone number when component mounts
  useState(() => {
    const fetchPhoneNumber = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone_number')
          .eq('id', session.user.id)
          .single();
        
        if (!error && data) {
          setPhoneNumber(data.phone_number);
        }
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

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: values.full_name })
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
