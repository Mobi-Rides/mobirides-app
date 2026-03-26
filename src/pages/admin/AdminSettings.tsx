import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    Settings,
    DollarSign,
    Percent,
    Shield,
    Bell,
    Lock,
    Save,
    RotateCcw,
    Eye,
    EyeOff,
    AlertTriangle,
    Check
} from "lucide-react";

interface PlatformSetting {
    id: string;
    key: string;
    value: string;
    description: string;
    category: string;
    is_sensitive: boolean;
    updated_at: string;
}

interface PricingRule {
    id: string;
    name: string;
    type: string;
    multiplier: number;
    is_active: boolean;
    conditions: Record<string, unknown>;
    updated_at: string;
}

// Default settings for when tables don't exist
const DEFAULT_SETTINGS: PlatformSetting[] = [
    { id: '1', key: 'platform_name', value: 'Mobi Rides', description: 'Platform display name', category: 'general', is_sensitive: false, updated_at: new Date().toISOString() },
    { id: '2', key: 'platform_email', value: 'support@mobirides.co.za', description: 'Contact email address', category: 'general', is_sensitive: false, updated_at: new Date().toISOString() },
    { id: '3', key: 'platform_commission', value: '15', description: 'Platform commission percentage', category: 'commission', is_sensitive: false, updated_at: new Date().toISOString() },
    { id: '4', key: 'host_commission', value: '85', description: 'Host commission percentage', category: 'commission', is_sensitive: false, updated_at: new Date().toISOString() },
    { id: '5', key: 'email_notifications', value: 'true', description: 'Enable email notifications', category: 'notifications', is_sensitive: false, updated_at: new Date().toISOString() },
    { id: '6', key: 'sms_notifications', value: 'false', description: 'Enable SMS notifications', category: 'notifications', is_sensitive: false, updated_at: new Date().toISOString() },
    { id: '7', key: 'require_kyc', value: 'true', description: 'Require KYC verification', category: 'security', is_sensitive: false, updated_at: new Date().toISOString() },
    { id: '8', key: 'two_factor_required', value: 'false', description: 'Require two-factor authentication', category: 'security', is_sensitive: false, updated_at: new Date().toISOString() },
];

const DEFAULT_PRICING_RULES: PricingRule[] = [
    { id: '1', name: 'Weekend Premium', type: 'weekend', multiplier: 1.2, is_active: true, conditions: { days: ['saturday', 'sunday'] }, updated_at: new Date().toISOString() },
    { id: '2', name: 'Holiday Surge', type: 'holiday', multiplier: 1.5, is_active: false, conditions: { holidays: [] }, updated_at: new Date().toISOString() },
    { id: '3', name: 'Off-Peak Discount', type: 'off_peak', multiplier: 0.8, is_active: true, conditions: { hours: [0, 6] }, updated_at: new Date().toISOString() },
];

