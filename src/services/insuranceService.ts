import { supabase } from '@/integrations/supabase/client';
import { generatePolicyPDF } from '@/utils/pdfGenerator';
import { insuranceNotificationService } from '@/services/wallet/insuranceNotificationService';
import { UnderwriterService } from '@/services/underwriterService';
import { InsurancePackage, InsurancePolicy, InsuranceClaim } from '@/types/insurance-schema';

/**
 * Premium calculation result using rental-amount-based formula
 */
export interface PremiumCalculation {
  packageId: string;
  packageName: string;
  displayName: string;
  description: string;

  // Pricing calculation
  dailyRentalAmount: number; // Base car rental per day (e.g., P 500)
  premiumPercentage: number; // 0.00, 0.25, 0.50, 1.00
  premiumPerDay: number; // dailyRentalAmount × premiumPercentage
  numberOfDays: number;
  totalPremium: number; // premiumPerDay × numberOfDays

  // Coverage details
  coverageCap: number | null; // P 15,000 or P 50,000
  excessAmount: number | null; // P 300, P 500, or P 1,000
  coversMinorDamage: boolean;
  coversMajorIncidents: boolean;

  // T&C
  features: string[];
  exclusions: string[];
}

/**
 * Insurance Service - Handles all insurance-related operations
 * Based on Botswana Mobi_Rides Renters Insurance Terms & Conditions
 */
export class InsuranceService {
  /**
   * Get all active insurance packages
   */
  static async getInsurancePackages(): Promise<InsurancePackage[]> {
    const { data, error } = await supabase
      .from('insurance_packages' as any)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch insurance packages: ${error.message}`);
    return (data as unknown) as InsurancePackage[] || [];
  }

  /**
   * Get insurance package by ID
   */
  static async getPackageById(packageId: string): Promise<InsurancePackage> {
    const { data, error } = await supabase
      .from('insurance_packages' as any)
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(`Failed to fetch insurance package: ${error.message}`);
    return (data as unknown) as InsurancePackage;
  }

  /**
   * Calculate insurance premium using RENTAL-AMOUNT-BASED formula
   * 
   * Formula: Premium = Daily Rental Rate × Premium Percentage × Number of Days
   */
  static async calculatePremium(
    packageId: string,
    dailyRentalAmount: number,
    startDate: Date,
    endDate: Date
  ): Promise<PremiumCalculation> {
    const insurancePackage = await this.getPackageById(packageId);

    // Calculate number of rental days (minimum 1 day)
    const numberOfDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Apply rental-based formula
    const premiumPerDay = dailyRentalAmount * insurancePackage.premium_percentage;
    const totalPremium = premiumPerDay * numberOfDays;

    return {
      packageId: insurancePackage.id,
      packageName: insurancePackage.name,
      displayName: insurancePackage.display_name,
      description: insurancePackage.description,

      dailyRentalAmount,
      premiumPercentage: insurancePackage.premium_percentage,
      premiumPerDay: Math.round(premiumPerDay * 100) / 100, // Round to 2 decimals
      numberOfDays,
      totalPremium: Math.round(totalPremium * 100) / 100,

      coverageCap: insurancePackage.coverage_cap,
      excessAmount: insurancePackage.excess_amount,
      coversMinorDamage: insurancePackage.covers_minor_damage,
      coversMajorIncidents: insurancePackage.covers_major_incidents,

      features: insurancePackage.features || [],
      exclusions: insurancePackage.exclusions || [],
    };
  }

  /**
   * Calculate premiums for all packages (for comparison display)
   */
  static async calculateAllPremiums(
    dailyRentalAmount: number,
    startDate: Date,
    endDate: Date
  ): Promise<PremiumCalculation[]> {
    const packages = await this.getInsurancePackages();

    const calculations = await Promise.all(
      packages.map(pkg =>
        this.calculatePremium(pkg.id, dailyRentalAmount, startDate, endDate)
      )
    );

    return calculations;
  }

  /**
   * Create insurance policy when booking is confirmed
   * Automatically generates and uploads PDF policy document
   */
  static async createPolicy(
    bookingId: string,
    packageId: string,
    renterId: string,
    carId: string,
    startDate: Date,
    endDate: Date,
    dailyRentalAmount: number,
    termsVersion: string = 'v1.0-2025-11'
  ): Promise<InsurancePolicy> {
    const calculation = await this.calculatePremium(
      packageId,
      dailyRentalAmount,
      startDate,
      endDate
    );

    // Generate policy number
    const policyNumber = await this.generatePolicyNumber();

    const policyData = {
      policy_number: policyNumber,
      booking_id: bookingId,
      package_id: packageId,
      renter_id: renterId,
      car_id: carId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      rental_amount_per_day: dailyRentalAmount,
      premium_per_day: calculation.premiumPerDay,
      number_of_days: calculation.numberOfDays,
      total_premium: calculation.totalPremium,
      coverage_cap: calculation.coverageCap,
      excess_amount: calculation.excessAmount,
      status: 'active',
      terms_accepted_at: new Date().toISOString(),
      terms_version: termsVersion,
    };

    const { data, error } = await supabase
      .from('insurance_policies' as any)
      .insert(policyData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create insurance policy: ${error.message}`);

