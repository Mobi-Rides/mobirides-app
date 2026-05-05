import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, FileText, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PolicyDetailsCard } from './PolicyDetailsCard';
import type { InsurancePolicy } from '@/types/insurance-schema';
import { useNavigate } from 'react-router-dom';

interface PolicyWithPackage extends InsurancePolicy {
    insurance_packages?: {
        name: string;
        display_name: string;
        description: string;
        features: string[];
        exclusions: string[];
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
    const navigate = useNavigate();

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
            display_name,
            description,
            features,
            exclusions
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
            setPolicies((data || []) as PolicyWithPackage[]);
        } catch (error) {
            console.error('Error fetching policies:', error);
            toast.error('Failed to load insurance policies');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = (policy: PolicyWithPackage) => {
        if (policy.policy_document_url) {
            window.open(policy.policy_document_url, '_blank');
        } else {
            toast.error('Policy certificate not available yet');
        }
    };

    const handleFileClaim = (policy: PolicyWithPackage) => {
        navigate(`/claims/new?policyId=${policy.id}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your policies...</p>
            </div>
        );
    }

    if (policies.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Insurance Policies</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        You haven't purchased any damage protection packages yet. Select coverage when booking to see your policies here.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Insurance Policies</h2>
                <p className="text-muted-foreground">
                    View and manage your active insurance coverage and certificates.
                </p>
            </div>

            <div className="grid gap-6">
                {policies.map((policy) => (
                    <PolicyDetailsCard
                        key={policy.id}
                        policy={{
                            id: policy.id,
                            policy_number: policy.policy_number,
                            status: policy.status,
                            start_date: policy.start_date,
                            end_date: policy.end_date,
                            package_name: policy.insurance_packages?.display_name || policy.insurance_packages?.name || 'Standard',
                            premium_paid: Number(policy.total_premium),
                            coverage_cap: Number(policy.coverage_cap),
                            excess: Number(policy.excess_amount),
                            claim_eligibility: policy.status === 'active' && new Date(policy.end_date) > new Date(),
                            document_url: policy.policy_document_url || undefined,
                            vehicle_info: policy.cars ? `${policy.cars.year} ${policy.cars.brand} ${policy.cars.model}` : undefined
                        }}
                        description={policy.insurance_packages?.description}
                        features={policy.insurance_packages?.features}
                        exclusions={policy.insurance_packages?.exclusions}
                        onDownloadPDF={() => handleDownloadPDF(policy)}
                        onFileClaim={() => handleFileClaim(policy)}
                        onViewTerms={() => window.open('/terms/insurance', '_blank')}
                    />
                ))}
            </div>
            
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm space-y-1">
                        <p className="font-medium text-primary">Need to file a claim?</p>
                        <p className="text-primary/80">
                            Select "File a Claim" on any active policy to start the process. All claims require supporting evidence and a police report for major incidents.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
