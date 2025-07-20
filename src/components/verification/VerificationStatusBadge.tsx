
/**
 * Verification Status Badge Component
 * Shows user's verification status in the UI
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VerificationStatusBadgeProps {
  showText?: boolean;
  variant?: "badge" | "button";
  size?: "sm" | "md" | "lg";
}

/**
 * Component to display verification status
 */
export const VerificationStatusBadge: React.FC<
  VerificationStatusBadgeProps
> = ({ showText = true, variant = "badge", size = "md" }) => {
  const { isVerified, isLoading, verificationData } = useVerificationStatus();
  const navigate = useNavigate();

  /**
   * Handle click to start or continue verification
   */
  const handleClick = () => {
    navigate("/verification");
  };

  /**
   * Get status content based on verification state
   */
  const getStatusContent = () => {
    if (isLoading) {
      return {
        icon: <Clock className="h-3 w-3" />,
        text: "Checking...",
        variant: "outline" as const,
        clickable: false,
      };
    }

    if (isVerified) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Verified",
        variant: "secondary" as const,
        className: "bg-green-100 text-green-700 border-green-200",
        clickable: false,
      };
    }

    if (
      verificationData &&
      verificationData.overall_status === "pending_review"
    ) {
      return {
        icon: <Clock className="h-3 w-3" />,
        text: "Under Review",
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-700 border-blue-200",
        clickable: true,
      };
    }

    if (verificationData && verificationData.current_step) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        text: "In Progress",
        variant: "secondary" as const,
        className: "bg-orange-100 text-orange-700 border-orange-200",
        clickable: true,
      };
    }

    return {
      icon: <Shield className="h-3 w-3" />,
      text: "Not Verified",
      variant: "outline" as const,
      className: "border-orange-300 text-orange-600 hover:bg-orange-50",
      clickable: true,
    };
  };

  const status = getStatusContent();

  if (variant === "button" && status.clickable) {
    return (
      <Button
        variant="outline"
        size={size === "md" ? "default" : size}
        onClick={handleClick}
        className={`flex items-center space-x-2 ${status.className || ""}`}
      >
        {status.icon}
        {showText && <span>{status.text}</span>}
      </Button>
    );
  }

  return (
    <Badge
      variant={status.variant}
      className={`flex items-center space-x-1 cursor-pointer ${status.className || ""}`}
      onClick={status.clickable ? handleClick : undefined}
    >
      {status.icon}
      {showText && <span>{status.text}</span>}
    </Badge>
  );
};
