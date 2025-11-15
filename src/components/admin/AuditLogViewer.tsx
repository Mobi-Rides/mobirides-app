import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, RefreshCw, Shield, Monitor } from "lucide-react";
import { format } from "date-fns";
import  DeviceDetailsDialog  from "./DeviceDetailsDialog";

type AuditLog = {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actor_id: string | null;
  target_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location_data: {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    isp?: string;
    org?: string;
    lat?: number;
    lon?: number;
  } | null;
  action_details: {
    device?: {
      browser: string;
      browserVersion: string;
      os: string;
      osVersion: string;
      deviceType: 'mobile' | 'tablet' | 'desktop';
    };
    [key: string]: unknown;
  };
  event_timestamp: string;
  resource_type: string | null;
  resource_id: string | null;
  reason: string | null;
  anomaly_flags: Record<string, unknown>;
  compliance_tags: string[] | null;
  actor_profile?: {
    full_name: string | null;
    email?: string;
  };
  target_profile?: {
    full_name: string | null;
    email?: string;
  };
};

export const AuditLogViewer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);

  const { data: auditLogs, isLoading, error, refetch } = useQuery<AuditLog[], Error>({
    queryKey: ["audit-logs"],
    queryFn: async (): Promise<AuditLog[]> => {
      const { data: logs, error: logsError } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      console.log("Audit logs query result:", { logs, logsError });

      if (logsError) {
        console.error("Audit logs error:", logsError);
        throw logsError;
      }
      if (!logs || logs.length === 0) {
        console.log("No audit logs found");
        return [];
      }

      const userIds = new Set<string>();
      logs.forEach(log => {
        if (log.admin_id) userIds.add(log.admin_id);
        if (log.resource_id) userIds.add(log.resource_id);
      });

      console.log("User IDs to fetch:", Array.from(userIds));

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds));

      console.log("Profiles query result:", { profiles, profilesError });

      if (profilesError) {
        console.warn("Failed to fetch profiles:", profilesError);
      }

      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      const enrichedLogs = logs.map(log => ({
        id: log.id,
        event_type: log.action,
        severity: 'medium' as const,
        actor_id: log.admin_id,
        target_id: log.resource_id,
        session_id: null,
        ip_address: log.ip_address as string | null,
        user_agent: log.user_agent as string | null,
        location_data: null,
        action_details: (log.details || {}) as { [key: string]: unknown },
        event_timestamp: log.created_at,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        reason: null,
        anomaly_flags: {},
        compliance_tags: null,
        actor_profile: log.admin_id ? profileMap.get(log.admin_id) : null,
        target_profile: log.resource_id ? profileMap.get(log.resource_id) : null,
      }));

      return enrichedLogs;
    },
    refetchInterval: 30000,
  });

  const filteredLogs = auditLogs?.filter(log =>
    !searchTerm ||
    log.action_details?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewDetails = (log: AuditLog) => {
    setSelectedEvent(log);
    setIsDetailsDialogOpen(true);
  };

  const handleViewDeviceDetails = (log: AuditLog) => {
    setSelectedEvent(log);
    setIsDeviceDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load audit logs: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Audit Log Viewer ({filteredLogs.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Comprehensive audit trail with device and location tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="relative max-w-sm pt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[300px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(log.event_timestamp), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.event_timestamp), "HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {log.event_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.actor_profile?.full_name || "System"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.target_profile?.full_name || 
                         (log.action_details?.fullName as string) || 
                         (log.action_details?.email as string) || 
                         "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {log.ip_address || "N/A"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                          title="View full details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDeviceDetails(log)}
                          title="View device & location details"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
            <DialogDescription>
              Comprehensive details for audit event ID: {selectedEvent?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Event Type</Label>
                  <p className="text-sm">{selectedEvent.event_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <Badge variant={getSeverityColor(selectedEvent.severity)}>
                    {selectedEvent.severity}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm">{format(new Date(selectedEvent.event_timestamp), "PPP 'at' p")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm font-mono">{selectedEvent.ip_address || "N/A"}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Actor</Label>
                <p className="text-sm">{selectedEvent.actor_profile?.full_name || "System"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Target</Label>
                <p className="text-sm">
                  {selectedEvent.target_profile?.full_name || 
                   (selectedEvent.action_details?.fullName as string) || 
                   (selectedEvent.action_details?.email as string) || 
                   "N/A"}
                </p>
              </div>

              {selectedEvent.reason && (
                <div>
                  <Label className="text-sm font-medium">Reason</Label>
                  <p className="text-sm">{selectedEvent.reason}</p>
                </div>
              )}

              {selectedEvent.action_details && (
                <div>
                  <Label className="text-sm font-medium">Action Details</Label>
                  <Textarea
                    value={JSON.stringify(selectedEvent.action_details, null, 2)}
                    readOnly
                    className="min-h-[200px] font-mono text-xs"
                  />
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    handleViewDeviceDetails(selectedEvent);
                  }}
                  className="w-full"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  View Device & Location Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Device Details Dialog */}
      {selectedEvent && (
        <DeviceDetailsDialog
          isOpen={isDeviceDialogOpen}
          onClose={() => setIsDeviceDialogOpen(false)}
          ipAddress={selectedEvent.ip_address}
          userAgent={selectedEvent.user_agent}
          locationData={selectedEvent.location_data}
          deviceInfo={selectedEvent.action_details?.device || null}
        />
      )}
    </>
  );
};