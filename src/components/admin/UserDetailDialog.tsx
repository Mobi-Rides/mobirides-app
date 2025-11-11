import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserOverviewTab } from "./user-tabs/UserOverviewTab";
import { UserBookingsTab } from "./user-tabs/UserBookingsTab";
import { UserTransactionsTab } from "./user-tabs/UserTransactionsTab";
import { UserVerificationTab } from "./user-tabs/UserVerificationTab";
import { UserAdminTab } from "./user-tabs/UserAdminTab";
import { UserActivityTab } from "./user-tabs/UserActivityTab";
import { UserRestrictionsTab } from "./user-tabs/UserRestrictionsTab";

interface Profile {
  id: string;
  full_name: string | null;
  role: "renter" | "host" | "admin";
  phone_number: string | null;
  created_at: string;
  avatar_url: string | null;
  email?: string;
}

interface UserDetailDialogProps {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate?: () => void;
}

export const UserDetailDialog = ({ user, isOpen, onClose, onUserUpdate }: UserDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {user.full_name || "Unnamed User"} - User Profile
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto max-h-[70vh] mt-4">
            <TabsContent value="overview" className="mt-0">
              <UserOverviewTab user={user} onUpdate={onUserUpdate} />
            </TabsContent>

            <TabsContent value="restrictions" className="mt-0">
              <UserRestrictionsTab user={user} onUpdate={onUserUpdate} />
            </TabsContent>

            <TabsContent value="bookings" className="mt-0">
              <UserBookingsTab userId={user.id} />
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-0">
              <UserTransactionsTab userId={user.id} />
            </TabsContent>
            
            <TabsContent value="verification" className="mt-0">
              <UserVerificationTab userId={user.id} />
            </TabsContent>
            
            <TabsContent value="admin" className="mt-0">
              <UserAdminTab user={user} onUpdate={onUserUpdate} />
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0">
              <UserActivityTab userId={user.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};