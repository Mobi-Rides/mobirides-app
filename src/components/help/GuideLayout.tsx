/**
 * Reusable layout wrapper for guide/help section pages.
 * 
 * @author Modisa Maphanyane
 * @ticket MOB-310
 */

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuideLayoutProps {
  title: string;
  readTime?: string;
  backPath: string;
  isLoading?: boolean;
  error?: boolean;
  errorMessage?: string;
  children: React.ReactNode;
}

export const GuideLayout = ({
  title,
  readTime,
  backPath,
  isLoading,
  error,
  errorMessage,
  children,
}: GuideLayoutProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading help content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">
            {errorMessage || "Something went wrong"}
          </h1>
          <p className="text-muted-foreground">
            Failed to load help content. Please try again.
          </p>
          <Button onClick={() => navigate(backPath)}>Back to Help Center</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card p-4 sticky top-0 z-10 shadow-sm border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backPath)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            {readTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{readTime}</span>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="p-4 space-y-6">{children}</main>
    </div>
  );
};
