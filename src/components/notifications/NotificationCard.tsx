import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Car, 
  CreditCard, 
  MessageSquare, 
  Calendar,
  Check,
  X,
  Eye,
  Trash2,
  ChevronRight
} from "lucide-react";
import { NotificationClassifier } from "@/utils/NotificationClassifier";
import { useNavigate } from "react-router-dom";

interface NotificationCardProps {
  notification: any;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAcceptBooking?: (bookingId: string) => void;
  onDeclineBooking?: (bookingId: string) => void;
  compact?: boolean;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onAcceptBooking,
  onDeclineBooking,
  compact = false
}: NotificationCardProps) {
  const navigate = useNavigate();
  const classification = NotificationClassifier.classifyNotification(notification);

  const getIcon = () => {
    switch (classification.type) {
      case 'booking':
        return <Car className="h-5 w-5" />;
      case 'payment':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getIconColor = () => {
    switch (classification.type) {
      case 'booking':
        if (notification.type === 'booking_confirmed') return 'text-green-600';
        if (notification.type === 'booking_cancelled') return 'text-red-600';
        return 'text-blue-600';
      case 'payment':
        return 'text-emerald-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = () => {
    switch (classification.type) {
      case 'booking':
        if (notification.type === 'booking_confirmed') return 'default';
        if (notification.type === 'booking_cancelled') return 'destructive';
        return 'secondary';
      case 'payment':
        return 'default';
      default:
        return 'outline';
    }
  };

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.related_booking_id) {
      navigate(`/bookings/${notification.related_booking_id}`);
    } else if (classification.type === 'payment') {
      navigate('/wallet');
    } else {
      navigate(`/notifications/${notification.id}`);
    }
  };

  const showBookingActions = 
    notification.type === 'booking_request' && 
    !notification.is_read &&
    onAcceptBooking && 
    onDeclineBooking;

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md cursor-pointer
        ${!notification.is_read ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'}
        ${compact ? 'p-3' : ''}
      `}
      onClick={handleClick}
    >
      <CardContent className={compact ? 'p-0' : 'p-4'}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`mt-1 ${getIconColor()}`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                  {notification.content}
                </p>
                
                {/* Car/Booking details if available */}
                {notification.bookings?.cars && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.bookings.cars.brand} {notification.bookings.cars.model}
                  </p>
                )}
              </div>

              {/* Badge and timestamp */}
              <div className="flex flex-col items-end gap-1">
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {classification.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Booking Actions */}
            {showBookingActions && (
              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  onClick={() => onAcceptBooking(notification.related_booking_id)}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeclineBooking(notification.related_booking_id)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            {!compact && (
              <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                {!notification.is_read && onMarkAsRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Mark as read
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(notification.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}

                <div className="flex-1" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}