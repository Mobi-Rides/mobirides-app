import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

export const ProfileHeader = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Link to="/bookings">
        <Button variant="outline" className="gap-2">
          <CalendarDays className="h-4 w-4" />
          My Bookings
        </Button>
      </Link>
    </div>
  );
};