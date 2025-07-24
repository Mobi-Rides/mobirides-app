import { useEffect, useState } from "react";
import { CheckCircle, Car } from "lucide-react";
import { Card } from "@/components/ui/card";

interface HandoverSuccessPopupProps {
  isHost: boolean;
  onClose: () => void;
  duration?: number;
}

export const HandoverSuccessPopup = ({ 
  isHost, 
  onClose, 
  duration = 3000 
}: HandoverSuccessPopupProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const message = isHost ? "See you soon!" : "Have a nice trip!";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <Card 
        className={`
          bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-primary/20 
          p-6 rounded-2xl transition-all duration-300 transform
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Car className="h-8 w-8 text-primary" />
            <CheckCircle className="h-4 w-4 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Handover Complete!
            </h3>
            <p className="text-muted-foreground">
              {message}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};