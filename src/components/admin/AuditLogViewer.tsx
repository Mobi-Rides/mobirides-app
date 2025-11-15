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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Eye, RefreshCw, Shield, Monitor, Filter, Calendar as CalendarIcon, X, Download } from "lucide-react";
import { format } from "date-fns";
import DeviceDetailsDialog from "./DeviceDetailsDialog";

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

  // Advanced filtering state
  const [filters, setFilters] = useState({
    severity: [] as string[],
    eventType: [] as string[],
    actorId: "",
    targetId: "",
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
    ipAddress: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // Advanced filtering logic
  const advancedFilteredLogs = React.useMemo(() => {
    if (!auditLogs) return [];

    return auditLogs.filter(log => {
      try {
        // Text search - safely handle all fields
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
          (log.reason && log.reason.toLowerCase().includes(searchLower)) ||
          (log.actor_profile?.full_name && log.actor_profile.full_name.toLowerCase().includes(searchLower)) ||
          (log.target_profile?.full_name && log.target_profile.full_name.toLowerCase().includes(searchLower)) ||
          (log.ip_address && log.ip_address.toLowerCase().includes(searchLower)) ||
          (log.event_type && log.event_type.toLowerCase().includes(searchLower)) ||
          (log.action_details && typeof log.action_details === 'object' &&
           JSON.stringify(log.action_details).toLowerCase().includes(searchLower));

        // Severity filter
        const matchesSeverity = filters.severity.length === 0 || filters.severity.includes(log.severity);

        // Event type filter
        const matchesEventType = filters.eventType.length === 0 ||
          (log.event_type && filters.eventType.includes(log.event_type));

        // Actor filter
        const matchesActor = !filters.actorId || log.actor_id === filters.actorId;

        // Target filter
        const matchesTarget = !filters.targetId || log.target_id === filters.targetId;

        // IP address filter
        const matchesIP = !filters.ipAddress ||
          (log.ip_address && log.ip_address.includes(filters.ipAddress));

        // Date range filter - safely handle date parsing
        let matchesDateRange = true;
        if (filters.dateRange.from || filters.dateRange.to) {
          try {
            const logDate = new Date(log.event_timestamp);
            if (isNaN(logDate.getTime())) {
              matchesDateRange = false; // Invalid date, exclude from date range filter
            } else {
              matchesDateRange = (!filters.dateRange.from || logDate >= filters.dateRange.from) &&
                                (!filters.dateRange.to || logDate <= filters.dateRange.to);
            }
          } catch (dateError) {
            console.warn('Invalid date in log entry:', log.event_timestamp);
            matchesDateRange = false; // Exclude entries with invalid dates
          }
        }

        return matchesSearch && matchesSeverity && matchesEventType && matchesActor &&
               matchesTarget && matchesIP && matchesDateRange;
      } catch (error) {
        console.warn('Error filtering log entry:', error, log);
        return false; // Exclude problematic entries from results
      }
    });
  }, [auditLogs, searchTerm, filters]);

  const filteredLogs = advancedFilteredLogs;

  const handleViewDetails = (log: AuditLog) => {
    setSelectedEvent(log);
    setIsDetailsDialogOpen(true);
  };

  const handleViewDeviceDetails = (log: AuditLog) => {
    setSelectedEvent(log);
    setIsDeviceDialogOpen(true);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Timestamp', 'Event Type', 'Severity', 'Actor', 'Target', 'IP Address', 'Details'],
        ...filteredLogs.map(log => {
          try {
            const timestamp = (() => {
              try {
                return format(new Date(log.event_timestamp), "yyyy-MM-dd HH:mm:ss");
              } catch {
                return log.event_timestamp || "Invalid Date";
              }
            })();

            return [
              timestamp,
              log.event_type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Unknown",
              log.severity || "unknown",
              log.actor_profile?.full_name || "System",
              log.target_profile?.full_name ||
              (log.action_details?.fullName as string) ||
              (log.action_details?.email as string) || "N/A",
              log.ip_address || "N/A",
              (() => {
                try {
                  return JSON.stringify(log.action_details || {});
                } catch {
                  return "{}";
                }
              })()
            ];
          } catch (logError) {
            console.warn('Error processing log for export:', logError, log);
            return ["Error", "Error", "Error", "Error", "Error", "Error", "Error"];
          }
        })
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      // Could show a toast notification here if available
    }
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

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                    {(filters.severity.length > 0 || filters.eventType.length > 0 || filters.dateRange.from || filters.dateRange.to) && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {(filters.severity.length + filters.eventType.length + (filters.dateRange.from ? 1 : 0) + (filters.dateRange.to ? 1 : 0))}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Advanced Filters</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({
                          severity: [],
                          eventType: [],
                          actorId: "",
                          targetId: "",
                          dateRange: { from: undefined, to: undefined },
                          ipAddress: "",
                        })}
                      >
                        <X className="h-4 w-4" />
                        Clear All
                      </Button>
                    </div>

                    {/* Severity Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Severity</Label>
                      <div className="flex flex-wrap gap-2">
                        {["low", "medium", "high", "critical"].map((severity) => (
                          <div key={severity} className="flex items-center space-x-2">
                            <Checkbox
                              id={`severity-${severity}`}
                              checked={filters.severity.includes(severity)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({ ...prev, severity: [...prev.severity, severity] }));
                                } else {
                                  setFilters(prev => ({ ...prev, severity: prev.severity.filter(s => s !== severity) }));
                                }
                              }}
                            />
                            <Label htmlFor={`severity-${severity}`} className="text-sm capitalize">
                              {severity}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Event Type Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Event Type</Label>
                      <Select
                        value={filters.eventType.length === 1 ? filters.eventType[0] : ""}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value ? [value] : [] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All event types</SelectItem>
                          {Array.from(new Set(auditLogs?.map(log => log.event_type) || [])).map((eventType) => (
                            <SelectItem key={eventType} value={eventType}>
                              {eventType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.dateRange.from ? format(filters.dateRange.from, "MMM dd") : "From"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.dateRange.from}
                              onSelect={(date) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, from: date } }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.dateRange.to ? format(filters.dateRange.to, "MMM dd") : "To"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.dateRange.to}
                              onSelect={(date) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, to: date } }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* IP Address Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="ip-filter" className="text-sm font-medium">IP Address</Label>
                      <Input
                        id="ip-filter"
                        placeholder="Filter by IP address..."
                        value={filters.ipAddress}
                        onChange={(e) => setFilters(prev => ({ ...prev, ipAddress: e.target.value }))}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
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