    const policy = (data as unknown) as InsurancePolicy;

    // Generate and upload PDF policy document (non-blocking)
    try {
      const insurancePackage = await this.getPackageById(packageId);

      // Get renter and car details for PDF
      const { data: renterData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', renterId)
        .single();

      const { data: carData } = await supabase
        .from('cars')
        .select('brand, model, year')
        .eq('id', carId)
        .single();

      const renterName = renterData?.full_name || 'Policy Holder';
      const carDetails = carData ? `${carData.year} ${carData.brand} ${carData.model}` : 'Vehicle';

      // Generate PDF
      const pdfBlob = generatePolicyPDF(policy, insurancePackage, renterName, carDetails);

      // Upload to Supabase Storage
      const pdfUrl = await this.uploadPolicyPDF(policy.id, renterId, pdfBlob, policyNumber);

      // Update policy with PDF URL
      await supabase
        .from('insurance_policies')
        .update({ policy_document_url: pdfUrl })
        .eq('id', policy.id);

      console.log(`✅ Policy PDF generated and uploaded: ${pdfUrl}`);
    } catch (pdfError) {
      console.error('Failed to generate/upload policy PDF (non-blocking):', pdfError);
      // Don't throw - PDF generation failure shouldn't block policy creation
    }

    return policy;
  }

  /**
   * Generate unique policy number
   * Format: INS-YYYY-XXXXXX (e.g., INS-2025-000123)
   */
  private static async generatePolicyNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_policy_number' as any);

    if (error) {
      // Fallback if function doesn't exist yet
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `INS-${year}-${random}`;
    }

