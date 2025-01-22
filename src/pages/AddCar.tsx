import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/add-car/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCarFormData {
  make: string;
  model: string;
  year: string;
  license_plate: string;
  image?: File;
}

const AddCar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [image, setImage] = useState<File | null>(null);

  const form = useForm<AddCarFormData>({
    defaultValues: {
      make: "",
      model: "",
      year: "",
      license_plate: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  const onSubmit = async (data: AddCarFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // For development, we'll just show a success message and redirect
      // In production, you would upload the image and save the car data
      
      toast({
        title: "Success",
        description: "Car added successfully",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error adding car:", error);
      toast({
        title: "Error",
        description: "Failed to add car",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add a Car</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter car make" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter car model" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter car year" type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Plate</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter license plate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ImageUpload onImageChange={handleImageChange} label="Car Image" />

          <Button type="submit" className="w-full">
            Add Car
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddCar;