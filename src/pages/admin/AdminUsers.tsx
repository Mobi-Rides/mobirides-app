import React, { useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { AdvancedUserManagement } from "@/components/admin/AdvancedUserManagement";
import { SuperAdminUserRoles } from "@/pages/SuperAdminUserRoles";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { CapabilityAssignment } from "@/components/admin/superadmin/CapabilityAssignment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, UserCheck, Wrench } from "lucide-react";

const AdminUsers = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserForCapabilities, setSelectedUserForCapabilities] = useState<{id: string, name: string} | null>(null);

  // Unified selection handlers
  const handleUserSelect = useCallback((userId: string, selected: boolean) => {
    setSelectedUsers(prev => 
      selected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  }, []);

  const handleSelectAll = useCallback((userIds: string[], selected: boolean) => {
    setSelectedUsers(prev => {
      if (selected) {
        const newIds = userIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      } else {
        return prev.filter(id => !userIds.includes(id));
      }
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6 pb-24">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, roles, and account status with advanced administrative controls
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Advanced
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="capabilities" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Capabilities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <UserManagementTable 
                selectedUsers={selectedUsers}
                onUserSelect={handleUserSelect}
                onSelectAll={handleSelectAll}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <AdvancedUserManagement />
            </TabsContent>

            <TabsContent value="roles" className="mt-6">
              <SuperAdminUserRoles 
                onSelectUserForCapabilities={(u) => setSelectedUserForCapabilities(u)}
                onSelectionChange={(ids) => setSelectedUsers(ids)}
              />
            </TabsContent>

            <TabsContent value="capabilities" className="mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a user from the Roles tab to manage their capabilities.
                </p>
                <CapabilityAssignment 
                  userId={selectedUserForCapabilities?.id}
                  userName={selectedUserForCapabilities?.name}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Bulk Action Bar */}
        <BulkActionBar 
          selectedUsers={selectedUsers}
          onClearSelection={handleClearSelection}
        />
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminUsers;
