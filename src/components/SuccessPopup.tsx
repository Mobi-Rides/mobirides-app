import { useState, useEffect } from "react";
import { X, CheckCircle, Car, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessPopupProps {
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number; // in milliseconds, default 5000 (5 seconds)
}

export const SuccessPopup = ({ 
  isVisible, 
  onClose, 
  autoCloseDelay = 5000 
}: SuccessPopupProps) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoCloseDelay / 1000));

  useEffect(() => {
    if (!isVisible) return;

    // Auto-close timer
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(autoCloseTimer);
      clearInterval(countdownInterval);
    };
  }, [isVisible, autoCloseDelay, onClose]);

  // Reset countdown when popup becomes visible
  useEffect(() => {
    if (isVisible) {
      setCountdown(Math.ceil(autoCloseDelay / 1000));
    }
  }, [isVisible, autoCloseDelay]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Verification Complete!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Welcome to Mobirides
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account has been successfully verified! You can now:
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Car className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>Browse and book available cars</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Enjoy secure and trusted transactions</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span>Access 24/7 customer support</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Auto-closing in {countdown}s
                </span>
                <Button onClick={onClose} size="sm">
                  Start Exploring
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};