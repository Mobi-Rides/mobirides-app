export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface InsurancePackage {
  id: string
  name: string
  display_name: string
  description: string
  premium_percentage: number
  coverage_cap: number | null
  excess_amount: number | null
  covers_minor_damage: boolean
  covers_major_incidents: boolean
  features: string[]
  exclusions: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface InsurancePolicy {
  id: string
  policy_number: string
  booking_id: string
  package_id: string
  renter_id: string
  car_id: string
  start_date: string
  end_date: string
  rental_amount_per_day: number
  premium_per_day: number
  number_of_days: number
  total_premium: number
  coverage_cap: number | null
  excess_amount: number | null
  status: 'active' | 'expired' | 'cancelled' | 'claimed'
  terms_accepted_at: string
  terms_version: string
  policy_document_url: string | null
  created_at: string
  updated_at: string
}

export interface InsuranceClaim {
  id: string
  claim_number: string
  policy_id: string
  booking_id: string
  renter_id: string
  incident_date: string
  incident_type: string
  incident_description: string
  damage_description: string
  location: string
  police_report_filed: boolean
  police_report_number: string | null
  police_station: string | null
  estimated_damage_cost: number | null
  actual_damage_cost: number | null
  status: 'submitted' | 'under_review' | 'more_info_needed' | 'approved' | 'rejected' | 'paid' | 'closed'
  approved_amount: number | null
  excess_paid: number | null
  admin_fee: number | null
  payout_amount: number | null
  total_claim_cost: number | null
  rejection_reason: string | null
  evidence_urls: string[] | null
  repair_quotes_urls: string[] | null
  repair_invoices_urls: string[] | null
  submitted_at: string
  reviewed_at: string | null
  more_info_requested_at: string | null
  resolved_at: string | null
  paid_at: string | null
  admin_notes: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  min_booking_amount: number | null
  max_discount_amount: number | null
  start_date: string | null
  end_date: string | null
  usage_limit: number | null
  usage_count: number
  is_active: boolean
  created_at: string
}
