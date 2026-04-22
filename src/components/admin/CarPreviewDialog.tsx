import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Car } from "./CarManagementTable";

export interface CarPreviewDialogProps {
  car: Car | null;
  onClose: () => void;
}

export const CarPreviewDialog: React.FC<CarPreviewDialogProps> = ({ car, onClose }) => {
  return (
    <Dialog open={!!car} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Car Listing Preview</DialogTitle>
        </DialogHeader>
        {car ? (
          <div>
            <div><strong>{car.brand} {car.model} ({car.year})</strong></div>
            <div>Owner: {car.profiles?.full_name || "Unknown"}</div>
            <div>Location: {car.location}</div>
            <div>Price/Day: P{car.price_per_day}</div>
            <div>Status: {car.is_available ? "Available" : "Disabled"}</div>
            <div>Description: {car.description || "N/A"}</div>
            {car.image_url && <img src={car.image_url} alt="Car" style={{ maxWidth: 300, marginTop: 12 }} />}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
