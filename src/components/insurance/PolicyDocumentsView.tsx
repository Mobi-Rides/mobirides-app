import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Eye, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { InsurancePolicy } from '@/types/insurance-schema';

interface PolicyWithPackage extends InsurancePolicy {
    insurance_packages?: {
        name: string;
        display_name: string;
    };
    bookings?: {
        id: string;
        start_date: string;
        end_date: string;
    };
    cars?: {
        brand: string;
        model: string;
        year: number;
    };
}

export function PolicyDocumentsView() {
    const [policies, setPolicies] = useState<PolicyWithPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('insurance_policies')
                .select(`
          *,
          insurance_packages (
            name,
            display_name
          ),
          bookings (
            id,
            start_date,
            end_date
          ),
          cars (
            brand,
            model,
            year
          )
        `)
                .eq('renter_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPolicies(data || []);
        } catch (error) {
            console.error('Error fetching policies:', error);
            toast.error('Failed to load insurance policies');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPDF = (policy: PolicyWithPackage) => {
        if (policy.policy_document_url) {
            window.open(policy.policy_document_url, '_blank');
        } else {
            toast.error('Policy document not available');
        }
    };

    const handleDownloadPDF = async (policy: PolicyWithPackage) => {
        if (!policy.policy_document_url) {
            toast.error('Policy document not available');
            return;
        }

        try {
            setDownloadingId(policy.id);

            // Fetch the PDF
            const response = await fetch(policy.policy_document_url);
            if (!response.ok) throw new Error('Failed to download PDF');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `${policy.policy_number}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Cleanup
            URL.revokeObjectURL(url);

            toast.success('Policy PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download policy PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'success' | 'destructive' | 'secondary'; label: string }> = {
            active: { variant: 'success', label: 'Active' },
            expired: { variant: 'secondary', label: 'Expired' },
            cancelled: { variant: 'destructive', label: 'Cancelled' },
            claimed: { variant: 'default', label: 'Claimed' },
        };

        const config = variants[status] || { variant: 'default', label: status };
        return (
            <Badge variant={config.variant as any} className="capitalize">
                {config.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (policies.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No Insurance Policies</p>
                    <p className="text-sm text-muted-foreground">
                        You don't have any insurance policies yet. Select insurance when booking a vehicle.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Insurance Policy Documents</h2>
                    <p className="text-muted-foreground">
                        View and download your insurance policy certificates
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {policies.map((policy) => (
                    <Card key={policy.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Policy {policy.policy_number}
                                    </CardTitle>
                                    <CardDescription>
                                        {policy.insurance_packages?.display_name || 'Insurance Coverage'}
                                    </CardDescription>
                                </div>
                                {getStatusBadge(policy.status)}
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Left Column - Policy Details */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Coverage Period</h4>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {format(new Date(policy.start_date), 'MMM dd, yyyy')} -{' '}
                                                {format(new Date(policy.end_date), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {policy.number_of_days} {policy.number_of_days === 1 ? 'day' : 'days'}
                                        </p>
                                    </div>

                                    {policy.cars && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-muted-foreground">Vehicle</h4>
                                            <p className="text-sm">
                                                {policy.cars.year} {policy.cars.brand} {policy.cars.model}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Premium</h4>
                                            <p className="text-lg font-semibold">
                                                P {policy.total_premium.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                P {policy.premium_per_day.toFixed(2)}/day
                                            </p>
                                        </div>

                                        {policy.coverage_cap && (
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-medium text-muted-foreground">Coverage Cap</h4>
                                                <p className="text-lg font-semibold">
                                                    P {policy.coverage_cap.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {policy.excess_amount && (
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Excess (Deductible)</h4>
                                            <p className="text-sm">P {policy.excess_amount.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Document Actions */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Policy Document</h4>
                                        {policy.policy_document_url ? (
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={() => handleViewPDF(policy)}
                                                    variant="outline"
                                                    className="w-full justify-start"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Policy Certificate
                                                </Button>
                                                <Button
                                                    onClick={() => handleDownloadPDF(policy)}
                                                    disabled={downloadingId === policy.id}
                                                    className="w-full justify-start"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {downloadingId === policy.id ? 'Downloading...' : 'Download PDF'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="bg-muted rounded-md p-4 text-center">
                                                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    Policy document is being generated
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-4 border-t">
                                        <h4 className="text-sm font-medium text-muted-foreground">Policy Information</h4>
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            <p>Created: {format(new Date(policy.created_at), 'MMM dd, yyyy HH:mm')}</p>
                                            <p>Terms Version: {policy.terms_version}</p>
                                            {policy.terms_accepted_at && (
                                                <p>Terms Accepted: {format(new Date(policy.terms_accepted_at), 'MMM dd, yyyy HH:mm')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
