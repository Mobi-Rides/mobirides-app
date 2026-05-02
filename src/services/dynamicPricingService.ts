import { format, parseISO, differenceInDays, getDay, getMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  PricingRule,
  PricingRuleType,
  PricingCalculation,
  PricingRequest,
  AppliedRule,
  Season,
  DemandData,
  UserLoyaltyData,
  PricingConditions
} from "@/types/pricing";

export class DynamicPricingService {
  /**
   * Calculate dynamic price for a booking request
   */
  static async calculatePrice(request: PricingRequest): Promise<PricingCalculation> {
    try {
      console.log("[DynamicPricing] Calculating price for request:", request);

      // Check if dynamic pricing is enabled globally
      let isDynamicPricingEnabled = true;
      try {
        const { data: settingsData } = await supabase
          .from("platform_settings")
          .select("setting_value")
          .eq("setting_key", "dynamic_pricing_enabled")
          .single();

        if (settingsData) {
          isDynamicPricingEnabled = settingsData.setting_value === "true";
        }
      } catch (err) {
        console.error("[DynamicPricing] Failed to fetch dynamic pricing toggle:", err);
      }

      if (!isDynamicPricingEnabled) {
        return {
          base_price: request.base_price,
          applied_rules: [],
          total_multiplier: 1.0,
          final_price: request.base_price,
          is_dynamic: false
        };
      }

      // Get hardcoded pricing rules as secondary fallback
      let rules = this.getDefaultPricingRules();

      // Attempt to load from DB
      try {
        const { data: dbRules, error } = await supabase
          .from("dynamic_pricing_rules")
          .select("*")
          .eq("is_active", true);

        if (!error && dbRules && dbRules.length > 0) {
          // map db rows to PricingRule format
          rules = dbRules.map((dbRule) => ({
            id: dbRule.id,
            name: dbRule.rule_name,
            type: dbRule.condition_type as PricingRuleType,
            is_active: dbRule.is_active,
            multiplier: dbRule.multiplier,
            conditions: dbRule.condition_value as unknown as PricingConditions,
            priority: dbRule.priority || 0,
            created_at: dbRule.created_at || new Date().toISOString(),
            updated_at: dbRule.created_at || new Date().toISOString(),
          }));
        } else {
          rules = rules.filter(r => r.is_active);
        }
      } catch (err) {
        console.error("[DynamicPricing] Failed to fetch dynamic rules from DB:", err);
        rules = rules.filter(r => r.is_active);
      }

      // Get user loyalty data if user is provided
      let loyaltyData: UserLoyaltyData | null = null;
      if (request.user_id) {
        loyaltyData = await this.getUserLoyaltyData(request.user_id);
      }

      // Get demand data for location (simplified)
      const demandData = this.getSimulatedDemandData(
        request.pickup_latitude,
        request.pickup_longitude
      );

      // Apply pricing rules
      const appliedRules: AppliedRule[] = [];
      let totalMultiplier = 1.0;

      // Sort rules by priority (higher priority first)
      const sortedRules = rules.sort((a, b) => b.priority - a.priority);

      // Only the highest-priority matching DURATION rule applies (no compounding).
      let durationRuleApplied = false;

      for (const rule of sortedRules) {
        if (rule.type === PricingRuleType.DURATION && durationRuleApplied) continue;

        const ruleApplies = this.evaluateRule(rule, request, loyaltyData, demandData);

        if (ruleApplies) {
          if (rule.type === PricingRuleType.DURATION) durationRuleApplied = true;

          appliedRules.push({
            rule_id: rule.id,
            rule_name: rule.name,
            rule_type: rule.type,
            multiplier: rule.multiplier,
            description: this.generateRuleDescription(rule)
          });

          // Apply multiplier
          totalMultiplier *= rule.multiplier;
        }
      }

      const finalPrice = Math.round(request.base_price * totalMultiplier * 100) / 100;
      const difference = finalPrice - request.base_price;

      const calculation: PricingCalculation = {
        base_price: request.base_price,
        applied_rules: appliedRules,
        total_multiplier: totalMultiplier,
        final_price: finalPrice,
        is_dynamic: appliedRules.length > 0,
        savings: difference < 0 ? Math.abs(difference) : undefined,
        premium: difference > 0 ? difference : undefined
      };

      console.log("[DynamicPricing] Calculation result:", calculation);
      return calculation;
    } catch (error) {
      console.error("[DynamicPricing] Error calculating price:", error);
      // Return base price if calculation fails
      return {
        base_price: request.base_price,
        applied_rules: [],
        total_multiplier: 1.0,
        final_price: request.base_price,
        is_dynamic: false
      };
    }
  }

