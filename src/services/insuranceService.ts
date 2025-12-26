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
    endDate: Date,
    renterId?: string,
    carId?: string
  ): Promise<PremiumCalculation> {
    const insurancePackage = await this.getPackageById(packageId);

    // Get Risk Adjustment (if eligible)
    let premiumMultiplier = 1.0;

    if (renterId && carId) {
      const risk = await UnderwriterService.assessRisk(renterId, carId);

      // If risk is prohibitive, we might want to throw or return unavailable
      // For now, we'll just apply the load. If load is 0, it means prohibited.
      if (risk.premiumLoad === 0) {
        // Logic to handle prohibited could go here, 
        // e.g. set premium to explicitly high number or handle in UI
        // For simplistic MVP, we'll force a very high multiplier to discourage/block
        premiumMultiplier = 10.0; // Prohibitive pricing as fallback
      } else {
        premiumMultiplier = risk.premiumLoad;
      }
    }

    // Calculate number of rental days (minimum 1 day)
    const numberOfDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Apply rental-based formula with risk adjustment
    let premiumPerDay = dailyRentalAmount * insurancePackage.premium_percentage * premiumMultiplier;
    let totalPremium = premiumPerDay * numberOfDays;

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
    endDate: Date,
    renterId?: string,
    carId?: string
  ): Promise<PremiumCalculation[]> {
    const packages = await this.getInsurancePackages();

    const calculations = await Promise.all(
      packages.map(pkg =>
        this.calculatePremium(pkg.id, dailyRentalAmount, startDate, endDate, renterId, carId)
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
      endDate,
      renterId,
      carId
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
        .from('insurance_policies' as any)
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
      .from('insurance_policies' as any)
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
  static async submitClaim(claimData: Partial<InsuranceClaim> & {
    policy_id: string;
    booking_id: string;
    incident_date: string; // Date string YYYY-MM-DD
    incident_time: string; // Time string HH:MM
    incident_description: string;
    damage_description: string;
    supporting_documents?: string[]
  }): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate claim number
      const claimNumber = `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

      // Combine date and time
      const dateTimeString = `${claimData.incident_date}T${claimData.incident_time}:00`;
      const incidentTimestamp = new Date(dateTimeString).toISOString();

      // Prepare data for insertion (remove incident_time, map documents)
      const { incident_time, supporting_documents, ...dbData } = claimData;

      const { data, error } = await supabase
        .from('insurance_claims' as any)
        .insert({
          ...dbData,
          renter_id: user.id, // Explicitly set renter_id from auth context
          incident_date: incidentTimestamp,
          claim_number: claimNumber,
          status: 'submitted',
          evidence_urls: supporting_documents || [],
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // --- Send Notifications ---
      try {
        // Get user profile for email notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const renterName = profile?.full_name || 'Valued Customer';
        // Use email from auth user object, as profiles table doesn't have email column
        const renterEmail = user.email;

        // 1. Send Email Notification to Renter
        if (renterEmail) {
          await insuranceNotificationService.sendClaimReceived(
            renterEmail,
            renterName,
            data as any
          );
          console.log(`📧 Claim submission email sent to ${renterEmail}`);
        }

        // 2. Create In-App Notification for Renter
        await supabase.rpc('create_claim_notification' as any, {
          p_user_id: user.id,
          p_claim_number: claimNumber,
          p_status: 'submitted',
          p_is_new_claim: true
        });
        console.log(`🔔 In-app notification created for claim ${claimNumber}`);

        // 3. Notify Host/Owner of the vehicle
        await InsuranceService.notifyHostOfClaim(claimData.booking_id, data as any);

      } catch (notificationError) {
        // Log but don't fail the claim submission if notifications fail
        console.error('Failed to send claim notifications (non-blocking):', notificationError);
      }

      // --- Log Claim Activity (Audit Trail) ---
      await InsuranceService.logClaimActivity(
        (data as any).id,
        'submitted',
        `Claim ${claimNumber} submitted by renter for ${claimData.incident_type || 'incident'}`,
        user.id,
        {
          incident_type: claimData.incident_type,
          estimated_damage_cost: claimData.estimated_damage_cost,
          booking_id: claimData.booking_id
        }
      );

      return { success: true, data };
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
    const { data: rawClaim, error: claimError } = await supabase
      .from('insurance_claims' as any)
      .select('renter_id, claim_number, payout_amount')
      .eq('id', claimId)
      .single();

    if (claimError || !rawClaim) {
      throw new Error('Claim not found');
    }

    const claim = rawClaim as any;

    console.log(`💰 Processing Payout of P${amount} for Claim ${(claim as any).claim_number} to User ${(claim as any).renter_id}`);

    try {
      // Import wallet service dynamically to avoid circular dependencies
      const { walletService } = await import('./walletService');

      // Credit user's wallet
      const success = await walletService.creditInsurancePayout(
        claim.renter_id,
        claimId,
        amount,
        (claim as any).claim_number
      );

      if (!success) {
        throw new Error('Failed to credit wallet');
      }

      console.log(`✅ Wallet credited successfully for claim ${(claim as any).claim_number}`);
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

    // --- Log Claim Activity (Audit Trail) ---
    await InsuranceService.logClaimActivity(
      claimId,
      'paid',
      `Payout of P${amount.toFixed(2)} processed for claim ${(claim as any).claim_number}`,
      undefined, // System action
      {
        payout_amount: amount,
        renter_id: (claim as any).renter_id
      }
    );
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

  /**
   * Log claim activity for audit trail
   * Creates a record in insurance_claim_activities table
   */
  static async logClaimActivity(
    claimId: string,
    activityType: 'submitted' | 'reviewed' | 'info_requested' | 'info_provided' | 'approved' | 'rejected' | 'paid' | 'note_added' | 'document_uploaded' | 'status_changed',
    description: string,
    performedBy?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('insurance_claim_activities' as any)
        .insert({
          claim_id: claimId,
          activity_type: activityType,
          description,
          performed_by: performedBy,
          metadata: metadata || null
        });

      if (error) {
        console.error('Failed to log claim activity:', error);
      } else {
        console.log(`📝 Logged activity: ${activityType} for claim ${claimId}`);
      }
    } catch (err) {
      // Non-blocking - don't fail the main operation
      console.error('Error logging claim activity:', err);
    }
  }

  /**
   * Notify car host/owner when a claim is filed on their vehicle
   */
  static async notifyHostOfClaim(
    bookingId: string,
    claim: InsuranceClaim
  ): Promise<void> {
    try {
      // Get booking with car and owner info
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          car_id,
          cars!inner(
            id,
            owner_id,
            make,
            model,
            profiles!owner_id(id, full_name)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        console.error('Failed to fetch booking for host notification:', bookingError);
        return;
      }

      const car = (booking as any).cars;
      const hostProfile = car?.profiles;
      const hostId = car?.owner_id;
      const hostName = hostProfile?.full_name || 'Host';

      // Get host email securely via RPC
      const { data: hostEmail } = await supabase.rpc('get_user_email_for_notification', {
        user_uuid: hostId
      });

      const carName = `${car?.make} ${car?.model}`;

      // 1. Send email notification to host
      if (hostEmail) {
        await insuranceNotificationService.sendHostClaimNotification(
          hostEmail,
          hostName,
          claim,
          carName
        );
        console.log(`📧 Host claim notification sent to ${hostEmail}`);
      }

      // 2. Create in-app notification for host
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: hostId,
          type: 'booking_request_received' as any, // Temporary fix: notification types need update
          title: 'Insurance Claim Filed',
          description: `An insurance claim (#${claim.claim_number}) has been filed for your ${carName}.`,
          is_read: false,
          metadata: {
            claim_id: claim.id,
            claim_number: claim.claim_number,
            car_id: car?.id,
            incident_type: claim.incident_type
          }
        });

      if (notifError) {
        console.error('Failed to create in-app notification for host:', notifError);
      } else {
        console.log(`🔔 In-app notification created for host ${hostId}`);
      }

    } catch (err) {
      // Non-blocking
      console.error('Error notifying host of claim:', err);
    }
  }

  /**
   * Add a response to a claim (from user)
   * Used when status is 'more_info_needed'
   */
  static async addClaimResponse(
    claimId: string,
    responseComment: string,
    fileUrls: string[] = []
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Log the activity
    await this.logClaimActivity(
      claimId,
      'info_provided',
      `User provided additional info: ${responseComment}`,
      user.id,
      { file_count: fileUrls.length, files: fileUrls }
    );

    // 2. Update claim status back to 'under_review' (or stay as is, but usually moves back to review)
    // We also append the new files to evidence_urls if possible, or just link them in activity
    // For simplicity, we'll just update status. The activity log holds the new files context.

    // Ideally we append to arrays in DB, but let's just update status for now.
    const { error } = await supabase
      .from('insurance_claims' as any)
      .update({
        status: 'under_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (error) throw new Error(`Failed to update claim status: ${error.message}`);

    // 3. Notify Admins (Logic to be added if we had admin notification service)
  }
}

export default InsuranceService;

