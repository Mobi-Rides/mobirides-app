import { useSuperAdminRoles } from "@/hooks/useSuperAdminRoles";
import { BulkUserActions } from "@/components/admin/superadmin/BulkUserActions";
import { CapabilityAssignment } from "@/components/admin/superadmin/CapabilityAssignment";

export default function SuperAdminUserRoles() {
  const { roles, loading, assign } = useSuperAdminRoles();
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">User Roles</h2>
      <BulkUserActions onAssign={(role) => { /* placeholder bulk */ }} />
      <CapabilityAssignment onAdd={() => { /* placeholder */ }} />
      {loading ? (
        <div className="text-sm">Loading...</div>
      ) : (
        <div className="grid gap-2">
          {roles.map((r) => (
            <div key={r.user_id} className="flex justify-between border rounded-md p-2">
              <span className="text-sm">{r.user_id}</span>
              <span className="text-sm font-medium">{r.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

