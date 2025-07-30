import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail, Search, Grid, Hash, User, Settings, ChevronDown, AlertTriangle, Eye, Trash2, CheckCircle, ArchiveIcon, Clock, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";


import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";


import { Checkbox } from "@/components/ui/checkbox";
import SnoozeModal from "@/components/notifications/SnoozeModal";
import { FixedSizeList as List } from 'react-window';
import { useCallback } from 'react';
import { NotificationClassifier, classifyType } from "@/utils/NotificationClassifier";




export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  // --- Split notifications into recent and old ---
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);
  const [isOldExpanded, setIsOldExpanded] = useState(true);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoMarkRead, setAutoMarkRead] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [collapseGroups, setCollapseGroups] = useState(false);
  const [maxNotifications, setMaxNotifications] = useState(100);
  // Add a tab state for active/archived
  const [tab, setTab] = useState<'active' | 'archived' | 'snoozed'>('active');
  
  const handleTabChange = (value: string) => {
    setTab(value as 'active' | 'archived' | 'snoozed');
  };
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dummyState, setDummyState] = useState(0);

  

  // 1. Add state for pagination
  const [notificationsPage, setNotificationsPage] = useState(0);
  const notificationsPageSize = 50;
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 2. Fetch notifications with pagination
  const fetchNotificationsPage = useCallback(async (page, searchTerm = "") => {
    setLoadingMore(true);
    const from = page * notificationsPageSize;
    const to = from + notificationsPageSize - 1;
    let query = supabase
        .from('notifications')
        .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (searchTerm) {
      query = query.ilike('content', `%${searchTerm}%`);
    }
    const { data, error } = await query;
    setLoadingMore(false);
    if (error) return [];
    return data || [];
  }, []);

  // 3. On initial load, fetch first page
  useEffect(() => {
    (async () => {
      const firstPage = await fetchNotificationsPage(0, searchQuery);
      setLocalNotifications(firstPage);
      setHasMoreNotifications(firstPage.length === notificationsPageSize);
      setNotificationsPage(0);
    })();
  }, [fetchNotificationsPage, searchQuery]);

  // 4. Infinite scroll handler
  const handleLoadMoreNotifications = async () => {
    if (loadingMore || !hasMoreNotifications) return;
    const nextPage = notificationsPage + 1;
    const newPageData = await fetchNotificationsPage(nextPage, searchQuery);
    // Deduplicate by id
    setLocalNotifications(prev => {
      const ids = new Set(prev.map(n => n.id));
      return [...prev, ...newPageData.filter(n => !ids.has(n.id))];
    });
    setHasMoreNotifications(newPageData.length === notificationsPageSize);
    setNotificationsPage(nextPage);
  };

  // 5. In the List component for notifications, add onItemsRendered to trigger handleLoadMoreNotifications when near the end
  // Example:
  // <List ... onItemsRendered={({ visibleStopIndex }) => {
  //   if (visibleStopIndex >= memoizedRecent.length - 5 && hasMoreNotifications) handleLoadMoreNotifications();
  // }} />

  // Add state to track notifications locally for instant UI updates
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  useEffect(() => {
    // Initialize with empty array, will be populated by fetchNotificationsPage
    setLocalNotifications([]);
  }, []); // Only run once on mount

  // Update filteredNotifications to depend on tab
  // Use activeFilter for notification type filtering, not tab
  const filteredNotifications = localNotifications?.filter(notification => {
    const matchesSearch = notification.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const classification = NotificationClassifier.classifyNotification(notification);
    
    if (activeFilter === 'payments') {
      return classification.type === 'payment';
    } else if (activeFilter === 'bookings') {
      return classification.type === 'booking';
    } else if (activeFilter === 'active_rentals') {
      return (notification.type === 'pickup_reminder' || 
              notification.type === 'return_reminder' || 
              notification.type === 'handover_ready');
    }
    
    // For 'all', show all
    return true;
  }) || [];

  // Add periodic check for expired snoozed notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date();
      const hasExpiredSnoozes = localNotifications.some(n => 
        n.snoozedUntil && new Date(n.snoozedUntil) <= currentTime
      );
      
      if (hasExpiredSnoozes) {
        // Force re-render by updating a state that triggers re-computation
        setLocalNotifications(prev => [...prev]); // This will trigger re-computation of filters
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [localNotifications]); // <-- closes the useEffect

  // Filter notifications by archive/snooze state
  const nowDate = new Date();
  const activeNotifications = localNotifications.filter(n => !n.archived && (!n.snoozedUntil || new Date(n.snoozedUntil) <= nowDate));

  // Use filteredNotifications for recent/old notifications
  const recentNotifications = filteredNotifications.filter(n => {
    const created = new Date(n.created_at);
    return (nowDate.getTime() - created.getTime()) < 24 * 60 * 60 * 1000 && !n.is_read;
  });
  const oldNotifications = filteredNotifications.filter(n => {
    const created = new Date(n.created_at);
    return n.is_read || (nowDate.getTime() - created.getTime()) >= 24 * 60 * 60 * 1000;
  });

  // Automatically expand/collapse sections based on recentNotifications
  useEffect(() => {
    if (recentNotifications.length === 0) {
      setIsRecentExpanded(false);
      setIsOldExpanded(true);
    } else {
      setIsRecentExpanded(true);
      // Optionally, keep old expanded/collapsed as is, or set to false:
      // setIsOldExpanded(false);
    }
  }, [recentNotifications.length]);

  // --- Unread counts per section ---
  const unreadAll = localNotifications?.filter(n => !n.is_read).length || 0;
  const unreadPayments = localNotifications?.filter(n => {
    if (n.is_read) return false;
    const classification = NotificationClassifier.classifyNotification(n);
    return classification.type === 'payment';
  }).length || 0;
  const unreadBookings = localNotifications?.filter(n => {
    if (n.is_read) return false;
    const classification = NotificationClassifier.classifyNotification(n);
    return classification.type === 'booking';
  }).length || 0;
  const unreadActiveRentals = localNotifications?.filter(n => {
    if (n.is_read) return false;
    return (n.type === 'pickup_reminder' || 
            n.type === 'return_reminder' || 
            n.type === 'handover_ready');
  }).length || 0;

  // --- Section name and count logic ---
  const sectionMap = {
    all: { label: 'All Notifications', count: unreadAll },
    payments: { label: 'Payments', count: unreadPayments },
    bookings: { label: 'Bookings', count: unreadBookings },
    active_rentals: { label: 'Active Rentals', count: unreadActiveRentals },
  };
  const currentSection = sectionMap[activeFilter];


  const unreadNotifications = localNotifications?.filter(n => !n.is_read).length || 0;

  // Enhanced status counting with classification
  const confirmedCount = filteredNotifications.filter(n => {
    const classification = NotificationClassifier.classifyNotification(n);
    return classification.type === 'booking' && (
      n.type === "booking_confirmed" || 
      n.content.toLowerCase().includes("confirmed")
    );
  }).length;

  const cancelledCount = filteredNotifications.filter(n => {
    const classification = NotificationClassifier.classifyNotification(n);
    return classification.type === 'booking' && (
      n.type === "booking_cancelled" || 
      n.content.toLowerCase().includes("cancelled")
    );
  }).length;

  const pendingCount = filteredNotifications.filter(n => {
    const classification = NotificationClassifier.classifyNotification(n);
    return classification.type === 'booking' && (
      n.type === "booking_request" || 
      n.content.toLowerCase().includes("pending")
    );
  }).length;

  

  const handleNotificationClick = (notificationId: string) => {
    console.log('Navigating to notification:', notificationId);
    navigate(`/notifications/${notificationId}`);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark all notifications as read
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (notificationError) {
        console.error("Error marking notifications as read:", notificationError);
        toast.error("Couldn't mark notifications as read");
        return;
      }

      

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['messages'] });
      await queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
      await queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const currentTime = new Date();
    const diffInHours = Math.floor((currentTime.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getNotificationColor = (notification: any) => {
    const classification = NotificationClassifier.classifyNotification(notification);
    
    if (classification.type === 'payment') {
      return 'bg-blue-500';
    } else if (classification.type === 'booking') {
      if (notification.type === 'booking_confirmed' || notification.content.toLowerCase().includes('confirmed')) {
        return 'bg-green-500';
      } else if (notification.type === 'booking_cancelled' || notification.content.toLowerCase().includes('cancelled')) {
        return 'bg-red-500';
      } else {
        return 'bg-yellow-500';
      }
    }
    
    return 'bg-gray-500';
  };

  // Pulse mail icon as long as there are unread recent notifications
  const hasUnreadRecent = recentNotifications.some(n => !n.is_read);
  const prevUnreadRef = useRef(unreadNotifications);
  useEffect(() => {
    if (unreadNotifications > prevUnreadRef.current) {
      toast.info('You have a new notification!', {
        duration: 4000,
      });
    }
    prevUnreadRef.current = unreadNotifications;
  }, [unreadNotifications]);

  // Collapse groups by default logic
  useEffect(() => {
    if (collapseGroups) {
      setIsRecentExpanded(false);
      setIsOldExpanded(false);
    }
  }, [collapseGroups, activeFilter]);

  // Maximum notifications logic
  const limitedRecentNotifications = recentNotifications.slice(0, maxNotifications);
  const limitedOldNotifications = oldNotifications.slice(0, maxNotifications);

  // Auto mark as read logic
  useEffect(() => {
    if (autoMarkRead && isRecentExpanded && limitedRecentNotifications.length > 0) {
      limitedRecentNotifications.forEach(n => {
        if (!n.is_read) handleNotificationClick(n.id);
      });
    }
  }, [autoMarkRead, isRecentExpanded, limitedRecentNotifications]);
  useEffect(() => {
    if (autoMarkRead && isOldExpanded && limitedOldNotifications.length > 0) {
      limitedOldNotifications.forEach(n => {
        if (!n.is_read) handleNotificationClick(n.id);
      });
    }
  }, [autoMarkRead, isOldExpanded, limitedOldNotifications]);

  // Messaging states removed

  // Fetch all messages and group by conversation (removed)

  

  // Handler: Mark as Read/Unread
  const handleToggleRead = async (notification: any) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: !notification.is_read })
      .eq('id', notification.id);
    if (!error) {
      setLocalNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: !notification.is_read } : n
        )
      );
      setDummyState(s => s + 1); // Force re-computation
      toast.success(
        !notification.is_read ? 'Marked as read' : 'Marked as unread'
      );
    } else {
      toast.error('Failed to update notification');
    }
  };
  const handleDeleteNotification = async (notification) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      // Optimistically remove from UI first for immediate feedback
      setLocalNotifications((prev) => prev.filter(n => n.id !== notification.id));
      
      // Then delete from database
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification.id);
        
      if (error) {
        // If database delete failed, restore the notification
        console.error('Error deleting notification:', error);
        setLocalNotifications((prev) => [...prev, notification]);
        toast.error('Failed to delete notification');
      } else {
        toast.success('Notification deleted');
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['notifications'] });
        await queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      }
    } catch (error) {
      // If any other error, restore the notification
      console.error('Error in delete notification:', error);
      setLocalNotifications((prev) => [...prev, notification]);
      toast.error('Failed to delete notification');
    }
  };

  
  
  
  



  // Helper: toggle single selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  // Helper: select all in a list
  const selectAll = (list: any[]) => {
    setSelectedIds(list.map(n => n.id));
  };
  // Helper: deselect all
  const deselectAll = () => setSelectedIds([]);
  // Helper: toggle select all
  const toggleSelectAll = (list: any[]) => {
    if (selectedIds.length === list.length) deselectAll();
    else selectAll(list);
  };
  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} notification${selectedIds.length > 1 ? 's' : ''}?`)) return;
    
    try {
      // Optimistically remove from UI first
      const notificationsToDelete = selectedIds.map(id => localNotifications.find(n => n.id === id)).filter(Boolean);
      setLocalNotifications((prev) => prev.filter(n => !selectedIds.includes(n.id)));
      
      // Delete from database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', selectedIds);
        
      if (error) {
        // If database delete failed, restore the notifications
        console.error('Error bulk deleting notifications:', error);
        setLocalNotifications((prev) => [...prev, ...notificationsToDelete]);
        toast.error('Failed to delete notifications');
      } else {
        toast.success(`${selectedIds.length} notification${selectedIds.length > 1 ? 's' : ''} deleted`);
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['notifications'] });
        await queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      }
    } catch (error) {
      // If any other error, restore the notifications
      console.error('Error in bulk delete:', error);
      const notificationsToDelete = selectedIds.map(id => localNotifications.find(n => n.id === id)).filter(Boolean);
      setLocalNotifications((prev) => [...prev, ...notificationsToDelete]);
      toast.error('Failed to delete notifications');
    } finally {
      deselectAll();
    }
  };
  const handleBulkMarkRead = () => {
    selectedIds.forEach(id => {
      const n = localNotifications.find(n => n.id === id);
      if (n && !n.is_read) handleToggleRead(n);
    });
    deselectAll();
  };

  // Add the bulk archive handler
  function handleBulkArchive() {
    selectedIds.forEach(id => {
      const n = localNotifications.find(n => n.id === id);
      if (n) handleArchive(n);
    });
    deselectAll();
  }

  // Archive/unarchive logic
  function handleArchive(notification) {
    setLocalNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, archived: true } : n));
    setDummyState(s => s + 1); // Force re-render
  }
  function handleUnarchive(notification) {
    setLocalNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, archived: false } : n));
    setDummyState(s => s + 1); // Force re-render
  }

  // 2. Add state for modal
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState(null);

  // 3. Update handleSnooze to open modal
  function handleSnooze(notification) {
    setSnoozeTarget(notification);
    setSnoozeModalOpen(true);
  }

  // 4. Add handler for modal snooze
  function handleModalSnooze(snoozeUntil) {
    setLocalNotifications(prev => prev.map(n => n.id === snoozeTarget.id ? { ...n, snoozedUntil: snoozeUntil } : n));
    setSnoozeModalOpen(false);
    setSnoozeTarget(null);
    setDummyState(s => s + 1); // Force re-render
  }

  // Filter notifications by snooze state - use reactive now
  const archivedNotifications = localNotifications.filter(n => n.archived);
  const snoozedNotifications = localNotifications.filter(n => {
    if (!n.snoozedUntil) return false;
    const snoozeDate = new Date(n.snoozedUntil);
    const currentTime = new Date();
    return snoozeDate > currentTime; // Only show if snooze time hasn't passed
  });

  // User behavior tracking (in-memory for demo)
  const [userBehavior, setUserBehavior] = useState({
    opens: {},
    deletes: {},
    important: {},
    favorites: []
  });

  function logUserAction(action, notification) {
    setUserBehavior(prev => {
      const updated = { ...prev };
      if (action === "favorite") {
        if (!updated.favorites.includes(notification.senderId)) {
          updated.favorites = [...updated.favorites, notification.senderId];
        }
      } else {
        updated[action + "s"] = { ...updated[action + "s"], [notification.type]: (updated[action + "s"][notification.type] || 0) + 1 };
      }
      return updated;
    });
  }

  function isSoon(notification) {
    if (notification.type !== "booking" || !notification.startDate) return false;
    const start = new Date(notification.startDate);
    return (start.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;
  }

  function prioritizeNotification(notification, userBehavior) {
    const classifiedType = classifyType(notification);
    let score = 0;
    if (classifiedType === "payment") score += 3;
    if (classifiedType === "booking" && isSoon(notification)) score += 4;
    if (userBehavior.favorites.includes(notification.senderId)) score += 2;
    if ((userBehavior.opens[classifiedType] || 0) > 5) score += 2;
    if ((userBehavior.deletes[classifiedType] || 0) > 3) score -= 2;
    if ((userBehavior.important[classifiedType] || 0) > 0) score += 3;
    if (notification.urgency === "high") score += 2;

    let priority = "low";
    if (score >= 5) priority = "high";
    else if (score >= 2) priority = "medium";
    return { ...notification, priority, score, classifiedType };
  }

  function getPriorityValue(priority) {
    if (priority === 'high') return 2;
    if (priority === 'medium') return 1;
    return 0;
  }

  // Prioritize and sort notifications before rendering
  const prioritizedRecent = limitedRecentNotifications.map(n => prioritizeNotification(n, userBehavior))
    .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
  const prioritizedOld = limitedOldNotifications.map(n => prioritizeNotification(n, userBehavior))
    .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));

  const prioritizedSnoozed = snoozedNotifications.map(n => prioritizeNotification(n, userBehavior))
    .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
const prioritizedArchived = archivedNotifications.map(n => prioritizeNotification(n, userBehavior))
  .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));


  function handleUnsnooze(notification) {
    setLocalNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, snoozedUntil: null } : n));
  }


  // Memoize archive and snoozed arrays to always show all archived/snoozed notifications, regardless of filter
  const memoizedArchived = useMemo(() => {
    return prioritizedArchived; // prioritizedArchived is built from all archivedNotifications
  }, [prioritizedArchived]);
  const memoizedSnoozed = useMemo(() => {
    return prioritizedSnoozed; // prioritizedSnoozed is built from all snoozedNotifications
  }, [prioritizedSnoozed]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Tabs for Notifications and Messages */}
      <div className="container mx-auto px-4 pt-6 max-w-4xl">
        <Tabs value={tab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active
              {activeNotifications.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                  {activeNotifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              Archived
              {memoizedArchived.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {memoizedArchived.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="snoozed" className="flex items-center gap-2">
              Snoozed
              {memoizedSnoozed.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                  {memoizedSnoozed.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {/* Tab Content */}
      <div>
        {tab === "active" && (
          <div className="container mx-auto px-4 py-0 max-w-4xl">
            {/* Regular Notifications Section */}
            <div>
              {/* Replace the notifications header section with the new design */}
              <div className="flex items-center justify-between mb-6">
                {/* Left group: icon, title, unread badge */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="h-7 w-7 text-purple-500" />
                    {currentSection.count > 0 && (
                      <span className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold text-base shadow-md border-2 border-white">
                        {currentSection.count}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-extrabold">{currentSection.label}</h1>
                  {currentSection.count > 0 && (
                    <span className="ml-2 px-4 py-1 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold text-base shadow inline-block">
                      {currentSection.count} unread
                    </span>
                  )}
                </div>
                {/* Right group: mark all read button, settings icon */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Mark all as read"
                    aria-label="Mark all as read"
                    type="button"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Mark all read
                  </button>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="p-2 rounded-full hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Notification Settings"
                    aria-label="Notification Settings"
                    type="button"
                  >
                    <Settings className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
              </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={handleFilterChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="active_rentals" className="flex items-center gap-2 relative">
              <Car className="h-4 w-4" />
              Active Rentals
              {unreadActiveRentals > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {unreadActiveRentals}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Status Counts */}
        {activeFilter === "bookings" && (
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Confirmed: {confirmedCount}
              </span>
              </div>
                    <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                Cancelled: {cancelledCount}
                      </span>
                    </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Pending: {pendingCount}
              </span>
                  </div>
              </div>
            )}

        {/* Recent Notifications Section */}
        <div className="bg-card rounded-lg border mb-6">
          <button
            onClick={() => setIsRecentExpanded(!isRecentExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 relative">
              {hasUnreadRecent && <span className="mail-pulse-ring"></span>}
              <Mail className={`h-5 w-5 text-primary ${hasUnreadRecent ? 'mail-pulse' : ''}`} />
              <span className="font-semibold">Recent Notifications</span>
            </div>
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${isRecentExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
          {isRecentExpanded && (
            <>
              <Separator />
                      <ScrollArea className="min-h-[3.5rem] max-h-[90vh]">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox checked={selectedIds.length === limitedRecentNotifications.length && limitedRecentNotifications.length > 0}
                      onCheckedChange={() => toggleSelectAll(limitedRecentNotifications)}
                      aria-label="Select all recent notifications"
                    />
                    <span className="text-xs text-muted-foreground">Select All</span>
                    {selectedIds.length > 0 && (
                      <div className="ml-4 flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleBulkMarkRead}>Mark as Read</Button>
                        <Button size="sm" variant="outline" onClick={handleBulkArchive}>Archive</Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Delete</Button>
                        <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
                      </div>
                    )}
                  </div>
                          {limitedRecentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mb-2" />
                      <p>No recent notifications</p>
              </div>
                  ) : (
                            prioritizedRecent.map((notification) => {
                      const classification = NotificationClassifier.classifyNotification(notification);
                      return (
                    <div 
                      key={notification.id} 
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer relative ${notification.priority === 'high' ? 'border-red-500' : notification.priority === 'medium' ? 'border-yellow-500' : 'border-gray-300'}`}
                      onClick={() => { handleNotificationClick(notification.id); logUserAction('open', notification); }}
                    >
                          <Checkbox checked={selectedIds.includes(notification.id)}
                            onClick={e => e.stopPropagation()}
                            onCheckedChange={() => toggleSelect(notification.id)}
                            aria-label="Select notification"
                            className="mt-1 mr-2"
                          />
                          <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-relaxed">
                              {notification.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(notification.created_at)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {notification.classifiedType} ({notification.score})
                              </Badge>
                              {notification.priority && (
                                <Badge
                                  variant={notification.priority === 'high' ? 'destructive' : notification.priority === 'medium' ? 'warning' : 'secondary'}
                                  className="text-xs"
                                  title={
                                    notification.priority === 'high'
                                      ? 'High priority: Important or urgent based on type, sender, and your behavior.'
                                      : notification.priority === 'medium'
                                      ? 'Medium priority: Moderately important or relevant.'
                                      : 'Low priority: Less important or less relevant to you.'
                                  }
                                >
                                  {notification.priority.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                                  </div>
                                {/* Custom Quick Actions by Type */}
                                <div className="flex gap-1 absolute bottom-2 right-2 opacity-100">
                                  {/* Mark as read/unread (all types) */}
                                  {/* Delete (all types) */}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Delete" onClick={e => { e.stopPropagation(); handleDeleteNotification(notification); }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  {/* Payment actions */}
                                  {classification.type === 'payment' && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="View receipt" onClick={e => { e.stopPropagation(); /* view receipt logic here */ }}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Booking actions */}
                                  {classification.type === 'booking' && (
                                    <>
                                      {/* Remove the View booking button */}
                                    </>
                                  )}
                                  {/* Other actions */}
                                  {classification.type === 'other' && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="View details" onClick={e => { e.stopPropagation(); handleNotificationClick(notification.id); }}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Archive/Unarchive */}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Archive" onClick={e => { e.stopPropagation(); handleArchive(notification); }}>
                                    <ArchiveIcon className="h-4 w-4" />
                                  </Button>
                                  {/* Snooze */}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Snooze" onClick={e => { e.stopPropagation(); handleSnooze(notification); }}>
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                  {/* Broaden the quick action logic for booking requests: */}
                                  {classification.type === 'booking' &&
                                    notification.type === 'booking_request' &&
                                    notification.related_booking_id &&
                                    !notification._actionTaken &&
                                    /(received|pending)/i.test(notification.content) && (
                                      <span className="flex gap-2 ml-2">
                                        <Button
                    size="sm"
                                          className="px-2 py-1 text-xs"
                                          variant="default"
                                          disabled={notification._actionLoading === 'accept'}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            setLocalNotifications((prev) => prev.map(n => n.id === notification.id ? { ...n, _actionLoading: 'accept', _actionTaken: 'accepted' } : n));
                                            try {
                                              const { error } = await supabase
                                                .from('bookings')
                                                .update({ status: 'confirmed' })
                                                .eq('id', notification.related_booking_id);
                                              if (error) throw error;
                                              setTimeout(() => {
                                                setLocalNotifications((prev) => prev.filter(n => n.id !== notification.id));
                                              }, 1200);
                                            } catch (err) {
                                              toast.error('Failed to accept booking request.');
                                              setLocalNotifications((prev) => prev.map(n => n.id === notification.id ? { ...n, _actionLoading: null, _actionTaken: null } : n));
                                            }
                                          }}
                                        >
                                          {notification._actionLoading === 'accept' ? 'Accepting...' : 'Accept'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="px-2 py-1 text-xs"
                                          variant="destructive"
                                          disabled={notification._actionLoading === 'decline'}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            setLocalNotifications((prev) => prev.map(n => n.id === notification.id ? { ...n, _actionLoading: 'decline', _actionTaken: 'declined' } : n));
                                            try {
                                              const { error } = await supabase
                                                .from('bookings')
                                                .update({ status: 'cancelled' })
                                                .eq('id', notification.related_booking_id);
                                              if (error) throw error;
                                              setTimeout(() => {
                                                setLocalNotifications((prev) => prev.filter(n => n.id !== notification.id));
                                              }, 1200);
                                            } catch (err) {
                                              toast.error('Failed to decline booking request.');
                                              setLocalNotifications((prev) => prev.map(n => n.id === notification.id ? { ...n, _actionLoading: null, _actionTaken: null } : n));
                                            }
                                          }}
                                        >
                                          {notification._actionLoading === 'decline' ? 'Declining...' : 'Decline'}
                                        </Button>
                                        {notification._actionTaken && (
                                          <Badge variant={notification._actionTaken === 'accepted' ? 'default' : 'destructive'} className="ml-2">
                                            {notification._actionTaken === 'accepted' ? 'Accepted' : 'Declined'}
                                          </Badge>
                                        )}
                                      </span>
                                  )}
                          </div>
                        {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
                        )}
                      </div>
        {/* Older Notifications Section */}
        <div className="bg-card rounded-lg border">
          <button
            onClick={() => setIsOldExpanded(!isOldExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Older Notifications</span>
            </div>
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${isOldExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
          {isOldExpanded && (
            <>
              <Separator />
                      <ScrollArea className="min-h-[3.5rem] max-h-[90vh]">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox checked={selectedIds.length === limitedOldNotifications.length && limitedOldNotifications.length > 0}
                      onCheckedChange={() => toggleSelectAll(limitedOldNotifications)}
                      aria-label="Select all older notifications"
                    />
                    <span className="text-xs text-muted-foreground">Select All</span>
                    {selectedIds.length > 0 && (
                      <div className="ml-4 flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleBulkMarkRead}>Mark as Read</Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Delete</Button>
                        <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
                      </div>
                    )}
                  </div>
                          {limitedOldNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mb-2" />
                      <p>No older notifications</p>
                    </div>
                  ) : (
                          prioritizedOld.map((notification) => {
                      const classification = NotificationClassifier.classifyNotification(notification);
                      return (
                        <div
                          key={notification.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer relative ${notification.priority === 'high' ? 'border-red-500' : notification.priority === 'medium' ? 'border-yellow-500' : 'border-gray-300'}`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <Checkbox checked={selectedIds.includes(notification.id)}
                            onClick={e => e.stopPropagation()}
                            onCheckedChange={() => toggleSelect(notification.id)}
                            aria-label="Select notification"
                            className="mt-1 mr-2"
                          />
                          <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-relaxed">
                              {notification.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(notification.created_at)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {notification.classifiedType} ({notification.score})
                              </Badge>
                              {notification.priority && (
                                <Badge
                                  variant={notification.priority === 'high' ? 'destructive' : notification.priority === 'medium' ? 'warning' : 'secondary'}
                                  className="text-xs"
                                  title={
                                    notification.priority === 'high'
                                      ? 'High priority: Important or urgent based on type, sender, and your behavior.'
                                      : notification.priority === 'medium'
                                      ? 'Medium priority: Moderately important or relevant.'
                                      : 'Low priority: Less important or less relevant to you.'
                                  }
                                >
                                  {notification.priority.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                                {/* Custom Quick Actions by Type */}
                                <div className="flex gap-1 absolute bottom-2 right-2 opacity-100">
                                  {/* Mark as read/unread (all types) */}
                                  {/* Delete (all types) */}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Delete" onClick={e => { e.stopPropagation(); handleDeleteNotification(notification); }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  {/* Payment actions */}
                                  {classification.type === 'payment' && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="View receipt" onClick={e => { e.stopPropagation(); /* view receipt logic here */ }}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Booking actions */}
                                  {classification.type === 'booking' && (
                                    <>
                                      {/* Remove the View booking button */}
                                    </>
                                  )}
                                  {/* Other actions */}
                                  {classification.type === 'other' && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="View details" onClick={e => { e.stopPropagation(); handleNotificationClick(notification.id); }}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Archive/Unarchive */}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Archive" onClick={e => { e.stopPropagation(); handleArchive(notification); }}>
                                    <ArchiveIcon className="h-4 w-4" />
                                  </Button>
                          </div>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
              </div>

      
            {/* Notification Settings Modal */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                  <DialogDescription>Manage your notification preferences</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-2">
                  {/* Auto mark as read */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto mark as read</div>
                      <div className="text-sm text-muted-foreground">Automatically mark notifications as read when viewed</div>
                    </div>
                    <Switch checked={autoMarkRead} onCheckedChange={setAutoMarkRead} />
                  </div>
                  {/* Sound notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sound notifications</div>
                      <div className="text-sm text-muted-foreground">Play sound when new notifications arrive</div>
                    </div>
                    <Switch checked={soundNotifications} onCheckedChange={setSoundNotifications} />
                  </div>
                  {/* Collapse groups by default */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Collapse groups by default</div>
                      <div className="text-sm text-muted-foreground">New notification groups will be collapsed</div>
                    </div>
                    <Switch checked={collapseGroups} onCheckedChange={setCollapseGroups} />
                  </div>
                  <Separator />
                  {/* Maximum notifications */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Maximum notifications</div>
                      <div className="text-sm text-muted-foreground">Keep up to {maxNotifications} notifications</div>
                    </div>
                    <Slider min={10} max={200} step={1} value={[maxNotifications]} onValueChange={v => setMaxNotifications(v[0])} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {tab === "archived" && (
          <div className="container mx-auto px-4 py-0 max-w-4xl">
            {/* Archive Header with Count */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ArchiveIcon className="h-7 w-7 text-blue-500" />
                  {memoizedArchived.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-base shadow-md border-2 border-white">
                      {memoizedArchived.length}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold">Archived Notifications</h1>
                {memoizedArchived.length > 0 && (
                  <span className="ml-2 px-4 py-1 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold text-base shadow inline-block">
                    {memoizedArchived.length} archived
                  </span>
                )}
              </div>
            </div>
            
            {memoizedArchived.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>No archived notifications</p>
              </div>
            ) : (
              <List
                height={Math.min(400, memoizedArchived.length * 80)}
                itemCount={memoizedArchived.length}
                itemSize={80}
                width={"100%"}
                onItemsRendered={({ visibleStopIndex }) => {
                  if (visibleStopIndex >= memoizedArchived.length - 5 && hasMoreNotifications) handleLoadMoreNotifications();
                }}
              >
                {({ index, style }) => {
                  const notification = memoizedArchived[index];
                  const classification = NotificationClassifier.classifyNotification(notification);
                  return (
                    <div style={style} className="p-2">
                      <div 
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer relative ${notification.priority === 'high' ? 'border-red-500' : notification.priority === 'medium' ? 'border-yellow-500' : 'border-gray-300'}`}
                        onClick={() => { handleNotificationClick(notification.id); logUserAction('open', notification); }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-relaxed">
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {notification.classifiedType} ({notification.score})
                            </Badge>
                            {notification.priority && (
                              <Badge
                                variant={notification.priority === 'high' ? 'destructive' : notification.priority === 'medium' ? 'warning' : 'secondary'}
                                className="text-xs"
                                title={
                                  notification.priority === 'high'
                                    ? 'High priority: Important or urgent based on type, sender, and your behavior.'
                                    : notification.priority === 'medium'
                                    ? 'Medium priority: Moderately important or relevant.'
                                    : 'Low priority: Less important or less relevant to you.'
                                }
                              >
                                {notification.priority.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          </div>
                        {/* Actions for archived notifications */}
                        <div className="flex gap-1 absolute bottom-2 right-2 opacity-100">
                          {/* Unarchive */}
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Unarchive" onClick={e => { e.stopPropagation(); handleUnarchive(notification); }}>
                            <ArchiveIcon className="h-4 w-4" />
                          </Button>
                          {/* Delete */}
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Delete" onClick={e => { e.stopPropagation(); handleDeleteNotification(notification); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                }}
              </List>
            )}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Skeleton className="h-8 w-8 rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
        {tab === "snoozed" && (
          <div className="container mx-auto px-4 py-0 max-w-4xl">
            {/* Snoozed Header with Count */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Clock className="h-7 w-7 text-amber-500" />
                  {memoizedSnoozed.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-base shadow-md border-2 border-white">
                      {memoizedSnoozed.length}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold">Snoozed Notifications</h1>
                {memoizedSnoozed.length > 0 && (
                  <span className="ml-2 px-4 py-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold text-base shadow inline-block">
                    {memoizedSnoozed.length} snoozed
                  </span>
                )}
              </div>
            </div>
            
            {memoizedSnoozed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>No snoozed notifications</p>
              </div>
            ) : (
              <List
                height={Math.min(400, memoizedSnoozed.length * 80)}
                itemCount={memoizedSnoozed.length}
                itemSize={80}
                width={"100%"}
                onItemsRendered={({ visibleStopIndex }) => {
                  if (visibleStopIndex >= memoizedSnoozed.length - 5 && hasMoreNotifications) handleLoadMoreNotifications();
                }}
              >
                {({ index, style }) => {
                  const notification = memoizedSnoozed[index];
                  const classification = NotificationClassifier.classifyNotification(notification);
                  return (
                    <div style={style} className="p-2">
                      <div 
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer relative ${notification.priority === 'high' ? 'border-red-500' : notification.priority === 'medium' ? 'border-yellow-500' : 'border-gray-300'}`}
                        onClick={() => { handleNotificationClick(notification.id); logUserAction('open', notification); }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-relaxed">
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {notification.classifiedType} ({notification.score})
                            </Badge>
                            {notification.priority && (
                              <Badge
                                variant={notification.priority === 'high' ? 'destructive' : notification.priority === 'medium' ? 'warning' : 'secondary'}
                                className="text-xs"
                                title={
                                  notification.priority === 'high'
                                    ? 'High priority: Important or urgent based on type, sender, and your behavior.'
                                    : notification.priority === 'medium'
                                    ? 'Medium priority: Moderately important or relevant.'
                                    : 'Low priority: Less important or less relevant to you.'
                                }
                              >
                                {notification.priority.toUpperCase()}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              Snoozed until {formatDate(notification.snoozedUntil)}
                            </Badge>
                          </div>
                        </div>
                        {/* Actions for snoozed notifications */}
                        <div className="flex gap-1 absolute bottom-2 right-2 opacity-100">
                          {/* Unsnooze */}
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Unsnooze" onClick={e => { e.stopPropagation(); handleUnsnooze(notification); }}>
                            <Clock className="h-4 w-4" />
                          </Button>
                          {/* Archive */}
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Archive" onClick={e => { e.stopPropagation(); handleArchive(notification); }}>
                            <ArchiveIcon className="h-4 w-4" />
                          </Button>
                          {/* Delete */}
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Delete" onClick={e => { e.stopPropagation(); handleDeleteNotification(notification); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                            </div>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                          )}
                        </div>
                      </div>
                  );
                }}
              </List>
            )}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Skeleton className="h-8 w-8 rounded-full animate-spin" />
                </div>
              )}
            </div>
        )}
        
      </div>
      {/* 6. Render the modal at the root of the component: */}
      <SnoozeModal
        open={snoozeModalOpen}
        onClose={() => setSnoozeModalOpen(false)}
        onSnooze={handleModalSnooze}
        notification={snoozeTarget}
      />
    </div>
  );
}
