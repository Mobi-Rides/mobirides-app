
import React from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookingPageLayoutProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

export const BookingPageLayout = ({ title, children, isLoading = false }: BookingPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 space-y-4">
        <div className="px-4 py-4 mb-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl text-left font-semibold">
            {title}
          </h1>
        </div>
        <div className="px-4">
          {children}
        </div>
      </div>
      <Navigation />
    </div>
  );
};