const AdminSettings = () => {
    const navigate = useNavigate();
    const { isSuperAdmin, isAdmin, isLoading: adminLoading } = useIsAdmin();
    const [settings, setSettings] = useState<PlatformSetting[]>(DEFAULT_SETTINGS);
    const [pricingRules, setPricingRules] = useState<PricingRule[]>(DEFAULT_PRICING_RULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
    const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                // Try to fetch platform settings from database
                const { data: settingsData, error: settingsError } = await (supabase as any)
                    .from('platform_settings')
                    .select('*')
                    .order('category', { ascending: true });

                if (settingsError) {
                    console.log('Using default settings (table may not exist):', settingsError.message);
                    // Use defaults if table doesn't exist
                    setSettings(DEFAULT_SETTINGS);
                } else if (settingsData && settingsData.length > 0) {
                    setSettings(settingsData);
                } else {
                    setSettings(DEFAULT_SETTINGS);
                }

                // Try to fetch pricing rules from database
                const { data: pricingData, error: pricingError } = await (supabase as any)
                    .from('dynamic_pricing_rules')
                    .select('*')
                    .order('type', { ascending: true });

                if (pricingError) {
                    console.log('Using default pricing rules (table may not exist):', pricingError.message);
                    setPricingRules(DEFAULT_PRICING_RULES);
                } else if (pricingData && pricingData.length > 0) {
                    setPricingRules(pricingData);
                } else {
                    setPricingRules(DEFAULT_PRICING_RULES);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                toast.error('Failed to load settings');
                // Fall back to defaults
                setSettings(DEFAULT_SETTINGS);
                setPricingRules(DEFAULT_PRICING_RULES);
            } finally {
                setLoading(false);
            }
        };

        if (!adminLoading && isAdmin) {
            fetchSettings();
        }
    }, [adminLoading, isAdmin]);

    // Group settings by category
    const settingsByCategory = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
            acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
    }, {} as Record<string, PlatformSetting[]>);

    // Handle setting change
    const handleSettingChange = (key: string, value: string) => {
        setEditedSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    // Toggle sensitive value visibility
    const toggleSensitive = (key: string) => {
        setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Save all changes
    const handleSave = async () => {
        setSaving(true);
        try {
            const entries = Object.entries(editedSettings);

            for (const [key, value] of entries) {
                const { error } = await (supabase as any)
                    .from('platform_settings')
                    .update({
                        value,
                        updated_at: new Date().toISOString()
                    })
                    .eq('key', key);

                if (error) {
                    console.error(`Error updating ${key}:`, error);
                    throw error;
                }
            }

            toast.success('Settings saved successfully');
            setHasChanges(false);
            setEditedSettings({});

            // Refresh settings
            const { data } = await (supabase as any)
                .from('platform_settings')
                .select('*')
                .order('category', { ascending: true });
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Reset changes
    const handleReset = () => {
        setEditedSettings({});
        setHasChanges(false);
    };

    // Format value for display
    const formatValue = (setting: PlatformSetting) => {
        const editedValue = editedSettings[setting.key];
        const value = editedValue !== undefined ? editedValue : setting.value;

        if (setting.is_sensitive && !showSensitive[setting.key]) {
            return '••••••••';
        }

        return value;
    };

    // Loading state
    if (loading || adminLoading) {
        return (
            <AdminProtectedRoute>
                <AdminLayout>
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold">Admin Settings</h1>
                            <p className="text-muted-foreground">
                                Manage platform configuration and settings
                            </p>
                        </div>
                        <div className="flex items-center justify-center h-64">
                            <div className="text-muted-foreground">Loading settings...</div>
                        </div>
                    </div>
                </AdminLayout>
            </AdminProtectedRoute>
        );
    }

    // Access denied for non-admins
    if (!isAdmin) {
        return (
            <AdminProtectedRoute>
                <AdminLayout>
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                        <h2 className="text-xl font-semibold">Access Denied</h2>
                        <p className="text-muted-foreground">
                            You need admin privileges to access this page.
                        </p>
                        <Button onClick={() => navigate("/")}>
                            Return to Home
                        </Button>
                    </div>
                </AdminLayout>
            </AdminProtectedRoute>
        );
    }

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Settings className="h-8 w-8" />
                                Admin Settings
                            </h1>
                            <p className="text-muted-foreground">
                                Manage platform configuration and settings
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {hasChanges && (
                                <Badge variant="outline" className="text-amber-500 border-amber-500">
                                    Unsaved changes
                                </Badge>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                disabled={!hasChanges || saving}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin">⟳</span>
                                        Saving...
                                    </span>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Super Admin Badge */}
                    {isSuperAdmin && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">
                                Super Admin Mode: You have full access to modify all settings
                            </span>
                        </div>
                    )}

                    {/* Tabs */}
                    <Tabs defaultValue="general" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="pricing" className="gap-2">
                                <DollarSign className="h-4 w-4" />
                                Pricing
                            </TabsTrigger>
                            <TabsTrigger value="commission" className="gap-2">
                                <Percent className="h-4 w-4" />
                                Commission
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="gap-2">
                                <Bell className="h-4 w-4" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="security" className="gap-2">
                                <Lock className="h-4 w-4" />
                                Security
                            </TabsTrigger>
                        </TabsList>

                        {/* General Settings */}
                        <TabsContent value="general" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                    <CardDescription>
                                        Basic platform configuration
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {settingsByCategory['general']?.map((setting) => (
                                        <div key={setting.id} className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label>{setting.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Label>
                                                <p className="text-sm text-muted-foreground">{setting.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type={setting.is_sensitive && !showSensitive[setting.key] ? "password" : "text"}
                                                    value={formatValue(setting)}
                                                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                                    className="w-48"
                                                    disabled={!isSuperAdmin}
                                                />
                                                {setting.is_sensitive && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleSensitive(setting.key)}
                                                    >
                                                        {showSensitive[setting.key] ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!settingsByCategory['general'] || settingsByCategory['general'].length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No general settings configured yet
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Pricing Settings */}
                        <TabsContent value="pricing" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pricing Rules</CardTitle>
                                    <CardDescription>
                                        Configure dynamic pricing multipliers
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pricingRules.map((rule) => (
                                        <div key={rule.id} className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{rule.name}</span>
                                                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                                                        {rule.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Type: {rule.type} | Multiplier: {(rule.multiplier * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="10"
                                                    value={rule.multiplier}
                                                    className="w-24"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {pricingRules.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No pricing rules configured yet
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Commission Settings */}
                        <TabsContent value="commission" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Commission Rates</CardTitle>
                                    <CardDescription>
                                        Platform commission configuration
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {settingsByCategory['commission']?.map((setting) => (
                                        <div key={setting.id} className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label>{setting.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Label>
                                                <p className="text-sm text-muted-foreground">{setting.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={formatValue(setting)}
                                                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                                    className="w-24"
                                                    disabled={!isSuperAdmin}
                                                />
                                                <span className="text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!settingsByCategory['commission'] || settingsByCategory['commission'].length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No commission settings configured yet
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notification Settings */}
                        <TabsContent value="notifications" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Settings</CardTitle>
                                    <CardDescription>
                                        Configure notification channels and preferences
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {settingsByCategory['notifications']?.map((setting) => (
                                        <div key={setting.id} className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label>{setting.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Label>
                                                <p className="text-sm text-muted-foreground">{setting.description}</p>
                                            </div>
                                            <Switch
                                                checked={editedSettings[setting.key] === 'true' ||
                                                    (editedSettings[setting.key] === undefined && setting.value === 'true')}
                                                onCheckedChange={(checked) => handleSettingChange(setting.key, checked.toString())}
                                                disabled={!isSuperAdmin}
                                            />
                                        </div>
                                    ))}
                                    {(!settingsByCategory['notifications'] || settingsByCategory['notifications'].length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No notification settings configured yet
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Settings */}
                        <TabsContent value="security" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>
                                        Platform security and access control configuration
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {settingsByCategory['security']?.map((setting) => (
                                        <div key={setting.id} className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label>{setting.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Label>
                                                <p className="text-sm text-muted-foreground">{setting.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {setting.value === 'true' || setting.value === 'false' ? (
                                                    <Switch
                                                        checked={editedSettings[setting.key] === 'true' ||
                                                            (editedSettings[setting.key] === undefined && setting.value === 'true')}
                                                        onCheckedChange={(checked) => handleSettingChange(setting.key, checked.toString())}
                                                        disabled={!isSuperAdmin}
                                                    />
                                                ) : (
                                                    <Input
                                                        type={setting.is_sensitive && !showSensitive[setting.key] ? "password" : "text"}
                                                        value={formatValue(setting)}
                                                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                                        className="w-48"
                                                        disabled={!isSuperAdmin}
                                                    />
                                                )}
                                                {setting.is_sensitive && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleSensitive(setting.key)}
                                                    >
                                                        {showSensitive[setting.key] ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!settingsByCategory['security'] || settingsByCategory['security'].length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No security settings configured yet
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Danger Zone */}
                            {!isSuperAdmin && (
                                <Card className="border-destructive">
                                    <CardHeader>
                                        <CardTitle className="text-destructive">Restricted Access</CardTitle>
                                        <CardDescription>
                                            Some settings require Super Admin privileges to modify
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
};

export default AdminSettings;
