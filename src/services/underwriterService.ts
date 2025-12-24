/**
 * Mock Service for Third-Party Insurance Underwriter Integration
 * 
 * In a real-world scenario, this service would communicate with an external API
 * (e.g., Hollard, Old Mutual) to register policies and sync claims.
 */

export interface UnderwriterResponse {
    success: boolean;
    externalReference?: string;
    error?: string;
  }
  
  export class UnderwriterService {
    /**
     * Register a new policy with the external underwriter
     */
    static async registerPolicy(policyData: any): Promise<UnderwriterResponse> {
      console.log('🌐 Connecting to External Underwriter API...');
      console.log('📤 Registering Policy:', policyData.policy_number);
      
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success
      return {
        success: true,
        externalReference: `EXT-${Math.floor(Math.random() * 1000000)}`
      };
    }
  
    /**
     * Notify underwriter of a new claim
     */
    static async notifyClaim(claimData: any): Promise<UnderwriterResponse> {
      console.log('🌐 Connecting to External Underwriter API...');
      console.log('📤 Notifying Claim:', claimData.claim_number);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        externalReference: `CLM-EXT-${Math.floor(Math.random() * 1000000)}`
      };
    }
  }
  
  export default UnderwriterService;