  /**
   * Get default hardcoded pricing rules
   */
  static getDefaultPricingRules(): PricingRule[] {
    return [
      {
        id: "weekend-premium",
        name: "Weekend Premium",
        type: PricingRuleType.WEEKEND,
        is_active: true,
        multiplier: 1.2,
        priority: 100,
        conditions: {
          days_of_week: [0, 6] // Sunday and Saturday
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "summer-premium",
        name: "Summer Season Premium",
        type: PricingRuleType.SEASONAL,
        is_active: true,
        multiplier: 1.15,
        priority: 90,
        conditions: {
          seasons: [Season.SUMMER]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "early-bird-discount",
        name: "Early Bird Discount",
        type: PricingRuleType.EARLY_BIRD,
        is_active: true,
        multiplier: 0.9,
        priority: 80,
        conditions: {
          advance_booking_days: 7
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "high-demand-premium",
        name: "High Demand Premium",
        type: PricingRuleType.DEMAND,
        is_active: true,
        multiplier: 1.3,
        priority: 110,
        conditions: {
          demand_threshold: 80
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "loyalty-gold-discount",
        name: "Loyalty Gold Discount",
        type: PricingRuleType.LOYALTY,
        is_active: true,
        multiplier: 0.95,
        priority: 70,
        conditions: {
          user_tier: "gold"
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "loyalty-platinum-discount",
        name: "Loyalty Platinum Discount",
        type: PricingRuleType.LOYALTY,
        is_active: true,
        multiplier: 0.9,
        priority: 75,
        conditions: {
          user_tier: "platinum"
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "destination-out-of-zone",
        name: "Out of Zone Premium",
        type: PricingRuleType.DESTINATION,
        is_active: true,
        multiplier: 1.5,
        priority: 105,
        conditions: {
          destination_type: "out_of_zone"
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "destination-cross-border",
        name: "Cross-Border Premium",
        type: PricingRuleType.DESTINATION,
        is_active: true,
        multiplier: 2.0,
        priority: 105,
        conditions: {
          destination_type: "cross_border"
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "monthly-discount",
        name: "Monthly Discount",
        type: PricingRuleType.DURATION,
        is_active: true,
        multiplier: 0.8,
        priority: 65,
        conditions: {
          min_duration_days: 28
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "weekly-discount",
        name: "Weekly Discount",
        type: PricingRuleType.DURATION,
        is_active: true,
        multiplier: 0.9,
        priority: 60,
        conditions: {
          min_duration_days: 7,
          max_duration_days: 27
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Evaluate if a pricing rule applies to a request
   */
  static evaluateRule(
    rule: PricingRule,
    request: PricingRequest,
    loyaltyData: UserLoyaltyData | null,
    demandData: DemandData | null
  ): boolean {
    const pickupDate = parseISO(request.pickup_date);
    const bookingDate = request.booking_date ? parseISO(request.booking_date) : new Date();

    switch (rule.type) {
      case PricingRuleType.SEASONAL:
        return this.evaluateSeasonalRule(rule, pickupDate);

      case PricingRuleType.DEMAND:
        return this.evaluateDemandRule(rule, demandData);

      case PricingRuleType.EARLY_BIRD:
        return this.evaluateEarlyBirdRule(rule, pickupDate, bookingDate);

      case PricingRuleType.LOYALTY:
        return this.evaluateLoyaltyRule(rule, loyaltyData);

      case PricingRuleType.WEEKEND:
        return this.evaluateWeekendRule(rule, pickupDate);

      case PricingRuleType.HOLIDAY:
        return this.evaluateHolidayRule(rule, pickupDate);

      case PricingRuleType.LOCATION:
        return this.evaluateLocationRule(rule, request.pickup_latitude, request.pickup_longitude);

      case PricingRuleType.DESTINATION:
        return this.evaluateDestinationRule(rule, request.destination_type);

      case PricingRuleType.DURATION: {
        if (!request.return_date) return false;
        const returnDate = parseISO(request.return_date);
        return this.evaluateDurationRule(rule, pickupDate, returnDate);
      }

      default:
        return false;
    }
  }

  /**
   * Evaluate seasonal pricing rule
   */
  static evaluateSeasonalRule(rule: PricingRule, pickupDate: Date): boolean {
    if (!rule.conditions.months && !rule.conditions.seasons) return false;

    const month = getMonth(pickupDate) + 1; // getMonth returns 0-11, we want 1-12

    // Check months
    if (rule.conditions.months && rule.conditions.months.includes(month)) {
      return true;
    }

    // Check seasons
    if (rule.conditions.seasons) {
      const season = this.getSeasonFromMonth(month);
      return rule.conditions.seasons.includes(season);
    }

    return false;
  }

  /**
   * Evaluate demand-based pricing rule
   */
  static evaluateDemandRule(rule: PricingRule, demandData: DemandData | null): boolean {
    if (!demandData || !rule.conditions.demand_threshold) return false;

    return demandData.demand_percentage >= rule.conditions.demand_threshold;
  }

  /**
   * Evaluate early bird pricing rule
   */
  static evaluateEarlyBirdRule(rule: PricingRule, pickupDate: Date, bookingDate: Date): boolean {
    if (!rule.conditions.advance_booking_days) return false;

    const daysInAdvance = differenceInDays(pickupDate, bookingDate);
    return daysInAdvance >= rule.conditions.advance_booking_days;
  }

  /**
   * Evaluate loyalty pricing rule
   */
  static evaluateLoyaltyRule(rule: PricingRule, loyaltyData: UserLoyaltyData | null): boolean {
    if (!loyaltyData) return false;

    // Check minimum bookings
    if (rule.conditions.min_bookings && loyaltyData.total_bookings < rule.conditions.min_bookings) {
      return false;
    }

    // Check user tier
    if (rule.conditions.user_tier && loyaltyData.tier !== rule.conditions.user_tier) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate weekend pricing rule
   */
  static evaluateWeekendRule(rule: PricingRule, pickupDate: Date): boolean {
    if (!rule.conditions.days_of_week) return false;

    const dayOfWeek = getDay(pickupDate); // 0 = Sunday, 6 = Saturday
    return rule.conditions.days_of_week.includes(dayOfWeek);
  }

  /**
   * Evaluate holiday pricing rule
   */
  static evaluateHolidayRule(rule: PricingRule, pickupDate: Date): boolean {
    // This would check against a holiday calendar
    // For now, return false as holidays need to be configured separately
    return false;
  }

  /**
   * Evaluate location pricing rule
   */
  static evaluateLocationRule(rule: PricingRule, latitude?: number, longitude?: number): boolean {
    if (!latitude || !longitude || !rule.conditions.coordinates) return false;

    const bounds = rule.conditions.coordinates;
    return (
      latitude >= bounds.south &&
      latitude <= bounds.north &&
      longitude >= bounds.west &&
      longitude <= bounds.east
    );
  }

  /**
   * Evaluate duration-based pricing rule (weekly / monthly discount)
   */
  static evaluateDurationRule(rule: PricingRule, pickupDate: Date, returnDate: Date): boolean {
    const { min_duration_days, max_duration_days } = rule.conditions;
    if (min_duration_days === undefined) return false;

    const totalDays = differenceInDays(returnDate, pickupDate);
    if (totalDays < min_duration_days) return false;
    if (max_duration_days !== undefined && totalDays > max_duration_days) return false;

    return true;
  }

  /**
   * Evaluate destination-based pricing rule
   */
  static evaluateDestinationRule(rule: PricingRule, destinationType?: string): boolean {
    if (!destinationType || !rule.conditions.destination_type) return false;
    return destinationType === rule.conditions.destination_type;
  }

  /**
   * Get season from month number (Southern Hemisphere - Botswana)
   */
  static getSeasonFromMonth(month: number): Season {
    // Southern Hemisphere seasons (Botswana)
    if (month === 12 || month <= 2) return Season.SUMMER;  // Dec-Feb: Summer (+15% peak)
    if (month >= 3 && month <= 5) return Season.AUTUMN;    // Mar-May: Autumn
    if (month >= 6 && month <= 8) return Season.WINTER;    // Jun-Aug: Winter
    return Season.SPRING;                                   // Sep-Nov: Spring
  }

  /**
   * Get user loyalty data
   */
  static async getUserLoyaltyData(userId: string): Promise<UserLoyaltyData | null> {
    try {
      // This would be implemented when supabase integration is available
      // For now, return mock data based on user ID pattern
      const mockBookings = Math.floor(Math.random() * 25); // 0-24 bookings
      const mockSpent = mockBookings * 150; // Average P150 per booking

      // Determine tier based on total bookings
      let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (mockBookings >= 20) tier = 'platinum';
      else if (mockBookings >= 10) tier = 'gold';
      else if (mockBookings >= 5) tier = 'silver';

      return {
        user_id: userId,
        total_bookings: mockBookings,
        total_spent: mockSpent,
        tier,
        loyalty_points: mockBookings * 10,
        member_since: "2023-01-01T00:00:00Z" // Mock date
      };
    } catch (error) {
      console.error("Error in getUserLoyaltyData:", error);
      return null;
    }
  }

  /**
   * Get simulated demand data for a location
   */
  static getSimulatedDemandData(latitude?: number, longitude?: number): DemandData | null {
    if (!latitude || !longitude) return null;

    // Simulate demand based on location and time
    // Higher demand in city centers, airports, etc.
    const isHighDemandArea = Math.abs(latitude - (-24.6282)) < 0.1 && Math.abs(longitude - 25.9231) < 0.1; // Near Gaborone
    const baseDemand = isHighDemandArea ? 75 : 45;
    const randomVariation = Math.floor(Math.random() * 30) - 15; // ±15%
    const demandPercentage = Math.max(0, Math.min(100, baseDemand + randomVariation));

    return {
      location: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
      total_cars: 50,
      booked_cars: Math.floor((demandPercentage / 100) * 50),
      demand_percentage: demandPercentage,
      trending: demandPercentage > 70 ? 'up' : demandPercentage < 40 ? 'down' : 'stable'
    };
  }

  /**
   * Generate human-readable description for a pricing rule
   */
  static generateRuleDescription(rule: PricingRule): string {
    const multiplierText = rule.multiplier > 1
      ? `+${((rule.multiplier - 1) * 100).toFixed(0)}%`
      : `-${((1 - rule.multiplier) * 100).toFixed(0)}%`;

    switch (rule.type) {
      case PricingRuleType.SEASONAL:
        return `Seasonal rate (${multiplierText})`;
      case PricingRuleType.DEMAND:
        return `High demand pricing (${multiplierText})`;
      case PricingRuleType.EARLY_BIRD:
        return `Early booking discount (${multiplierText})`;
      case PricingRuleType.LOYALTY:
        return `Loyalty member discount (${multiplierText})`;
      case PricingRuleType.WEEKEND:
        return `Weekend premium (${multiplierText})`;
      case PricingRuleType.HOLIDAY:
        return `Holiday premium (${multiplierText})`;
      case PricingRuleType.LOCATION:
        return `Location premium (${multiplierText})`;
      case PricingRuleType.DESTINATION:
        return `Destination premium (${multiplierText})`;
      case PricingRuleType.DURATION:
        return `Duration discount (${multiplierText})`;
      default:
        return `${rule.name} (${multiplierText})`;
    }
  }

  /**
   * Calculate price with explanation for booking dialog
   */
  static async calculateBookingPrice(
    carId: string,
    basePrice: number,
    startDate: Date,
    endDate: Date,
    pickupLatitude?: number,
    pickupLongitude?: number,
    userId?: string,
    destinationType?: 'local' | 'out_of_zone' | 'cross_border'
  ): Promise<PricingCalculation> {
    const request: PricingRequest = {
      car_id: carId,
      base_price: basePrice,
      pickup_date: format(startDate, "yyyy-MM-dd"),
      return_date: format(endDate, "yyyy-MM-dd"),
      pickup_latitude: pickupLatitude,
      pickup_longitude: pickupLongitude,
      user_id: userId,
      booking_date: format(new Date(), "yyyy-MM-dd"),
      destination_type: destinationType
    };

    return this.calculatePrice(request);
  }
} 