import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutDashboard } from "lucide-react";

export const ProfileHeader = () => {
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
          <Link to="/dashboard">
            <Button className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};