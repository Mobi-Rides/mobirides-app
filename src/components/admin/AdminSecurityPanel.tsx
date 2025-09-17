import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Activity, Clock, Users, AlertTriangle } from "lucide-react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { formatDistanceToNow } from "date-fns";

export const AdminSecurityPanel = () => {
  const { isSuperAdmin } = useIsAdmin();
  const { sessions, isLoading: sessionsLoading, cleanupExpiredSessions } = useAdminSession();
  const { logs, isLoading: logsLoading } = useAdminActivityLog();

  const activeSessions = sessions.filter(s => s.is_active);
  const recentActivity = logs.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Security Center</h2>
          <p className="text-muted-foreground">
            Monitor admin sessions and security activity
          </p>
        </div>
        {isSuperAdmin && (
          <Button 
            onClick={cleanupExpiredSessions}
            variant="outline"
            size="sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            Cleanup Sessions
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active admin sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">
              Actions in the last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8h</div>
            <p className="text-xs text-muted-foreground">
              Maximum session timeout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-500">
                Secure
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Admin Sessions</CardTitle>
            <CardDescription>
              Currently active administrator sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="text-center py-4">Loading sessions...</div>
            ) : activeSessions.length > 0 ? (
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Session {session.id.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">
                        Created {formatDistanceToNow(new Date(session.created_at))} ago
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last activity: {formatDistanceToNow(new Date(session.last_activity))} ago
                      </div>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No active sessions
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>
              Latest administrative actions and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-4">Loading activity...</div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border rounded">
                    <div className="flex-shrink-0">
                      {log.action.includes('created') && <Users className="h-4 w-4 text-green-500" />}
                      {log.action.includes('updated') && <Activity className="h-4 w-4 text-blue-500" />}
                      {log.action.includes('deleted') && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {!['created', 'updated', 'deleted'].some(a => log.action.includes(a)) && (
                        <Shield className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{log.action}</div>
                      {log.resource_type && (
                        <div className="text-xs text-muted-foreground">
                          {log.resource_type} {log.resource_id?.slice(0, 8)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at))} ago
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};