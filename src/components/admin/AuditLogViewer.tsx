import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Download, Filter, Calendar as CalendarIcon, Shield, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type AuditLog = {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actor_id: string | null;
  target_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  action_details: Record<string, unknown>;
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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const { data: auditLogs, isLoading, error, refetch } = useQuery<AuditLog[], Error>({
    queryKey: ["audit-logs"],
    queryFn: async (): Promise<AuditLog[]> => {
      // First get the audit logs
      const { data: logs, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("event_timestamp", { ascending: false })
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

      // Get unique user IDs from actor_id and target_id
      const userIds = new Set<string>();
      logs.forEach(log => {
        if (log.actor_id) userIds.add(log.actor_id);
        if (log.target_id) userIds.add(log.target_id);
      });

      console.log("User IDs to fetch:", Array.from(userIds));

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds));

      console.log("Profiles query result:", { profiles, profilesError });

      if (profilesError) {
        console.warn("Failed to fetch profiles:", profilesError);
      }

      // Create a map of user ID to profile
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // Combine the data
      const enrichedLogs = logs.map(log => ({
        ...log,
        actor_profile: log.actor_id ? profileMap.get(log.actor_id) : null,
        target_profile: log.target_id ? profileMap.get(log.target_id) : null,
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
                Comprehensive audit trail with real-time monitoring
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
