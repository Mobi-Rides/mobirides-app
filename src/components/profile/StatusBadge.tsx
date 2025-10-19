import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Circle } from "lucide-react";

interface StatusBadgeProps {
  status: 'verified' | 'pending' | 'rejected' | 'not_started';
  size?: 'sm' | 'md';
}

const STATUS_CONFIG = {
  verified: { 
    color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20', 
    icon: CheckCircle, 
    label: 'Verified' 
  },
  pending: { 
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20', 
    icon: Clock, 
    label: 'Pending' 
  },
  rejected: { 
    color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20', 
    icon: XCircle, 
    label: 'Rejected' 
  },
  not_started: { 
    color: 'bg-muted text-muted-foreground border-muted', 
    icon: Circle, 
    label: 'Not Started' 
  }
};

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
    >
      <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      {config.label}
    </Badge>
  );
};
