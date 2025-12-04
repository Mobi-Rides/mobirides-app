import { useEffect, useState } from "react";
import { listUserRoles, assignUserRole } from "@/services/superAdminService";

export const useSuperAdminRoles = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listUserRoles().then((d) => { setRoles(d); setLoading(false); });
  }, []);

  const assign = async (userId: string, role: "admin" | "host" | "renter" | "super_admin") => {
    setLoading(true);
    await assignUserRole(userId, role);
    const d = await listUserRoles();
    setRoles(d);
    setLoading(false);
  };

  return { roles, loading, assign };
};

