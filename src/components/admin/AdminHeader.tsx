import React from "react";
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/users": "User Management",
  "/admin/cars": "Car Management",
  "/admin/bookings": "Booking Management",
  "/admin/transactions": "Transaction Ledger",
  "/admin/verifications": "Verification Management",
  "/admin/messages": "Message Management",
  "/admin/settings": "Admin Settings",
};

export const AdminHeader = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const currentTitle = routeTitles[location.pathname] || "Admin Panel";

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold">{currentTitle}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};