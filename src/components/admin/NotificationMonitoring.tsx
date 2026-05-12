import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Send,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_recipients: number | null;
  successful_sends: number | null;
  sent_at: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  sending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-slate-100 text-slate-800 border-slate-200",
};

function deliveryRate(successful: number | null, total: number | null): string {
  if (!total || total === 0) return "—";
  const rate = ((successful ?? 0) / total) * 100;
  return `${rate.toFixed(1)}%`;
}

function failedCount(successful: number | null, total: number | null): number {
  return Math.max(0, (total ?? 0) - (successful ?? 0));
}

export const NotificationMonitoring = () => {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["notification-monitoring"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_campaigns")
        .select("id, name, status, total_recipients, successful_sends, sent_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const completed = campaigns?.filter((c) => c.status === "completed") ?? [];
  const totalSent = completed.reduce((sum, c) => sum + (c.total_recipients ?? 0), 0);
  const totalSuccess = completed.reduce((sum, c) => sum + (c.successful_sends ?? 0), 0);
  const totalFailed = totalSent - totalSuccess;
  const overallRate = totalSent > 0 ? ((totalSuccess / totalSent) * 100).toFixed(1) : "0.0";
  const failedCampaigns = campaigns?.filter((c) => c.status === "failed").length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">across {completed.length} completed campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalSuccess.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">successful deliveries</p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {failedCampaigns > 0 ? `+ ${failedCampaigns} failed campaigns` : "no failed campaigns"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRate}%</div>
            <p className="text-xs text-muted-foreground">overall success rate</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Delivery Report by Campaign
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!campaigns?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">No campaign data</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Send your first campaign to see delivery metrics here.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-primary/5">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Campaign</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Recipients</TableHead>
                    <TableHead className="font-semibold text-right">Delivered</TableHead>
                    <TableHead className="font-semibold text-right">Failed</TableHead>
                    <TableHead className="font-semibold text-right">Rate</TableHead>
                    <TableHead className="font-semibold">Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const failed = failedCount(campaign.successful_sends, campaign.total_recipients);
                    const rate = deliveryRate(campaign.successful_sends, campaign.total_recipients);
                    const hasData = (campaign.total_recipients ?? 0) > 0;

                    return (
                      <TableRow key={campaign.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[campaign.status]}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {hasData ? (campaign.total_recipients ?? 0).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {hasData ? (campaign.successful_sends ?? 0).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {hasData ? (
                            <span className={failed > 0 ? "text-red-600" : "text-muted-foreground"}>
                              {failed.toLocaleString()}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {hasData ? (
                            <span className={parseFloat(rate) >= 90 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                              {rate}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {campaign.sent_at
                            ? format(new Date(campaign.sent_at), "MMM d, yyyy HH:mm")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
