import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Search, 
  Settings, 
  CheckCircle, 
  Filter,
  RefreshCw,
  Car,
  Clock
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useBookingActions } from "@/hooks/useBookingActions";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationClassifier } from "@/utils/NotificationClassifier";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";

export default function NotificationsRefactored() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const { acceptBooking, declineBooking, isLoading: bookingActionLoading } = useBookingActions();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilter === "all") return true;
    
    if (activeFilter === "active_rentals") {
      // Active rentals include handover-related notifications and in-progress rental notifications
      return (notification.type.includes('pickup_reminder') || 
              notification.type.includes('return_reminder') || 
              notification.type === 'handover_ready' ||
              (notification.type === 'message_received' &&
               notification.content?.toLowerCase().includes('handover')));
    }
    
    const classification = NotificationClassifier.classifyNotification(notification);
    return classification.type === activeFilter;
  });

  // Group notifications
  const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
  const readNotifications = filteredNotifications.filter(n => n.is_read);

  const handleMarkAsRead = async (id: string) => {
    const { error } = await markAsRead(id);
    if (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteNotification(id);
    if (error) {
      toast.error("Failed to delete notification");
    } else {
      toast.success("Notification deleted");
    }
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await markAllAsRead();
    if (error) {
      toast.error("Failed to mark all notifications as read");
    } else {
      toast.success("All notifications marked as read");
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    acceptBooking(bookingId);
  };

  const handleDeclineBooking = async (bookingId: string) => {
    declineBooking(bookingId);
  };

  const getFilterCounts = () => {
    const bookingCount = notifications.filter(n => {
      const classification = NotificationClassifier.classifyNotification(n);
      return classification.type === 'booking' && !n.is_read;
    }).length;

    const paymentCount = notifications.filter(n => {
      const classification = NotificationClassifier.classifyNotification(n);
      return classification.type === 'payment' && !n.is_read;
    }).length;

    const activeRentalCount = notifications.filter(n => {
      const classification = NotificationClassifier.classifyNotification(n);
      return (classification.type === 'booking' && 
              (n.type === 'pickup_reminder' || 
               n.type === 'return_reminder' || 
               n.type === 'handover_ready')) && !n.is_read;
    }).length;

    return { bookingCount, paymentCount, activeRentalCount };
  };

  const { bookingCount, paymentCount, activeRentalCount } = getFilterCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Preferences
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Notification Preferences</DialogTitle>
                </DialogHeader>
                <NotificationPreferences />
              </DialogContent>
            </Dialog>
            
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-auto">
            <TabsList>
              <TabsTrigger value="all" className="relative">
                All
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="booking" className="relative">
                Bookings
                {bookingCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {bookingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payment" className="relative">
                Payments
                {paymentCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {paymentCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active_rentals" className="relative">
                <Car className="h-4 w-4 mr-1" />
                Active Rentals
                {activeRentalCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {activeRentalCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List */}
        <div className="space-y-6">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Unread ({unreadNotifications.length})
              </h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onAcceptBooking={handleAcceptBooking}
                    onDeclineBooking={handleDeclineBooking}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                Earlier
              </h2>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onDelete={handleDelete}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No notifications match your search criteria"
                  : "You're all caught up! New notifications will appear here."
                }
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}