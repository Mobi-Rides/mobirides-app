import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="px-4 py-4 mb-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl md:text-2xl text-left font-semibold">
          Dashboard
        </h1>
      </div>

    </div>
  );
};