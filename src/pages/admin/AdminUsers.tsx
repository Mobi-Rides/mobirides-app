import React, { useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { UnifiedUserTable } from "@/components/admin/UnifiedUserTable";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

const AdminUsers = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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
              View and manage all users with full administrative controls
            </p>
          </div>

          <UnifiedUserTable 
            selectedUsers={selectedUsers}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAll}
          />
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
