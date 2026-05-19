import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyRow {
  month: string;         // "Jan 2025"
  monthKey: string;      // "2025-01" for sorting
  newUsers: number;
  renters: number;
  hosts: number;
  cumulative: number;
  momChange: number | null;
}

const fetchMonthlyUsers = async (): Promise<MonthlyRow[]> => {
  // Fetch all profiles paginated via SECURITY DEFINER RPC to bypass RLS and PostgREST limits
  let allProfiles: Array<{ created_at: string; role: string | null; full_name: string | null }> = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.rpc("get_monthly_user_growth", {
      limit_val: limit,
      offset_val: offset
    });

    if (error) {
      console.error(`Error fetching monthly user growth at offset ${offset}:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allProfiles = [...allProfiles, ...data];
      if (data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
  }

  // Filter out test and admin accounts client-side as requested
  const filteredProfiles = allProfiles.filter((row) => {
    const role = row.role || "";
    const name = row.full_name || "";
    const isTestOrAdmin =
      role.includes("admin") ||
      role.includes("super_admin") ||
      name.toLowerCase().includes("test") ||
      name.toLowerCase().includes("dummy") ||
      name.toLowerCase().includes("tester");
    return !isTestOrAdmin;
  });

  // Pre-populate all calendar months from Jan 2025 to the current month to eliminate data gaps
  const start = new Date(2025, 0, 1); // Jan 2025
  const end = new Date(); // Current date (May 2026)
  
  const monthMap: Record<string, { newUsers: number; renters: number; hosts: number }> = {};
  
  let current = startOfMonth(start);
  const stop = startOfMonth(end);
  
  while (current <= stop) {
    const key = format(current, "yyyy-MM");
    monthMap[key] = { newUsers: 0, renters: 0, hosts: 0 };
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  // Group real profiles into months
  filteredProfiles.forEach((row) => {
    const d = new Date(row.created_at);
    if (d < start) return; // Skip legacy profiles created before 2025
    
    const key = format(startOfMonth(d), "yyyy-MM");
    if (!monthMap[key]) {
      monthMap[key] = { newUsers: 0, renters: 0, hosts: 0 };
    }
    monthMap[key].newUsers += 1;
    if (row.role === "renter") monthMap[key].renters += 1;
    if (row.role === "host") monthMap[key].hosts += 1;
  });

  // Build sorted ascending list (oldest first) for cumulative calculation
  const sortedKeys = Object.keys(monthMap).sort();
  let running = 0;
  const rows: MonthlyRow[] = sortedKeys.map((key, idx) => {
    const m = monthMap[key];
    running += m.newUsers;
    const prevKey = sortedKeys[idx - 1];
    const momChange =
      prevKey != null ? m.newUsers - monthMap[prevKey].newUsers : null;

    const [year, month] = key.split("-");
    const label = format(new Date(Number(year), Number(month) - 1, 1), "MMM yyyy");

    return {
      month: label,
      monthKey: key,
      newUsers: m.newUsers,
      renters: m.renters,
      hosts: m.hosts,
      cumulative: running,
      momChange,
    };
  });

  // Return most-recent month first
  return rows.reverse();
};

const MoMBadge = ({ change }: { change: number | null }) => {
  if (change === null) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  if (change === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
        <Minus className="h-3 w-3" />0
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
        <TrendingUp className="h-3 w-3" />+{change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-destructive text-sm font-semibold">
      <TrendingDown className="h-3 w-3" />{change}
    </span>
  );
};

export const MonthlyUserGrowthTable = () => {
  const { data: rows, isLoading, isError } = useQuery({
    queryKey: ["monthly-user-growth"],
    queryFn: fetchMonthlyUsers,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const totalUsers = rows?.[0]?.cumulative ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Monthly User Growth
          </CardTitle>
          <CardDescription>
            Real sign-ups Jan 2025 to date — test &amp; admin accounts excluded
          </CardDescription>
        </div>
        {!isLoading && !isError && (
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">total real users</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading user data…
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-32 text-destructive text-sm">
            Failed to load user data.
          </div>
        )}
        {!isLoading && !isError && rows && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Month</TableHead>
                <TableHead className="text-right">New Users</TableHead>
                <TableHead className="text-right">Renters</TableHead>
                <TableHead className="text-right">Hosts</TableHead>
                <TableHead className="text-right">MoM Change</TableHead>
                <TableHead className="text-right pr-6">Cumulative</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.monthKey}>
                  <TableCell className="pl-6 font-medium">{row.month}</TableCell>
                  <TableCell className="text-right font-semibold">{row.newUsers}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.renters}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.hosts}</TableCell>
                  <TableCell className="text-right">
                    <MoMBadge change={row.momChange} />
                  </TableCell>
                  <TableCell className="text-right pr-6 font-semibold">{row.cumulative}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
