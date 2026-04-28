import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { NotificationCampaignBuilder } from "@/components/admin/NotificationCampaignBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Megaphone, 
  Plus, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send,
  MoreVertical,
  BarChart2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  sending: "bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-slate-100 text-slate-800 border-slate-200",
};

const AdminCampaigns = () => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ["admin-notification-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: campaigns?.length || 0,
    completed: campaigns?.filter((c) => c.status === "completed").length || 0,
    scheduled: campaigns?.filter((c) => c.status === "scheduled").length || 0,
    recipients: campaigns?.reduce((acc, c) => acc + (c.total_recipients || 0), 0) || 0,
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaign Management</h1>
              <p className="text-muted-foreground">
                Create and manage targeted notification campaigns for your users.
              </p>
            </div>
            <Button onClick={() => setIsBuilderOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
                <Megaphone className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Recipients</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recipients.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Campaign History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : campaigns?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-medium">No campaigns found</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    You haven't created any notification campaigns yet. Start by clicking "New Campaign".
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-primary/5">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Campaign Name</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Audience</TableHead>
                        <TableHead className="font-semibold">Sent At</TableHead>
                        <TableHead className="font-semibold text-right">Recipients</TableHead>
                        <TableHead className="font-semibold text-right">Success</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns?.map((campaign) => (
                        <TableRow key={campaign.id} className="hover:bg-primary/5 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{campaign.name}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {campaign.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[campaign.status]}>
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {campaign.target_user_roles?.map((role: string) => (
                                <Badge key={role} variant="secondary" className="text-[10px] uppercase">
                                  {role}
                                </Badge>
                              )) || <Badge variant="secondary" className="text-[10px]">ALL</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {campaign.sent_at 
                              ? format(new Date(campaign.sent_at), "MMM d, yyyy HH:mm")
                              : campaign.scheduled_for
                                ? `Scheduled: ${format(new Date(campaign.scheduled_for), "MMM d, HH:mm")}`
                                : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {campaign.total_recipients?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-medium">
                              {campaign.successful_sends?.toLocaleString() || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                {campaign.status === "scheduled" && (
                                  <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <NotificationCampaignBuilder 
          isOpen={isBuilderOpen} 
          onClose={() => {
            setIsBuilderOpen(false);
            refetch();
          }} 
        />
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminCampaigns;
