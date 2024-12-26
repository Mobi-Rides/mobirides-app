import { Button } from "@/components/ui/button";

interface CarActionsProps {
  onViewDetails: (e: React.MouseEvent) => void;
  onBookNow: (e: React.MouseEvent) => void;
}

export const CarActions = ({ onViewDetails, onBookNow }: CarActionsProps) => {
  return (
    <div className="mt-4 flex gap-2">
      <Button variant="outline" className="flex-1" onClick={onViewDetails}>
        View Details
      </Button>
      <Button className="flex-1" onClick={onBookNow}>
        Book Now
      </Button>
    </div>
  );
};