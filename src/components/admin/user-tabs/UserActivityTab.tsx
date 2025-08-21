import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Car, Calendar, MessageCircle, AlertTriangle, DollarSign } from "lucide-react";

// Activity interface for user activity tracking
interface UserActivity {
  id: string;
  type: 'booking' | 'car' | 'transaction' | 'verification' | 'message';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UserActivityTabProps {
  userId: string;
}

const useUserActivity = (userId: string) => {
  return useQuery({
    queryKey: ["user-activity", userId],
    queryFn: async () => {
      // Get recent activities from multiple sources
      const activities: UserActivity[] = [];

      try {
        // Bookings activity
        const { data: bookings } = await supabase
          .from("bookings")
          .select(`
            id, status, created_at, updated_at, total_price,
            cars (brand, model)
          `)
          .or(`renter_id.eq.${userId},cars.owner_id.eq.${userId}`)
          .order("updated_at", { ascending: false })
          .limit(10);

        bookings?.forEach(booking => {
          activities.push({
            id: `booking-${booking.id}`,
            type: "booking",
            title: `Booking ${booking.status}`,
            description: `${booking.cars?.brand} ${booking.cars?.model} - P${booking.total_price}`,
            timestamp: booking.updated_at,
            status: booking.status,
            icon: Calendar,
          });
        });

        // Car listings activity
        const { data: cars } = await supabase
          .from("cars")
          .select("id, brand, model, created_at, updated_at, is_available")
          .eq("owner_id", userId)
          .order("updated_at", { ascending: false })
          .limit(5);

        cars?.forEach(car => {
          activities.push({
            id: `car-${car.id}`,
            type: "car",
            title: "Car listing updated",
            description: `${car.brand} ${car.model} - ${car.is_available ? "Available" : "Unavailable"}`,
            timestamp: car.updated_at,
            status: car.is_available ? "active" : "inactive",
            icon: Car,
          });
        });

        // Wallet transactions
        const { data: transactions } = await supabase
          .from("wallet_transactions")
          .select(`
            id, transaction_type, amount, created_at, description,
            host_wallets!inner (host_id)
          `)
          .eq("host_wallets.host_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        transactions?.forEach(transaction => {
          activities.push({
            id: `transaction-${transaction.id}`,
            type: "transaction",
            title: `Wallet ${transaction.transaction_type}`,
            description: transaction.description || `P${transaction.amount}`,
            timestamp: transaction.created_at,
            status: transaction.transaction_type,
            icon: DollarSign,
          });
        });

        // Messages activity
        const { data: messages } = await supabase
          .from("conversation_messages")
          .select(`
            id, 
            content, 
            created_at, 
            message_type,
            sender_id,
            conversation:conversations!conversation_id (
              participants:conversation_participants (
                user_id
              )
            )
          `)
          .eq('sender_id', userId)
          .order("created_at", { ascending: false })
          .limit(5);

        messages?.forEach(message => {
          activities.push({
            id: `message-${message.id}`,
            type: "message",
            title: "Message sent",
            description: message.content.substring(0, 50) + "...",
            timestamp: message.created_at,
            status: message.message_type,
            icon: MessageCircle,
          });
        });

        // Also get messages where user is a participant (received messages)
        const { data: receivedMessages } = await supabase
          .from("conversation_messages")
          .select(`
            id, 
            content, 
            created_at, 
            message_type,
            sender_id,
            conversation:conversations!conversation_id (
              participants:conversation_participants (
                user_id
              )
            )
          `)
          .neq('sender_id', userId)
          .order("created_at", { ascending: false })
          .limit(5);

        receivedMessages?.forEach(message => {
          // Check if user is a participant in this conversation
          const isParticipant = message.conversation?.participants?.some(
            p => p.user_id === userId
          );
          
          if (isParticipant) {
            activities.push({
              id: `received-message-${message.id}`,
              type: "message",
              title: "Message received",
              description: message.content.substring(0, 50) + "...",
              timestamp: message.created_at,
              status: message.message_type,
              icon: MessageCircle,
            });
          }
        });

        // Sort all activities by timestamp
        return activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      } catch (error) {
        console.error("Error fetching user activity:", error);
        return [];
      }
    },
  });
};

const getActivityBadgeVariant = (type: string, status: string) => {
  switch (type) {
    case "booking":
      switch (status) {
        case "confirmed": return "default";
        case "completed": return "secondary";
        case "cancelled": return "destructive";
        default: return "outline";
      }
    case "transaction":
      switch (status) {
        case "topup": return "default";
        case "deduction": return "destructive";
        default: return "outline";
      }
    case "car":
      return status === "active" ? "default" : "outline";
    default:
      return "outline";
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "booking": return Calendar;
    case "car": return Car;
    case "transaction": return DollarSign;
    case "message": return MessageCircle;
    default: return Activity;
  }
};

export const UserActivityTab = ({ userId }: UserActivityTabProps) => {
  const { data: activities, isLoading, error } = useUserActivity(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load activity data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {activities?.filter(a => a.type === "booking").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Booking Events</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {activities?.filter(a => a.type === "car").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Car Updates</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {activities?.filter(a => a.type === "transaction").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Transactions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activities?.filter(a => a.type === "message").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Messages</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!activities || activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 20).map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-muted">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium truncate">{activity.title}</h4>
                          <Badge variant={getActivityBadgeVariant(activity.type, activity.status)}>
                            {activity.type}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Logs (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">System logs integration coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              This will show error logs, login attempts, and system interactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};