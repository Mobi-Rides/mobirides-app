export interface PricingRule {
  id: string;
  name: string;
  type: PricingRuleType;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  multiplier: number;
  conditions: PricingConditions;
  priority: number;
  created_at: string;
  updated_at: string;
}

export enum PricingRuleType {
  SEASONAL = "seasonal",
  DEMAND = "demand",
  EARLY_BIRD = "early_bird",
  LOYALTY = "loyalty",
  WEEKEND = "weekend",
  HOLIDAY = "holiday",
  LOCATION = "location"
}

export interface PricingConditions {
  // Seasonal conditions
  months?: number[]; // 1-12 for January-December
  seasons?: Season[];
  
  // Demand conditions
  demand_threshold?: number; // Percentage of cars booked to trigger
  location_radius?: number; // Km radius for demand calculation
  
  // Early bird conditions
  advance_booking_days?: number; // Days in advance for discount
  
  // Loyalty conditions
  min_bookings?: number; // Minimum number of previous bookings
  user_tier?: string; // bronze, silver, gold, platinum
  
  // Time conditions
  days_of_week?: number[]; // 0-6 for Sunday-Saturday
  time_ranges?: TimeRange[];
  
  // Location conditions
  regions?: string[];
  cities?: string[];
  coordinates?: GeographicBounds;
}

export enum Season {
  SPRING = "spring",
  SUMMER = "summer",
  AUTUMN = "autumn", 
  WINTER = "winter"
}

export interface TimeRange {
  start_time: string; // HH:mm format
  end_time: string;
}

export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PricingCalculation {
  base_price: number;
  applied_rules: AppliedRule[];
  total_multiplier: number;
  final_price: number;
  savings?: number; // If final price is lower than base
  premium?: number; // If final price is higher than base
}

export interface AppliedRule {
  rule_id: string;
  rule_name: string;
  rule_type: PricingRuleType;
  multiplier: number;
  description: string;
}

export interface DemandData {
  location: string;
  total_cars: number;
  booked_cars: number;
  demand_percentage: number;
  trending: 'up' | 'down' | 'stable';
}

export interface UserLoyaltyData {
  user_id: string;
  total_bookings: number;
  total_spent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyalty_points: number;
  member_since: string;
}

export interface PricingRequest {
  car_id: string;
  base_price: number;
  pickup_date: string;
  return_date: string;
  pickup_time?: string;
  return_time?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  user_id?: string;
  booking_date?: string; // When the booking is being made (for early bird)
}

export interface SeasonalRate {
  id: string;
  season: Season;
  multiplier: number;
  start_month: number;
  end_month: number;
  name: string;
  is_active: boolean;
}

export interface HolidayRate {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  multiplier: number;
  is_active: boolean;
}

export interface LocationPremium {
  id: string;
  area_name: string;
  coordinates: GeographicBounds;
  multiplier: number;
  is_active: boolean;
  reason: string; // e.g., "Airport proximity", "City center", etc.
} 