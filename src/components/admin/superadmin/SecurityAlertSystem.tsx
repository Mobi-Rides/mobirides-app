import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Bell, 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  X,
  Settings,
  RefreshCw,
  BellOff
} from "lucide-react";
import { toast } from "sonner";

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'system' | 'user' | 'api';
  timestamp: Date;
  source: string;
  action_required: boolean;
  acknowledged: boolean;
  auto_dismiss: boolean;
  metadata?: Record<string, any>;
}

export interface AlertSettings {
  enabled: boolean;
  critical_alerts: boolean;
  high_alerts: boolean;
  medium_alerts: boolean;
  low_alerts: boolean;
  sound_enabled: boolean;
  desktop_notifications: boolean;
  email_notifications: boolean;
  auto_dismiss_delay: number; // seconds
}

interface Props {
  alerts: SecurityAlert[];
  settings?: AlertSettings;
  onAlertAcknowledge: (alertId: string) => void;
  onAlertDismiss: (alertId: string) => void;
  onSettingsChange: (settings: AlertSettings) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const ALERT_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    sound: true,
    auto_dismiss: false
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    sound: true,
    auto_dismiss: false
  },
  medium: {
    icon: Info,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    sound: false,
    auto_dismiss: true
  },
  low: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    sound: false,
    auto_dismiss: true
  }
};

export function SecurityAlertSystem({ 
  alerts, 
  settings = {
    enabled: true,
    critical_alerts: true,
    high_alerts: true,
    medium_alerts: true,
    low_alerts: false,
    sound_enabled: true,
    desktop_notifications: true,
    email_notifications: false,
    auto_dismiss_delay: 10
  },
  onAlertAcknowledge,
  onAlertDismiss,
  onSettingsChange,
  onRefresh,
  loading = false
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [filteredAlerts, setFilteredAlerts] = useState<SecurityAlert[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  useEffect(() => {
    // Filter alerts based on settings
    const filtered = alerts.filter(alert => {
      if (!settings.enabled) return false;
      
      switch (alert.severity) {
        case 'critical':
          return settings.critical_alerts;
        case 'high':
          return settings.high_alerts;
        case 'medium':
          return settings.medium_alerts;
        case 'low':
          return settings.low_alerts;
        default:
          return true;
      }
    });
    
    setFilteredAlerts(filtered);
    setUnacknowledgedCount(filtered.filter(alert => !alert.acknowledged).length);
  }, [alerts, settings]);

  useEffect(() => {
    // Show toast notifications for new critical/high alerts
    filteredAlerts.forEach(alert => {
      if (!alert.acknowledged && (alert.severity === 'critical' || alert.severity === 'high')) {
        const config = ALERT_CONFIG[alert.severity];
        
        toast.custom(
          (t) => (
            <Alert className={`${config.bgColor} ${config.borderColor} border`}>
              <config.icon className={`h-4 w-4 ${config.color}`} />
              <AlertTitle className={config.color}>
                {alert.title}
              </AlertTitle>
              <AlertDescription>
                {alert.description}
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onAlertAcknowledge(alert.id);
                      toast.dismiss(t);
                    }}
                    className="text-xs"
                  >
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.dismiss(t)}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ),
          {
            duration: config.auto_dismiss ? settings.auto_dismiss_delay * 1000 : Infinity,
            position: 'top-right'
          }
        );
      }
    });
  }, [filteredAlerts, settings, onAlertAcknowledge]);

  const handleSettingsChange = (key: keyof AlertSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  const getSeverityBadge = (severity: string) => {
    const config = ALERT_CONFIG[severity as keyof typeof ALERT_CONFIG];
    return (
      <Badge variant="outline" className={`${config.color} ${config.bgColor} border-current`}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      system: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      api: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    
    return (
      <Badge className={categoryColors[category as keyof typeof categoryColors] || ''}>
        {category}
      </Badge>
    );
  };

  if (!settings.enabled) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <BellOff className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Alerts Disabled</h3>
              <p className="text-gray-500 dark:text-gray-400">Enable alerts in settings to receive security notifications</p>
            </div>
            <Button onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold">Security Alerts</h3>
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unacknowledgedCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Alert Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Levels</label>
                <div className="space-y-2">
                  {Object.entries({
                    critical_alerts: 'Critical Alerts',
                    high_alerts: 'High Alerts',
                    medium_alerts: 'Medium Alerts',
                    low_alerts: 'Low Alerts'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings[key as keyof AlertSettings] as boolean}
                        onChange={(e) => handleSettingsChange(key as keyof AlertSettings, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Settings</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.sound_enabled}
                      onChange={(e) => handleSettingsChange('sound_enabled', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Sound Notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.desktop_notifications}
                      onChange={(e) => handleSettingsChange('desktop_notifications', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Desktop Notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => handleSettingsChange('email_notifications', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Email Notifications</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-dismiss Delay (seconds)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.auto_dismiss_delay}
                onChange={(e) => handleSettingsChange('auto_dismiss_delay', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Shield className="h-12 w-12 text-green-500 mx-auto" />
                <h4 className="text-lg font-semibold text-green-700 dark:text-green-300">No Security Alerts</h4>
                <p className="text-gray-500 dark:text-gray-400">All systems are operating normally</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Alert 
              key={alert.id} 
              className={`${ALERT_CONFIG[alert.severity].bgColor} ${ALERT_CONFIG[alert.severity].borderColor} border`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {React.createElement(ALERT_CONFIG[alert.severity].icon, {
                    className: `h-5 w-5 ${ALERT_CONFIG[alert.severity].color}`
                  })}
                </div>
                <div className="flex-1">
                  <AlertTitle className="flex items-center space-x-2">
                    <span>{alert.title}</span>
                    {getSeverityBadge(alert.severity)}
                    {getCategoryBadge(alert.category)}
                  </AlertTitle>
                  <AlertDescription>
                    <p>{alert.description}</p>
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>Source: {alert.source}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    
                    {alert.action_required && !alert.acknowledged && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => onAlertAcknowledge(alert.id)}
                          className="text-xs"
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAlertDismiss(alert.id)}
                          className="text-xs"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>
    </div>
  );
}