    return data;
  }

  /**
   * Get policy by booking ID
   */
  static async getPolicyByBookingId(bookingId: string): Promise<InsurancePolicy | null> {
    const { data, error } = await supabase
      .from('insurance_policies' as any)
      .select(`
        *,
        package:insurance_packages(*),
        booking:bookings(*),
        car:cars(*)
      `)
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch policy: ${error.message}`);
    }

    return data as any; // Cast to any because of join complexity
  }

  /**
   * Get all policies for a renter
   */
  static async getPoliciesByRenterId(renterId: string): Promise<InsurancePolicy[]> {
    const { data, error } = await supabase
      .from('insurance_policies' as any)
      .select(`
        *,
        package:insurance_packages(*),
        booking:bookings(*),
        car:cars(*)
      `)
      .eq('renter_id', renterId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch policies: ${error.message}`);
    return data as any[] || [];
  }

  /**
   * Update policy status
   */
  static async updatePolicyStatus(
    policyId: string,
    status: 'active' | 'expired' | 'cancelled' | 'claimed'
  ): Promise<void> {
    const { error } = await supabase
      .from('insurance_policies')
      .update({ status })
      .eq('id', policyId);

    if (error) throw new Error(`Failed to update policy status: ${error.message}`);
  }

  /**
   * Check if policy is currently valid
   */
  static isPolicyValid(policy: InsurancePolicy, checkDate: Date = new Date()): boolean {
    const startDate = new Date(policy.start_date);
    const endDate = new Date(policy.end_date);

    return (
      policy.status === 'active' &&
      checkDate >= startDate &&
      checkDate <= endDate
    );
  }

  /**
   * Calculate claim payout
   * Formula: Payout = MIN(Damage Cost, Coverage Cap) - Excess
   * Total Claim Cost = Payout + Admin Fee (P 150)
   */
  static calculateClaimPayout(
    damageCost: number,
    coverageCap: number,
    excess: number,
    adminFee: number = 150
  ): {
    approvedAmount: number;
    excessPaid: number;
    payoutAmount: number;
    adminFee: number;
    totalClaimCost: number;
    renterPays: number;
  } {
    // Approved amount is capped at coverage limit
    const approvedAmount = Math.min(damageCost, coverageCap);

    // Renter pays excess (deductible) + admin fee
    const excessPaid = excess;
    const renterPays = excessPaid + adminFee;

    // Insurance pays the rest (up to coverage cap)
    const payoutAmount = Math.max(0, approvedAmount - excessPaid);

    // Total cost to insurance (payout + admin fee)
    const totalClaimCost = payoutAmount + adminFee;

    return {
      approvedAmount,
      excessPaid,
      payoutAmount,
      adminFee,
      totalClaimCost,
      renterPays,
    };
  }

  /**
   * Submit a new insurance claim
   */
  static async submitClaim(claimData: Omit<InsuranceClaim, 'id' | 'claim_number' | 'status' | 'created_at' | 'updated_at'> & { supporting_documents?: string[] }): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate claim number
      const claimNumber = `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

      const { error } = await supabase
        .from('insurance_claims' as any)
        .insert({
          ...claimData,
          claim_number: claimNumber,
          status: 'submitted',
          evidence_urls: claimData.supporting_documents || [], // Map supporting_documents to evidence_urls
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Submit claim error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Process Financial Payout for a Claim
   * Credits the user's wallet with the approved payout amount
   */
  static async processClaimPayout(claimId: string, amount: number): Promise<void> {
    // Fetch claim to get renter_id
    const { data: claim, error: claimError } = await supabase
      .from('insurance_claims')
      .select('renter_id, claim_number, payout_amount')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      throw new Error('Claim not found');
    }

    console.log(`💰 Processing Payout of P${amount} for Claim ${claim.claim_number} to User ${claim.renter_id}`);

    try {
      // Import wallet service dynamically to avoid circular dependencies
      const { walletService } = await import('./walletService');

      // Credit user's wallet
      const success = await walletService.creditInsurancePayout(
        claim.renter_id,
        claimId,
        amount,
        claim.claim_number
      );

      if (!success) {
        throw new Error('Failed to credit wallet');
      }

      console.log(`✅ Wallet credited successfully for claim ${claim.claim_number}`);
    } catch (walletError) {
      console.error('Failed to credit wallet:', walletError);
      throw new Error(`Wallet credit failed: ${walletError instanceof Error ? walletError.message : 'Unknown error'}`);
    }

    // Update claim status to 'paid'
    const { error: updateError } = await supabase
      .from('insurance_claims' as any)
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (updateError) {
      throw new Error(`Failed to update claim status: ${updateError.message}`);
    }

    console.log(`✅ Claim ${claim.claim_number} marked as paid`);
  }
  /**
   * Upload policy PDF to Supabase Storage
   * @private
   */
  private static async uploadPolicyPDF(
    policyId: string,
    renterId: string,
    pdfBlob: Blob,
    policyNumber: string
  ): Promise<string> {
    const fileName = `${renterId}/${policyNumber}.pdf`;

    const { data, error } = await supabase.storage
      .from('insurance-policies')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload policy PDF: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('insurance-policies')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }
}

export default InsuranceService;
