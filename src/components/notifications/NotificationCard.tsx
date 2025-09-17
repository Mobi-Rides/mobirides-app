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
  ChevronRight,
  Wallet,
  RefreshCw,
  MapPin
} from "lucide-react";
import { NotificationClassifier } from "@/utils/NotificationClassifier";
import { NormalizedNotification } from "@/utils/notificationHelpers";
import { formatMetadataForDisplay } from "@/utils/notificationMetadataHandler";
import { useNavigate } from "react-router-dom";

interface NotificationCardProps {
  notification: NormalizedNotification;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
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
  const { summary, actions, metadata } = formatMetadataForDisplay(notification);

  const getIcon = () => {
    switch (classification.type) {
      case 'booking':
        return <Car className="h-5 w-5" />;
      case 'payment':
        return <CreditCard className="h-5 w-5" />;
      case 'handover':
        return <Calendar className="h-5 w-5" />;
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getIconColor = () => {
    switch (classification.type) {
      case 'booking':
        if (notification.type.includes('booking_confirmed')) return 'text-green-600';
        if (notification.type.includes('booking_cancelled')) return 'text-red-600';
        return 'text-blue-600';
      case 'payment':
        return 'text-emerald-600';
      case 'handover':
        return 'text-orange-600';
      case 'message':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = () => {
    switch (classification.type) {
      case 'booking':
        if (notification.type.includes('booking_confirmed')) return 'default';
        if (notification.type.includes('booking_cancelled')) return 'destructive';
        return 'secondary';
      case 'payment':
        return 'default';
      case 'handover':
        return 'secondary';
      case 'message':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Intelligent routing based on notification type and classification
    if (NotificationClassifier.isHandoverNotification(notification)) {
      // Route handover notifications to map with booking context
      if (notification.related_booking_id) {
        navigate(`/map?booking=${notification.related_booking_id}&handover=true`);
      } else {
        navigate('/map');
      }
    } else if (NotificationClassifier.isActiveRentalNotification(notification)) {
      // Active rental notifications go to rental details
      if (notification.related_booking_id) {
        navigate(`/rental-details/${notification.related_booking_id}`);
      } else {
        navigate(`/notifications/${notification.id}`);
      }
    } else if (classification.type === 'booking' && notification.related_booking_id) {
      // Booking notifications go to booking details
      navigate(`/bookings/${notification.related_booking_id}`);
    } else if (classification.type === 'payment' || NotificationClassifier.isPaymentNotification(notification)) {
      // Payment notifications go to wallet
      navigate('/wallet');
    } else if (NotificationClassifier.isMessageNotification(notification)) {
      // Message notifications go to messages
      navigate('/messages');
    } else {
      // Default to notification details
      navigate(`/notifications/${notification.id}`);
    }
  };

  // Removed showBookingActions - all actions now handled through metadata-driven system

  const handleMetadataAction = (action: string) => {
    switch (action) {
      case 'accept_booking':
        if (onAcceptBooking && notification.related_booking_id) {
          onAcceptBooking(notification.related_booking_id);
        }
        break;
      case 'decline_booking':
        if (onDeclineBooking && notification.related_booking_id) {
          onDeclineBooking(notification.related_booking_id);
        }
        break;
      case 'view_booking':
        if (notification.related_booking_id) {
          navigate(`/bookings/${notification.related_booking_id}`);
        }
        break;
      case 'view_wallet':
        navigate('/wallet');
        break;
      case 'view_messages':
        navigate('/messages');
        break;
      case 'view_map':
        if (notification.related_booking_id) {
          navigate(`/map?booking=${notification.related_booking_id}&handover=true`);
        } else {
          navigate('/map');
        }
        break;
      case 'view_rental':
        if (notification.related_booking_id) {
          navigate(`/rental-details/${notification.related_booking_id}`);
        }
        break;
      case 'retry_payment':
        // Handle payment retry logic
        navigate('/wallet');
        break;
      default:
        break;
    }
  };

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Check': return <Check className="h-4 w-4" />;
      case 'X': return <X className="h-4 w-4" />;
      case 'Eye': return <Eye className="h-4 w-4" />;
      case 'Wallet': return <Wallet className="h-4 w-4" />;
      case 'RefreshCw': return <RefreshCw className="h-4 w-4" />;
      case 'MapPin': return <MapPin className="h-4 w-4" />;
      case 'MessageSquare': return <MessageSquare className="h-4 w-4" />;
      case 'Car': return <Car className="h-4 w-4" />;
      default: return null;
    }
  };

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
                <h4 className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                  {notification.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.description}
                </p>
                
                {/* Enhanced metadata display */}
                {summary.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {summary.map((item, index) => (
                      <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                        {item}
                      </p>
                    ))}
                  </div>
                )}
                
                {/* Fallback: Car/Booking details if available and no metadata summary */}
                {summary.length === 0 && notification.bookings && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.bookings.brand} {notification.bookings.model}
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

            {/* Booking Actions removed - now handled through metadata-driven actions */}

            {/* Enhanced Actions */}
            {!compact && (
              <div className="space-y-2 mt-3" onClick={(e) => e.stopPropagation()}>
                {/* Metadata-driven action buttons */}
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {actions.slice(0, 2).map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={action.variant || 'outline'}
                        onClick={() => handleMetadataAction(action.action)}
                        className="flex-1 min-w-0"
                      >
                        {action.icon && getActionIcon(action.icon)}
                        {action.icon && <span className="ml-1" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Additional actions if more than 2 */}
                {actions.length > 2 && (
                  <div className="flex flex-wrap gap-2">
                    {actions.slice(2).map((action, index) => (
                      <Button
                        key={index + 2}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMetadataAction(action.action)}
                        className="flex-1 min-w-0"
                      >
                        {action.icon && getActionIcon(action.icon)}
                        {action.icon && <span className="ml-1" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Standard actions - only show if not already in metadata actions */}
                {(actions.length === 0 || (!actions.some(a => a.action === 'mark_as_read') && !actions.some(a => a.action === 'delete'))) && (
                  <div className="flex items-center gap-2">
                    {!notification.is_read && onMarkAsRead && !actions.some(a => a.action === 'mark_as_read') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Mark as read
                      </Button>
                    )}
                    
                    {onDelete && !actions.some(a => a.action === 'delete') && (
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}