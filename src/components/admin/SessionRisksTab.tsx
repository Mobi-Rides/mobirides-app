// src/components/admin/SessionRisksTab.tsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import { toast } from "sonner";

interface SessionAnomaly {
  id: string;
  user_id: string;
  risk_type: "impossible_travel" | "concurrent_countries" | "brute_force";
  confidence: "low" | "medium" | "high";
  details: Record<string, unknown>;
  status: "pending" | "reviewed" | "auto_suspended" | "dismissed";
  auto_suspend_after: string | null;
  created_at: string;
  profiles: Array<{ email: string; role: string }> | { email: string; role: string } | null;
}

function formatCountdown(autoSuspendAfter: string): string {
  const totalMinutes = differenceInMinutes(new Date(autoSuspendAfter), new Date());
  if (totalMinutes <= 0) return "Imminent";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function RiskTypeBadge({ type }: { type: SessionAnomaly["risk_type"] }) {
  const label = {
    impossible_travel: "Impossible Travel",
    concurrent_countries: "Concurrent Countries",
    brute_force: "Brute Force",
  }[type];

  return (
    <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-xs whitespace-nowrap">
      {label}
    </Badge>
  );
}

function ConfidenceBadge({ confidence }: { confidence: SessionAnomaly["confidence"] }) {
  const classes = {
    high: "bg-red-600 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-gray-400 text-white",
  }[confidence];

  return (
    <Badge className={`${classes} text-xs uppercase`}>{confidence}</Badge>
  );
}

function AnomalyDetails({ anomaly }: { anomaly: SessionAnomaly }) {
  const d = anomaly.details;
  if (anomaly.risk_type === "impossible_travel") {
    return (
      <span className="text-xs text-muted-foreground">
        {String(d.from_country)} → {String(d.to_country)}<br />
        {String(d.distance_km)} km in {String(d.time_diff_minutes)} min
      </span>
    );
  }
  if (anomaly.risk_type === "concurrent_countries") {
    const countries = (d.countries as string[]).join(" + ");
    return (
      <span className="text-xs text-muted-foreground">
        {countries}<br />
        within {String(d.window_hours)}h window
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {String(d.failed_attempts)} failed attempts in {String(d.window_minutes)} min
    </span>
  );
}

export function SessionRisksTab() {
  const queryClient = useQueryClient();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { data: anomalies = [], isLoading, error: queryError } = useQuery<SessionAnomaly[]>({
    queryKey: ["session_anomalies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_anomalies")
        .select(`
          id, user_id, risk_type, confidence, details, status,
          auto_suspend_after, created_at,
          profiles!inner(email, role)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as SessionAnomaly[];
    },
    refetchInterval: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ anomalyId, verdict }: { anomalyId: string; verdict: "suspend" | "dismiss" }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const res = await fetch(`${supabaseUrl}/functions/v1/session-monitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "update_anomaly", anomaly_id: anomalyId, verdict }),
      });
      if (!res.ok) throw new Error("Failed to update anomaly");
    },
    onSuccess: (_, { verdict }) => {
      toast.success(verdict === "suspend" ? "User suspended" : "Anomaly dismissed");
      queryClient.invalidateQueries({ queryKey: ["session_anomalies"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const pending = anomalies.filter((a) => a.status === "pending");
  const expiringSoon = pending.filter(
    (a) => a.auto_suspend_after && differenceInMinutes(new Date(a.auto_suspend_after), now) < 60
  );
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dismissed7d = anomalies.filter(
    (a) => a.status === "dismissed" && a.created_at >= sevenDaysAgo
  );
  const autoSuspended7d = anomalies.filter(
    (a) => a.status === "auto_suspended" && a.created_at >= sevenDaysAgo
  );

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading session risks...</div>;
  }

  if (queryError) {
    return (
      <div className="py-8 text-center text-red-600 text-sm">
        Failed to load session risks. Check your permissions and try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              Auto-suspend &lt;1h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringSoon.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <XCircle className="h-3 w-3 text-green-500" />
              Dismissed (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dismissed7d.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-purple-500" />
              Auto-suspended (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{autoSuspended7d.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1.2fr] bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground gap-2">
          <div>User</div>
          <div>Risk Type</div>
          <div>Confidence</div>
          <div>Details</div>
          <div>Auto-suspend in</div>
          <div>Actions</div>
        </div>

        {anomalies.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">No anomalies detected</div>
        )}

        {anomalies.map((anomaly) => {
          const isPending = anomaly.status === "pending";
          const isCritical =
            isPending &&
            anomaly.auto_suspend_after !== null &&
            differenceInMinutes(new Date(anomaly.auto_suspend_after), now) < 60;

          return (
            <div
              key={anomaly.id}
              className={`grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1.2fr] px-3 py-2.5 border-t text-sm items-center gap-2 ${isCritical ? "bg-red-50" : ""}`}
            >
              <div>
                <div className="font-medium text-xs">{
                  (Array.isArray(anomaly.profiles) ? anomaly.profiles[0] : anomaly.profiles)?.email ?? anomaly.user_id.slice(0, 8)
                }</div>
                <div className="text-xs text-muted-foreground capitalize">{
                  (Array.isArray(anomaly.profiles) ? anomaly.profiles[0] : anomaly.profiles)?.role ?? "—"
                }</div>
              </div>
              <div><RiskTypeBadge type={anomaly.risk_type} /></div>
              <div><ConfidenceBadge confidence={anomaly.confidence} /></div>
              <div><AnomalyDetails anomaly={anomaly} /></div>
              <div>
                {isPending && anomaly.auto_suspend_after ? (
                  <span className={`text-xs font-semibold ${isCritical ? "text-red-600" : "text-muted-foreground"}`}>
                    {formatCountdown(anomaly.auto_suspend_after)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex gap-1.5">
                {isPending ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-xs px-2"
                      aria-label={`Suspend user ${(Array.isArray(anomaly.profiles) ? anomaly.profiles[0] : anomaly.profiles)?.email ?? anomaly.user_id}`}
                      onClick={() => updateMutation.mutate({ anomalyId: anomaly.id, verdict: "suspend" })}
                      disabled={updateMutation.isPending}
                    >
                      Suspend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      aria-label={`Dismiss anomaly for ${(Array.isArray(anomaly.profiles) ? anomaly.profiles[0] : anomaly.profiles)?.email ?? anomaly.user_id}`}
                      onClick={() => updateMutation.mutate({ anomalyId: anomaly.id, verdict: "dismiss" })}
                      disabled={updateMutation.isPending}
                    >
                      Dismiss
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary" className="text-xs capitalize">{anomaly.status.replace("_", " ")}</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        HIGH confidence anomalies auto-suspend after 6 hours if not reviewed. MEDIUM confidence requires manual action only.
      </p>
    </div>
  );
}
