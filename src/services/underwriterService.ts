import { supabase } from '@/integrations/supabase/client';

export interface RiskAssessment {
  riskScore: number; // 0-100, where higher is riskier
  riskTier: 'low' | 'medium' | 'high' | 'prohibited';
  premiumLoad: number; // Multiplier, e.g., 1.0 (no load), 1.2 (20% load)
  riskFactors: string[];
}

export class UnderwriterService {
  /**
   * Assess risk for a user renting a specific car
   * Factors considered:
   * - Driver Age (simulated based on profile)
   * - Car Value (simulated based on car model)
   * - Claims History (if available)
   */
  static async assessRisk(userId: string, carId: string): Promise<RiskAssessment> {
    try {
      // 1. Fetch User Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Fetch Car Details
      const { data: car } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      if (!profile || !car) {
        console.warn('Underwriting: Profile or Car not found. Defaulting to medium risk.');
        return this.getDefaultRisk('medium');
      }

      const riskFactors: string[] = [];
      let baseScore = 20; // Start with low base risk

      // --- Age Factor (Simulated) ---
      // In a real app, we'd have date_of_birth. Here we simulate or check metadata.
      // Assuming 'driver_age' might be in user_metadata or we treat unknown as 25+.
      // For this MVP, we'll verify if they are a 'verified' driver.

      const isVerified = (profile as any).is_verified || false;
      if (!isVerified) {
        baseScore += 30;
        riskFactors.push('Unverified Driver Profile');
      }

      // --- Car Value Factor ---
      // Luxury cars (e.g. > P1000/day implied value) carry higher risk
      const carPrice = car.price_per_day || 0;
      if (carPrice > 1500) {
        baseScore += 20;
        riskFactors.push('High Value Vehicle');
      }

      // --- Claims History ---
      // Check if user has rejected claims in the past
      const { count: rejectedClaims } = await supabase
        .from('insurance_claims' as any)
        .select('*', { count: 'exact', head: true })
        .eq('renter_id', userId)
        .eq('status', 'rejected');

      if (rejectedClaims && rejectedClaims > 0) {
        baseScore += 40;
        riskFactors.push(`History of ${rejectedClaims} rejected claim(s)`);
      }

      // Calculate Risk Tier
      let riskTier: RiskAssessment['riskTier'] = 'low';
      let premiumLoad = 1.0;

      if (baseScore >= 80) {
        riskTier = 'prohibited';
        premiumLoad = 0; // Decline
      } else if (baseScore >= 50) {
        riskTier = 'high';
        premiumLoad = 1.5; // 50% extra
      } else if (baseScore >= 30) {
        riskTier = 'medium';
        premiumLoad = 1.2; // 20% extra
      }

      return {
        riskScore: Math.min(baseScore, 100),
        riskTier,
        premiumLoad,
        riskFactors
      };

    } catch (error) {
      console.error('Underwriting error:', error);
      return this.getDefaultRisk('medium');
    }
  }

  private static getDefaultRisk(tier: RiskAssessment['riskTier']): RiskAssessment {
    const defaults = {
      low: { score: 10, load: 1.0 },
      medium: { score: 40, load: 1.2 },
      high: { score: 70, load: 1.5 },
      prohibited: { score: 90, load: 0 }
    };

    return {
      riskScore: defaults[tier].score,
      riskTier: tier,
      premiumLoad: defaults[tier].load,
      riskFactors: ['Default Assessment (Error or Missing Data)']
    };
  }
}
