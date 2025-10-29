import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { AdvancedUserManagement } from "@/components/admin/AdvancedUserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users } from "lucide-react";

const AdminUsers = () => {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, roles, and account status with advanced administrative controls
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Basic Management
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Advanced Controls
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <UserManagementTable />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <AdvancedUserManagement />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminUsers;