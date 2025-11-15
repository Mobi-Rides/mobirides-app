import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";

/**
 * ReverificationFloatingPopup Component
 * A dismissible floating bubble that notifies users of the need to re-verify
 */
export const ReverificationFloatingPopup: React.FC = () => {
  const { verificationData, isLoading } = useVerificationStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has dismissed this popup in current session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('reverification_popup_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Show popup if user needs reverification and hasn't dismissed it
    if (!isLoading && 
        verificationData?.overall_status === 'requires_reverification' && 
        !isDismissed) {
      // Small delay for smooth entrance
      setTimeout(() => setIsVisible(true), 500);
    } else {
      setIsVisible(false);
    }
  }, [verificationData, isLoading, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal for current session
    sessionStorage.setItem('reverification_popup_dismissed', 'true');
  };

  if (!isVisible || isLoading) {
    return null;
  }

  return (
    <Card 
      className="fixed bottom-24 right-4 z-50 max-w-sm shadow-2xl border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/40 animate-in slide-in-from-bottom-5 duration-500"
    >
      <div className="p-4 relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="pr-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded-full bg-orange-500/20 p-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                Verification Update Required
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                MobiRides has streamlined the verification process to just <strong>3 steps</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              asChild 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
            >
              <Link to="/verification">Start Now</Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDismiss}
              className="border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReverificationFloatingPopup;
