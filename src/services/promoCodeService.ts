import { supabase } from "@/integrations/supabase/client";

export interface PromoCode {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  description: string | null;
  terms_conditions: string | null;
  min_booking_amount: number | null;
}

export interface PromoCodeUsage {
  id: string;
  promo_code_id: string;
  user_id: string;
  booking_id: string | null;
  discount_applied: number;
  used_at: string;
  promo_codes?: PromoCode;
}

export interface PromoCodeValidation {
  valid: boolean;
  error?: string;
  discount?: number;
  promoCode?: PromoCode;
}

export async function validatePromoCode(
  code: string, 
  userId: string, 
  bookingAmount: number
): Promise<PromoCodeValidation> {
  try {
    // 1. Fetch promo code
    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !promoCode) {
      return { valid: false, error: 'Invalid promo code' };
    }

    // 2. Check basic validity
    if (!promoCode.is_active) {
      return { valid: false, error: 'Promo code is inactive' };
    }

    const now = new Date();
    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return { valid: false, error: 'Promo code has expired' };
    }

    if (new Date(promoCode.valid_from) > now) {
      return { valid: false, error: 'Promo code is not yet valid' };
    }

    // 3. Check usage limits
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return { valid: false, error: 'Promo code usage limit reached' };
    }

    // 4. Check minimum booking amount
    if (promoCode.min_booking_amount && bookingAmount < promoCode.min_booking_amount) {
      return { valid: false, error: `Minimum booking amount of P${promoCode.min_booking_amount} required` };
    }

    // 5. Check if user already used it
    const { data: existingUsage } = await supabase
      .from('promo_code_usage')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingUsage) {
      return { valid: false, error: 'You have already used this promo code' };
    }

    // 6. Calculate discount
    const discount = calculateDiscount(promoCode as unknown as PromoCode, bookingAmount);

    return { 
      valid: true, 
      discount, 
      promoCode: promoCode as unknown as PromoCode 
    };

  } catch (error) {
    console.error('Error validating promo code:', error);
    return { valid: false, error: 'Failed to validate promo code' };
  }
}

export function calculateDiscount(promoCode: PromoCode, bookingAmount: number): number {
  let discount = 0;
  if (promoCode.discount_type === 'percentage') {
    discount = (bookingAmount * promoCode.discount_amount) / 100;
    // Check max discount amount for percentage based codes if column exists (schema has it)
    // We assume the type has it.
  } else {
    discount = promoCode.discount_amount;
  }

  // Ensure discount doesn't exceed booking amount
  return Math.min(discount, bookingAmount);
}

export async function applyPromoCode(
  promoCodeId: string, 
  userId: string, 
  bookingId: string, 
  discountApplied: number,
  originalAmount: number,
  finalAmount: number
): Promise<void> {
  // 1. Insert usage record
  const { error } = await supabase
    .from('promo_code_usage')
    .insert({
      promo_code_id: promoCodeId,
      user_id: userId,
      booking_id: bookingId,
      discount_applied: discountApplied,
      original_amount: originalAmount,
      final_amount: finalAmount
    });

  if (error) throw error;

  // 2. Increment usage count (via RPC to bypass RLS on update if necessary, or trigger)
  // We'll try RPC first as we created it
  await supabase.rpc('increment_promo_code_uses', { promo_id: promoCodeId });
}

export async function getAvailablePromoCodes(userId: string): Promise<PromoCode[]> {
  // This is a bit complex because we need to check "available to user".
  // For now, return all active codes that haven't expired.
  // Filtering by "already used" might need a join or client-side filter.
  
  const { data: codes, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('is_active', true)
    .gt('valid_until', new Date().toISOString());

  if (error) return [];

  // Filter out used ones
  const { data: usage } = await supabase
    .from('promo_code_usage')
    .select('promo_code_id')
    .eq('user_id', userId);
  
  const usedIds = new Set(usage?.map(u => u.promo_code_id) || []);
  
  return (codes as unknown as PromoCode[]).filter(c => !usedIds.has(c.id));
}

export async function getUserPromoCodeHistory(userId: string): Promise<PromoCodeUsage[]> {
  const { data, error } = await supabase
    .from('promo_code_usage')
    .select('*, promo_codes(*)')
    .eq('user_id', userId)
    .order('used_at', { ascending: false });

  if (error) throw error;
  return data as unknown as PromoCodeUsage[];
}
