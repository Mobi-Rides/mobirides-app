import { useSuperAdminAnalytics } from "@/hooks/useSuperAdminAnalytics";
import { AnalyticsCharts } from "@/components/admin/superadmin/AnalyticsCharts";
import { SecurityMonitor } from "@/components/admin/superadmin/SecurityMonitor";

export default function SuperAdminAnalytics() {
  const { analytics, events, loading } = useSuperAdminAnalytics();
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Analytics</h2>
      {loading ? (
        <div className="text-sm">Loading...</div>
      ) : (
        <>
          <AnalyticsCharts data={analytics} />
          <SecurityMonitor events={events} />
        </>
      )}
    </div>
  );
}

