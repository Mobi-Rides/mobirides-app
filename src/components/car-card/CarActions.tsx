import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

interface CarActionsProps {
  onViewDetails: (e: React.MouseEvent) => void;
  onBookNow: (e: React.MouseEvent) => void;
  isAuthenticated?: boolean;
}

export const CarActions = ({ onViewDetails, onBookNow, isAuthenticated = true }: CarActionsProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => setIsAuthModalOpen(true)}>
            Sign in to book
          </Button>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultTab="signin"
        />
      </>
    );
  }

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