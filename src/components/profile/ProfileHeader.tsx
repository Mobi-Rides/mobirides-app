import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const ProfileHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="flex gap-2">
          <Link to="/bookings">
            <Button variant="outline" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              My Bookings
            </Button>
          </Link>
          <Button variant="destructive" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};