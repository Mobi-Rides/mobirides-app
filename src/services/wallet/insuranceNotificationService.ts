import { ResendEmailService } from './notificationService';
import { InsurancePolicy, InsurancePackage, InsuranceClaim } from '@/types/insurance-schema';

export class InsuranceNotificationService {
  private static instance: InsuranceNotificationService;
  private emailService: ResendEmailService;

  private constructor() {
    this.emailService = ResendEmailService.getInstance();
  }

  public static getInstance(): InsuranceNotificationService {
    if (!InsuranceNotificationService.instance) {
      InsuranceNotificationService.instance = new InsuranceNotificationService();
    }
    return InsuranceNotificationService.instance;
  }

  /**
   * Send Policy Confirmation Email
   */
  async sendPolicyConfirmation(
    email: string,
    renterName: string,
    policy: InsurancePolicy,
    pkg: InsurancePackage,
    pdfUrl: string
  ) {
    console.log(`📧 Sending Policy Confirmation to ${email}`);

    // In a real scenario, we would attach the PDF or include the link
    // For now, we use a generic template or the booking confirmation one with extra data
    // Or we create a new template 'insurance-policy-confirmation'

    return this.emailService.sendEmail(
      email,
      'insurance-policy-confirmation', // Needs to be set up in Resend
      {
        name: renterName,
        policyNumber: policy.policy_number,
        planName: pkg.display_name,
        startDate: new Date(policy.start_date).toLocaleDateString(),
        endDate: new Date(policy.end_date).toLocaleDateString(),
        premiumAmount: policy.total_premium.toFixed(2),
        downloadLink: pdfUrl
      },
      `Insurance Policy Confirmation - ${policy.policy_number}`
    );
  }

  /**
   * Send Claim Submission Receipt
   */
  async sendClaimReceived(
    email: string,
    renterName: string,
    claim: InsuranceClaim
  ) {
    console.log(`📧 Sending Claim Receipt to ${email}`);

    return this.emailService.sendEmail(
      email,
      'insurance-claim-received',
      {
        name: renterName,
        claimNumber: claim.claim_number,
        incidentDate: new Date(claim.incident_date).toLocaleDateString(),
        status: 'Submitted'
      },
      `Claim Received - ${claim.claim_number}`
    );
  }

  /**
   * Send Claim Status Update
   */
  async sendClaimStatusUpdate(
    email: string,
    renterName: string,
    claim: InsuranceClaim
  ) {
    console.log(`📧 Sending Claim Update to ${email}`);

    const subject = `Claim Status Update - ${claim.claim_number}: ${claim.status.toUpperCase()}`;

    return this.emailService.sendEmail(
      email,
      'insurance-claim-update',
      {
        name: renterName,
        claimNumber: claim.claim_number,
        newStatus: claim.status,
        updatedAt: new Date().toLocaleString(),
        notes: claim.admin_notes || 'Please check the app for more details.'
      },
      subject
    );
  }
}

export const insuranceNotificationService = InsuranceNotificationService.getInstance();
