
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="py-2 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Dashboard
        </h1>
      </div>
      <ThemeToggle />
    </div>
  );
};
