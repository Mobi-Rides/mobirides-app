import { ResendEmailService } from '../notificationService';
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

  /**
   * Notify Host/Owner When a Claim is Filed on Their Vehicle
   */
  async sendHostClaimNotification(
    email: string,
    hostName: string,
    claim: InsuranceClaim,
    carName: string
  ) {
    console.log(`📧 Sending Host Claim Notification to ${email}`);

    const subject = `Insurance Claim Filed for Your Vehicle - ${claim.claim_number}`;

    return this.emailService.sendEmail(
      email,
      'insurance-host-claim-notification',
      {
        name: hostName,
        claimNumber: claim.claim_number,
        carName: carName,
        incidentDate: new Date(claim.incident_date).toLocaleDateString(),
        incidentType: claim.incident_type.replace(/_/g, ' '),
        status: 'Submitted',
        description: claim.incident_description?.substring(0, 200) || 'No description provided'
      },
      subject
    );
  }
}

export const insuranceNotificationService = InsuranceNotificationService.getInstance();

