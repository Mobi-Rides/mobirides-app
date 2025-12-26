import { supabase } from '@/integrations/supabase/client';
import { InsuranceService } from '@/services/insuranceService';

export class InsuranceAutomationService {
    /**
     * Check for expired policies and update their status
     * Intended to be run periodically or triggered by admin
     */
    static async checkPolicyExpirations(): Promise<{ processed: number; errors: number }> {
        console.log('🔄 Automation: Checking for expired policies...');
        const now = new Date().toISOString();
        let processed = 0;
        let errors = 0;

        try {
            // Find active policies where end_date < now
            const { data: expiredPolicies, error } = await supabase
                .from('insurance_policies' as any)
                .select('id, end_date')
                .eq('status', 'active')
                .lt('end_date', now)
                .limit(50); // Batch size

            if (error) throw error;

            if (!expiredPolicies || expiredPolicies.length === 0) {
                console.log('✅ Automation: No expired policies found.');
                return { processed: 0, errors: 0 };
            }

            console.log(`Found ${expiredPolicies.length} policies to expire.`);

            // Update in batches (or loop for simplicity in logic)
            for (const policy of (expiredPolicies as any[])) {
                try {
                    const { error: updateError } = await supabase
                        .from('insurance_policies' as any)
                        .update({ status: 'expired' })
                        .eq('id', policy.id);

                    if (updateError) throw updateError;
                    processed++;
                } catch (err) {
                    console.error(`Failed to expire policy ${policy.id}`, err);
                    errors++;
                }
            }

            console.log(`✅ Automation: Expired ${processed} policies.`);
            return { processed, errors };

        } catch (err) {
            console.error('Automation Error (Expirations):', err);
            return { processed, errors };
        }
    }

    /**
     * Auto-process small claims (e.g., < P500)
     * This is a simplified "Low Value Auto-Approval" workflow
     */
    static async autoProcessSmallClaims(threshold: number = 500): Promise<{ processed: number; errors: number }> {
        console.log('🔄 Automation: Running auto-approval for small claims...');
        let processed = 0;
        let errors = 0;

        try {
            // Find submitted claims with low estimated cost
            // Note: In real world, we'd check more factors (fraud score, etc.)
            const { data: eligibleClaims, error } = await supabase
                .from('insurance_claims' as any)
                .select('*')
                .eq('status', 'submitted')
                .lt('estimated_damage_cost', threshold)
                .limit(10);

            if (error) throw error;

            if (!eligibleClaims || eligibleClaims.length === 0) {
                console.log('✅ Automation: No eligible small claims found.');
                return { processed: 0, errors: 0 };
            }

            for (const claim of (eligibleClaims as any[])) {
                try {
                    console.log(`Auto-approving claim ${claim.claim_number} (Cost: P${claim.estimated_damage_cost})`);

                    await InsuranceService.logClaimActivity(
                        claim.id,
                        'approved',
                        `Auto-approved by system (Low Value < P${threshold})`,
                        undefined, // System actions have no user ID
                        { auto_approval: true }
                    );

                    // Update status
                    const { error: updateError } = await supabase
                        .from('insurance_claims' as any)
                        .update({ status: 'approved' })
                        .eq('id', claim.id);

                    if (updateError) throw updateError;

                    // Optionally: We could even auto-payout here if we wanted to be very aggressive
                    // But usually we leave payout for a final finance check or batch job

                    processed++;
                } catch (err) {
                    console.error(`Failed to auto-process claim ${claim.id}`, err);
                    errors++;
                }
            }

            console.log(`✅ Automation: Auto-approved ${processed} claims.`);
            return { processed, errors };

        } catch (err) {
            console.error('Automation Error (Small Claims):', err);
            return { processed, errors };
        }
    }
}
