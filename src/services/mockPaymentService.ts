// Mock payment service for development and testing
export interface PaymentRequest {
  amount: number;
  payment_method: string;
}

export interface PaymentResult {
  success: boolean;
  payment_reference?: string;
  error_message?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
}

class MockPaymentService {
  private presetAmounts = [50, 100, 200, 500, 1000];
  
  private paymentMethods: PaymentMethod[] = [
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Pay with GCash mobile wallet',
      icon: 'wallet'
    },
    {
      id: 'maya',
      name: 'Maya (PayMaya)',
      description: 'Pay with Maya digital wallet',
      icon: 'creditCard'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer from your bank account',
      icon: 'building'
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Visa, Mastercard, American Express',
      icon: 'creditCard'
    }
  ];

  getPresetAmounts(): number[] {
    return this.presetAmounts;
  }

  getAvailablePaymentMethods(): PaymentMethod[] {
    return this.paymentMethods;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 95% success rate (5% failure for testing)
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        payment_reference: `PAY_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`
      };
    } else {
      const errorMessages = [
        'Insufficient funds in payment method',
        'Payment method temporarily unavailable',
        'Transaction limit exceeded',
        'Payment gateway timeout'
      ];
      
      return {
        success: false,
        error_message: errorMessages[Math.floor(Math.random() * errorMessages.length)]
      };
    }
  }

  // Helper method to validate payment amounts
  isValidAmount(amount: number): boolean {
    return amount >= 10 && amount <= 50000; // Min 10, Max 50,000
  }

  // Get payment method by ID
  getPaymentMethodById(id: string): PaymentMethod | undefined {
    return this.paymentMethods.find(method => method.id === id);
  }
}

export const mockPaymentService = new MockPaymentService();