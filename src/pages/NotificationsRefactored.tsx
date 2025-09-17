import React, { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useBookingActions } from "@/hooks/useBookingActions";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Settings, Trash2, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationClassifier } from "@/utils/NotificationClassifier";
import { normalizeNotification } from "@/utils/notificationHelpers";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";


type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const NotificationsRefactored: React.FC = () => {
  const { user } = useAuth();
  const [includeExpired, setIncludeExpired] = useState(false);
  const [roleBasedFilter, setRoleBasedFilter] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    cleanupExpiredNotifications,
    getUserRoleNotifications
  } = useNotifications({ includeExpired });
  
  const { acceptBooking, declineBooking } = useBookingActions();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [roleFilteredNotifications, setRoleFilteredNotifications] = useState(notifications);

  // Apply role-based filtering when enabled
  useEffect(() => {
    const applyRoleFilter = async () => {
      if (roleBasedFilter) {
        const filtered = await getUserRoleNotifications();
        setRoleFilteredNotifications(filtered);
      } else {
        setRoleFilteredNotifications(notifications);
      }
    };
    
    applyRoleFilter();
  }, [roleBasedFilter, notifications, getUserRoleNotifications]);

  // Filter notifications based on search and active filter
  const filteredNotifications = roleFilteredNotifications.filter((notification) => {
    // Normalize the notification for consistent filtering
    const normalizedNotification = normalizeNotification(notification);
    
    // Search filter
    const searchContent = `${normalizedNotification.title || ''} ${normalizedNotification.description || ''}`.toLowerCase();
    if (searchQuery && !searchContent.includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (activeFilter === "all") return true;
    
    if (activeFilter === "active_rentals") {
      // Active rentals include handover-related notifications and in-progress rental notifications
      return NotificationClassifier.isActiveRentalNotification(normalizedNotification);
    }
    
    const classification = NotificationClassifier.classifyNotification(normalizedNotification);
    return classification.type === activeFilter;
  });

  // Group notifications
  const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
  const readNotifications = filteredNotifications.filter(n => n.is_read);
  


  // Event handlers
  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId: number) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleAcceptBooking = async (bookingId: string) => {
    await acceptBooking(bookingId);
  };

  const handleDeclineBooking = async (bookingId: string) => {
    await declineBooking(bookingId);
  };

  const handleCleanupExpired = async () => {
    try {
      const { error } = await cleanupExpiredNotifications();
      if (error) {
        toast.error('Failed to cleanup expired notifications');
      } else {
        toast.success('Expired notifications cleaned up successfully');
      }
    } catch (error) {
      toast.error('Failed to cleanup expired notifications');
    }
  };

  // Helper function to get filter counts
  const getFilterCounts = () => {
    const counts = {
      all: roleFilteredNotifications.length,
      booking: 0,
      payment: 0,
      active_rentals: 0,
      system: 0
    };

    roleFilteredNotifications.forEach(notification => {
      const normalizedNotification = normalizeNotification(notification);
      const classification = NotificationClassifier.classifyNotification(normalizedNotification);
      
      if (classification.type === 'booking') counts.booking++;
      if (classification.type === 'payment') counts.payment++;
      if (classification.type === 'system') counts.system++;
      if (NotificationClassifier.isActiveRentalNotification(normalizedNotification)) {
        counts.active_rentals++;
      }
    });

    return counts;
  };

  const filterCounts = getFilterCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">

        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
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
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="include-expired">Include Expired Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Show notifications that have passed their expiration date
                        </p>
                      </div>
                      <Switch
                        id="include-expired"
                        checked={includeExpired}
                        onCheckedChange={setIncludeExpired}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="role-filter">Role-Based Filtering</Label>
                        <p className="text-sm text-muted-foreground">
                          Only show notifications relevant to your role
                        </p>
                      </div>
                      <Switch
                        id="role-filter"
                        checked={roleBasedFilter}
                        onCheckedChange={setRoleBasedFilter}
                      />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleCleanupExpired}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cleanup Expired Notifications
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="flex items-center gap-2">
              {roleBasedFilter && (
                <Badge variant="outline" className="text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  Role Filtered
                </Badge>
              )}
              {unreadCount > 0 && (
                <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary" className="text-xs">
                {filterCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center gap-2">
              Bookings
              <Badge variant="secondary" className="text-xs">
                {filterCounts.booking}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              Payments
              <Badge variant="secondary" className="text-xs">
                {filterCounts.payment}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active_rentals" className="flex items-center gap-2">
              Rentals
              <Badge variant="secondary" className="text-xs">
                {filterCounts.active_rentals}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              System
              <Badge variant="secondary" className="text-xs">
                {filterCounts.system}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className="mt-4">
            <div className="space-y-4">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Unread ({unreadNotifications.length})
                  </h3>
                  {unreadNotifications.map((notification) => (
                     <NotificationCard
                       key={`unread-${notification.id}`}
                       notification={normalizeNotification(notification)}
                       onMarkAsRead={handleMarkAsRead}
                       onDelete={handleDelete}
                       onAcceptBooking={handleAcceptBooking}
                       onDeclineBooking={handleDeclineBooking}
                     />
                  ))}
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Read ({readNotifications.length})
                  </h3>
                  {readNotifications.map((notification) => (
                     <NotificationCard
                       key={`read-${notification.id}`}
                       notification={normalizeNotification(notification)}
                       onMarkAsRead={handleMarkAsRead}
                       onDelete={handleDelete}
                       onAcceptBooking={handleAcceptBooking}
                       onDeclineBooking={handleDeclineBooking}
                     />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Try adjusting your search terms"
                      : activeFilter === "all" 
                        ? "You're all caught up!"
                        : `No ${activeFilter} notifications found`
                    }
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};

export default NotificationsRefactored;