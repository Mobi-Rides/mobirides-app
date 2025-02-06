import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Car,
  LogOut,
  UserCircle,
  Bell,
  BookOpen,
  Heart,
  FileText,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const More = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6">More</h1>
        
        <div className="space-y-4">
          <Link 
            to="/profile" 
            className="flex items-center p-4 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <UserCircle className="w-6 h-6 text-gray-500 mr-3" />
            <span>Profile</span>
          </Link>

          <Link 
            to="/add-car" 
            className="flex items-center p-4 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <Plus className="w-6 h-6 text-gray-500 mr-3" />
            <span>List Your Car</span>
          </Link>

          <Link 
            to="/bookings" 
            className="flex items-center p-4 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <BookOpen className="w-6 h-6 text-gray-500 mr-3" />
            <span>My Bookings</span>
          </Link>

          <Link 
            to="/saved-cars" 
            className="flex items-center p-4 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <Heart className="w-6 h-6 text-gray-500 mr-3" />
            <span>Saved Cars</span>
          </Link>

          <Link 
            to="/driver-license" 
            className="flex items-center p-4 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <FileText className="w-6 h-6 text-gray-500 mr-3" />
            <span>Driver License</span>
          </Link>

          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-start p-4 bg-white rounded-lg shadow hover:bg-gray-50"
            onClick={handleSignOut}
          >
            <LogOut className="w-6 h-6 text-gray-500 mr-3" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default More;