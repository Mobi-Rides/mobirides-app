
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

class MockPaymentService {
  async processPayment(request: MockPaymentRequest): Promise<MockPaymentResponse> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock payment validation
    if (request.amount <= 0) {
      return {
        success: false,
        error_message: "Invalid amount"
      };
    }

    if (request.amount > 50000) {
      return {
        success: false,
        error_message: "Amount exceeds maximum limit of P50,000"
      };
    }

    // Remove random failures for better user experience
    // In production, you might want to add this back with a much lower rate
    // Simulate random payment failures (1% chance instead of 10%)
    if (Math.random() < 0.01) {
      return {
        success: false,
        error_message: "Payment processing failed. Please try again."
      };
    }

    // Generate mock payment reference
    const payment_reference = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      payment_reference
    };
  }

  getAvailablePaymentMethods(): string[] {
    return ["credit_card", "debit_card", "paypal", "bank_transfer"];
  }

  getPresetAmounts(): number[] {
    // Return amounts in BWP instead of USD
    return [50, 100, 200, 500, 1000];
  }
}

export const mockPaymentService = new MockPaymentService();
