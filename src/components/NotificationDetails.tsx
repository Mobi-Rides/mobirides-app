import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingView } from '@/components/home/LoadingView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, User, MessageSquare, Car, Wallet, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { NotificationClassifier } from '@/utils/NotificationClassifier';
import type { Database } from '@/integrations/supabase/types';
import { normalizeNotification, type NormalizedNotification } from '@/utils/notificationHelpers';

type Notification = Database['public']['Tables']['notifications']['Row'];

export const NotificationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notification, isLoading, error } = useQuery<NormalizedNotification>({
    queryKey: ['notification', id],
    queryFn: async () => {
      if (!id) throw new Error('Notification ID is required');
      
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) throw new Error('Invalid notification ID');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', numericId)
        .single();

      if (error) throw error;
      return normalizeNotification(data);
    },
    enabled: !!id,
  });

  // Mark notification as read when viewed
  React.useEffect(() => {
    if (notification && !notification.is_read) {
      const markAsRead = async () => {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
      };
      markAsRead();
    }
  }, [notification]);

  if (!id) {
    return <Navigate to="/notifications" replace />;
  }

  if (isLoading) {
    return <LoadingView />;
  }

  if (error || !notification) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Notification Not Found</h1>
          <p className="text-muted-foreground mb-4">The notification you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/notifications')}>Back to Notifications</Button>
        </div>
      </div>
    );
  }

  // Check if user has permission to view this notification
  if (user?.id !== notification.user_id) {
    return <Navigate to="/notifications" replace />;
  }

  const getNotificationIcon = (notification: NormalizedNotification) => {
    const classification = NotificationClassifier.classifyNotification(notification);
    switch (classification.type) {
      case 'booking':
        return <Car className="h-5 w-5" />;
      case 'payment':
        return <Wallet className="h-5 w-5" />;
      case 'handover':
        return <MapPin className="h-5 w-5" />;
      case 'system':
        return <Bell className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (notification: NormalizedNotification) => {
    const classification = NotificationClassifier.classifyNotification(notification);
    switch (classification.type) {
      case 'booking':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'handover':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
  };

  const handleRelatedAction = (notification: NormalizedNotification) => {
    if (notification.related_booking_id) {
      navigate(`/bookings/${notification.related_booking_id}`);
    } else if (NotificationClassifier.isPaymentNotification(notification)) {
      navigate('/wallet');
    } else if (NotificationClassifier.isActiveRentalNotification(notification)) {
      navigate('/map');
    }
  };

  const hasRelatedAction = (notification: NormalizedNotification) => {
    return notification.related_booking_id || 
      NotificationClassifier.isPaymentNotification(notification) ||
      NotificationClassifier.isActiveRentalNotification(notification);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/notifications')}
          className="mb-4"
        >
          ← Back to Notifications
        </Button>
        <h1 className="text-3xl font-bold">Notification Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getNotificationIcon(notification)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span>Notification</span>
                <Badge className={getNotificationColor(notification)}>
                  {NotificationClassifier.classifyNotification(notification).type}
                </Badge>
                {!notification.is_read && (
                  <Badge variant="secondary">New</Badge>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Content */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{notification.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{notification.description}</p>
          </div>

          {/* Metadata */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Created:</span>
              <span>{formatDate(notification.created_at)}</span>
            </div>
            
            {notification.is_read && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">Status:</span>
                <span>Read</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Type:</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {notification.type}
              </span>
            </div>

            {notification.related_booking_id && (
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4" />
                <span className="font-medium">Related Booking:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  #{notification.related_booking_id}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {hasRelatedAction(notification) && (
            <div className="pt-4 border-t">
              <Button onClick={() => handleRelatedAction(notification)} className="w-full">
                {notification.related_booking_id && 'View Booking Details'}
                {!notification.related_booking_id && NotificationClassifier.isPaymentNotification(notification) && 'View Wallet'}
                {!notification.related_booking_id && NotificationClassifier.isActiveRentalNotification(notification) && 'View on Map'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDetails;