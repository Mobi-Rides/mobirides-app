import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { BookingManagementTable } from "@/components/admin/BookingManagementTable";

const AdminBookings = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Booking Management</h1>
            <p className="text-muted-foreground">
              Monitor all bookings, manage disputes, and track rental activity
            </p>
          </div>
          <BookingManagementTable />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminBookings;