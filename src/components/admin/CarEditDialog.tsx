import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  is_available: boolean;
  description?: string | null;
}

interface CarEditDialogProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CarEditDialog = ({ car, isOpen, onClose, onSuccess }: CarEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [brand, setBrand] = useState(car.brand);
  const [model, setModel] = useState(car.model);
  const [year, setYear] = useState(car.year);
  const [pricePerDay, setPricePerDay] = useState(car.price_per_day);
  const [location, setLocation] = useState(car.location);
  const [isAvailable, setIsAvailable] = useState(car.is_available);
  const [description, setDescription] = useState(car.description || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("cars")
        .update({
          brand: brand.trim(),
          model: model.trim(),
          year,
          price_per_day: pricePerDay,
          location: location.trim(),
          is_available: isAvailable,
          description: description.trim() || null,
        })
        .eq("id", car.id);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error("Error updating car:", error);
      toast.error("Failed to update car");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Car</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price/Day (P)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="available">Available for booking</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Car"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};