import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Search, Car, User, ArrowRight, Send, Users, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface NotificationCampaignBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CampaignData {
  name: string;
  description: string;
  target_audience: {
    user_roles: string[];
    registration_date_range?: {
      start: string;
      end: string;
    };
    activity_filters?: {
      last_login_days?: number;
      booking_count_min?: number;
    };
  };
  content: {
    title: string;
    message: string;
    action_url?: string;
    action_text?: string;
  };
  schedule: {
    send_immediately: boolean;
    scheduled_date?: string;
    timezone: string;
  };
  settings: {
    priority: "low" | "medium" | "high" | "urgent";
    allow_unsubscribe: boolean;
    track_opens: boolean;
    track_clicks: boolean;
  };
}

interface CampaignValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
  estimated_recipients: number;
}

export const NotificationCampaignBuilder: React.FC<NotificationCampaignBuilderProps> = ({
  isOpen,
  onClose,
}) => {
  const [campaign, setCampaign] = useState<CampaignData>({
    name: "",
    description: "",
    target_audience: {
      user_roles: [],
    },
    content: {
      title: "",
      message: "",
    },
    schedule: {
      send_immediately: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    settings: {
      priority: "medium",
      allow_unsubscribe: true,
      track_opens: true,
      track_clicks: true,
    },
  });

  const [validationResult, setValidationResult] = useState<CampaignValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const queryClient = useQueryClient();

  // Validate campaign using RPC function
  const validateCampaign = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_campaign_audience' as any, {
        p_user_roles: campaign.target_audience.user_roles,
        p_registration_start: campaign.target_audience.registration_date_range?.start || null,
        p_registration_end: campaign.target_audience.registration_date_range?.end || null,
        p_last_login_days: campaign.target_audience.activity_filters?.last_login_days || null,
        p_booking_count_min: campaign.target_audience.activity_filters?.booking_count_min || null,
      });

      if (error) throw error;

      const result = data as { valid: boolean; warnings: string[]; errors: string[]; estimated_recipients: number };
      const validation: CampaignValidation = {
        valid: result.valid,
        warnings: result.warnings || [],
        errors: result.errors || [],
        estimated_recipients: result.estimated_recipients || 0
      };
      
      setValidationResult(validation);
      toast.success("Campaign validated successfully");
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate campaign");
    } finally {
      setIsValidating(false);
    }
  };

  // Create campaign mutation using RPC function
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!campaign.name.trim() || !campaign.content.title.trim() || !campaign.content.message.trim()) {
        throw new Error("Required fields are missing");
      }

      const { data, error } = await supabase.rpc('create_notification_campaign' as any, {
        p_campaign_name: campaign.name,
        p_campaign_description: campaign.description,
        p_user_roles: campaign.target_audience.user_roles,
        p_title: campaign.content.title,
        p_message: campaign.content.message,
        p_action_url: campaign.content.action_url || null,
        p_action_text: campaign.content.action_text || null,
        p_priority: campaign.settings.priority,
        p_send_immediately: campaign.schedule.send_immediately,
        p_scheduled_date: campaign.schedule.scheduled_date || null,
        p_registration_start: campaign.target_audience.registration_date_range?.start || null,
        p_registration_end: campaign.target_audience.registration_date_range?.end || null,
        p_last_login_days: campaign.target_audience.activity_filters?.last_login_days || null,
        p_booking_count_min: campaign.target_audience.activity_filters?.booking_count_min || null,
        p_metadata: {
          allow_unsubscribe: campaign.settings.allow_unsubscribe,
          track_opens: campaign.settings.track_opens,
          track_clicks: campaign.settings.track_clicks,
        },
      });

      if (error) throw error;
      return data as { success: boolean; campaign_id: string; notifications_created: number; total_recipients: number };
    },
    onSuccess: (data) => {
      toast.success(`Campaign created! ${data.notifications_created} notifications sent to ${data.total_recipients} recipients.`);
      queryClient.invalidateQueries({ queryKey: ["notification-campaigns"] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const resetForm = () => {
    setCampaign({
      name: "",
      description: "",
      target_audience: {
        user_roles: [],
      },
      content: {
        title: "",
        message: "",
      },
      schedule: {
        send_immediately: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      settings: {
        priority: "medium",
        allow_unsubscribe: true,
        track_opens: true,
        track_clicks: true,
      },
    });
    setValidationResult(null);
  };

  const handleCreateCampaign = async () => {
    if (!validationResult?.valid) {
      toast.error("Please validate the campaign before creating");
      return;
    }
    setIsCreating(true);
    try {
      await createCampaignMutation.mutateAsync();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const updateCampaign = (updates: Partial<CampaignData>) => {
    setCampaign(prev => ({ ...prev, ...updates }));
    setValidationResult(null); // Reset validation when campaign changes
  };

  const updateTargetAudience = (updates: Partial<CampaignData["target_audience"]>) => {
    updateCampaign({
      target_audience: { ...campaign.target_audience, ...updates }
    });
  };

  const updateContent = (updates: Partial<CampaignData["content"]>) => {
    updateCampaign({
      content: { ...campaign.content, ...updates }
    });
  };

  const updateSchedule = (updates: Partial<CampaignData["schedule"]>) => {
    updateCampaign({
      schedule: { ...campaign.schedule, ...updates }
    });
  };

  const updateSettings = (updates: Partial<CampaignData["settings"]>) => {
    updateCampaign({
      settings: { ...campaign.settings, ...updates }
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Create Notification Campaign
          </DialogTitle>
          <DialogDescription>
            Create and schedule notification campaigns for targeted user groups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Enter campaign name..."
                    value={campaign.name}
                    onChange={(e) => updateCampaign({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-priority">Priority</Label>
                  <Select
                    value={campaign.settings.priority}
                    onValueChange={(value: CampaignData["settings"]["priority"]) =>
                      updateSettings({ priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea
                  id="campaign-description"
                  placeholder="Describe the purpose of this campaign..."
                  value={campaign.description}
                  onChange={(e) => updateCampaign({ description: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>User Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {["renter", "host", "admin", "super_admin"].map((role) => (
                    <Badge
                      key={role}
                      variant={campaign.target_audience.user_roles.includes(role) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const roles = campaign.target_audience.user_roles.includes(role)
                          ? campaign.target_audience.user_roles.filter(r => r !== role)
                          : [...campaign.target_audience.user_roles, role];
                        updateTargetAudience({ user_roles: roles });
                      }}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-bookings">Minimum Bookings</Label>
                  <Input
                    id="min-bookings"
                    type="number"
                    placeholder="0"
                    value={campaign.target_audience.activity_filters?.booking_count_min || ""}
                    onChange={(e) => updateTargetAudience({
                      activity_filters: {
                        ...campaign.target_audience.activity_filters,
                        booking_count_min: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-login-days">Last Login (days ago)</Label>
                  <Input
                    id="last-login-days"
                    type="number"
                    placeholder="30"
                    value={campaign.target_audience.activity_filters?.last_login_days || ""}
                    onChange={(e) => updateTargetAudience({
                      activity_filters: {
                        ...campaign.target_audience.activity_filters,
                        last_login_days: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content-title">Title *</Label>
                <Input
                  id="content-title"
                  placeholder="Notification title..."
                  value={campaign.content.title}
                  onChange={(e) => updateContent({ title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-message">Message *</Label>
                <Textarea
                  id="content-message"
                  placeholder="Notification message..."
                  value={campaign.content.message}
                  onChange={(e) => updateContent({ message: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="action-url">Action URL</Label>
                  <Input
                    id="action-url"
                    placeholder="https://..."
                    value={campaign.content.action_url || ""}
                    onChange={(e) => updateContent({ action_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action-text">Action Button Text</Label>
                  <Input
                    id="action-text"
                    placeholder="Learn More"
                    value={campaign.content.action_text || ""}
                    onChange={(e) => updateContent({ action_text: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="send-immediately"
                  checked={campaign.schedule.send_immediately}
                  onChange={(e) => updateSchedule({ send_immediately: e.target.checked })}
                />
                <Label htmlFor="send-immediately">Send immediately</Label>
              </div>

              {!campaign.schedule.send_immediately && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Scheduled Date & Time</Label>
                  <Input
                    id="scheduled-date"
                    type="datetime-local"
                    value={campaign.schedule.scheduled_date || ""}
                    onChange={(e) => updateSchedule({ scheduled_date: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={campaign.schedule.timezone}
                  onChange={(e) => updateSchedule({ timezone: e.target.value })}
                  placeholder="America/New_York"
                />
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-3">
              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Campaign cannot be created:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Warnings:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.valid && validationResult.errors.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Campaign validation passed. Estimated recipients: {validationResult.estimated_recipients}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={validateCampaign}
            disabled={isValidating}
            className="w-full sm:w-auto"
          >
            {isValidating ? "Validating..." : "Validate Campaign"}
          </Button>
          <Button
            onClick={handleCreateCampaign}
            disabled={
              !validationResult?.valid ||
              validationResult?.errors.length > 0 ||
              isCreating ||
              !campaign.name.trim() ||
              !campaign.content.title.trim() ||
              !campaign.content.message.trim()
            }
            className="w-full sm:w-auto"
          >
            {isCreating ? "Creating..." : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
