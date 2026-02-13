export interface BookingPaymentRequest {
  booking_id: string;
  payment_method: 'card' | 'orange_money' | 'myzaka' | 'smega';
  mobile_number?: string;  // Required for mobile money
  
  // Price breakdown (from UnifiedPriceSummary)
  base_rental_price: number;
  dynamic_pricing_adjustment: number;
  insurance_premium: number;
  discount_amount: number;
  grand_total: number;
}

export interface BookingPaymentResult {
  success: boolean;
  transaction_id?: string;
  provider_reference?: string;
  
  // Split calculations (for verification/display)
  platform_commission?: number;           // 15% of rental portion
  host_earnings?: number;                 // 85% of rental portion
  mobirides_insurance_commission?: number;// 10% of insurance premium
  payu_remittance_amount?: number;        // 90% of insurance premium
  
  error_code?: string;
  error_message?: string;
  requires_user_action?: boolean;         // true for OrangeMoney USSD
}

class MockBookingPaymentService {
  async processPayment(request: BookingPaymentRequest): Promise<BookingPaymentResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Deterministic testing based on cents/decimal part
    const cents = Math.round((request.grand_total % 1) * 100);

    // .01 = Insufficient funds
    if (cents === 1) {
      return {
        success: false,
        error_code: 'INSUFFICIENT_FUNDS',
        error_message: 'Insufficient funds in payment method'
      };
    }

    // .02 = Timeout
    if (cents === 2) {
      return {
        success: false,
        error_code: 'TIMEOUT',
        error_message: 'Payment gateway timeout. Please try again.'
      };
    }

    // .03 = Declined
    if (cents === 3) {
      return {
        success: false,
        error_code: 'DECLINED',
        error_message: 'Card declined by issuer.'
      };
    }

    // .04 = Pending (Async flow)
    if (cents === 4) {
      return {
        success: true,
        requires_user_action: true,
        transaction_id: `TXN_${Date.now()}_PENDING`,
        provider_reference: `REF_${Date.now()}_USSD`
      };
    }

    // Default: Success (95% chance if not using triggers)
    // If cents is not 1, 2, 3, 4, treat as normal test
    // For happy path testing, use .99 or any other value
    
    // Calculate splits
    const rentalPortion = request.base_rental_price + request.dynamic_pricing_adjustment - request.discount_amount;
    const platform_commission = rentalPortion * 0.15;
    const host_earnings = rentalPortion * 0.85;
    
    const insurance_premium = request.insurance_premium;
    const mobirides_insurance_commission = insurance_premium * 0.10;
    const payu_remittance_amount = insurance_premium * 0.90;

    return {
      success: true,
      transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`,
      provider_reference: `REF_${Date.now()}`,
      platform_commission,
      host_earnings,
      mobirides_insurance_commission,
      payu_remittance_amount
    };
  }
}

export const mockBookingPaymentService = new MockBookingPaymentService();
