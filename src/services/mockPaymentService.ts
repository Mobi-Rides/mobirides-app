
import { toast } from "@/utils/toast-utils";

export interface MockPaymentRequest {
  amount: number;
  payment_method: string;
}

export interface MockPaymentResponse {
  success: boolean;
  payment_reference?: string;
  error_message?: string;
}

export interface MockPaymentConfig {
  enableFailures: boolean;
  failureRate: number;
  processingDelay: number;
  maxAmount: number;
  minAmount: number;
}

class MockPaymentService {
  private config: MockPaymentConfig = {
    enableFailures: false, // Disabled by default for better UX
    failureRate: 0.05, // 5% failure rate when enabled
    processingDelay: 2000,
    maxAmount: 50000,
    minAmount: 10
  };

  // Configure the mock service for testing
  configure(config: Partial<MockPaymentConfig>) {
    this.config = { ...this.config, ...config };
  }

  async processPayment(request: MockPaymentRequest): Promise<MockPaymentResponse> {
    console.log('MockPaymentService: Starting payment processing', { 
      amount: request.amount, 
      method: request.payment_method,
      config: this.config 
    });

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, this.config.processingDelay));

    // Validate amount
    if (request.amount <= 0) {
      console.log('MockPaymentService: Invalid amount - must be positive');
      return {
        success: false,
        error_message: "Invalid amount"
      };
    }

    if (request.amount < this.config.minAmount) {
      console.log('MockPaymentService: Amount below minimum', { min: this.config.minAmount });
      return {
        success: false,
        error_message: `Minimum top-up amount is P${this.config.minAmount}.00`
      };
    }

    if (request.amount > this.config.maxAmount) {
      console.log('MockPaymentService: Amount exceeds maximum', { max: this.config.maxAmount });
      return {
        success: false,
        error_message: `Amount exceeds maximum limit of P${this.config.maxAmount.toLocaleString()}`
      };
    }

    // Simulate random payment failures only if enabled
    if (this.config.enableFailures && Math.random() < this.config.failureRate) {
      console.log('MockPaymentService: Simulated payment failure');
      return {
        success: false,
        error_message: "Payment processing failed. Please try again."
      };
    }

    // Generate mock payment reference
    const payment_reference = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('MockPaymentService: Payment successful', { payment_reference });
    return {
      success: true,
      payment_reference
    };
  }

  getAvailablePaymentMethods(): string[] {
    return ["credit_card", "debit_card", "paypal", "bank_transfer", "mobile_money"];
  }

  getPresetAmounts(): number[] {
    return [50, 100, 200, 500, 1000, 2000];
  }

  // Development testing methods
  simulateSuccess(): void {
    this.configure({ enableFailures: false });
    console.log('MockPaymentService: Configured for guaranteed success');
  }

  simulateFailures(rate: number = 0.3): void {
    this.configure({ enableFailures: true, failureRate: rate });
    console.log('MockPaymentService: Configured to simulate failures at', rate * 100, '%');
  }

  setProcessingDelay(delay: number): void {
    this.configure({ processingDelay: delay });
    console.log('MockPaymentService: Set processing delay to', delay, 'ms');
  }
}

export const mockPaymentService = new MockPaymentService();

// Development helpers - available in console
if (typeof window !== 'undefined') {
  (window as any).mockPaymentService = mockPaymentService;
  console.log('MockPaymentService available in console for testing');
}
