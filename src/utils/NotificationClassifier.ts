/**
 * NotificationClassifier Utility
 * --------------------------------
 * This utility provides a robust, 9-layer, priority-weighted classification system for notifications.
 * It distinguishes between 'payment', 'booking', and 'other' notifications with a confidence score and reasons.
 *
 * Usage Example:
 *
 *   import { NotificationClassifier } from "@/utils/NotificationClassifier";
 *   const result = NotificationClassifier.classifyNotification(notification);
 *   // result.type: 'payment' | 'booking' | 'other'
 *   // result.confidence: number (0-100)
 *   // result.reasons: string[]
 *
 * API:
 *   classifyNotification(notification: any): { type: 'payment' | 'booking' | 'other', confidence: number, reasons: string[] }
 *
 * Extension:
 *   - To add new classification logic, add a new layer in the method with a clear priority/weight.
 *   - To adjust weights, modify the numeric values in each layer.
 *
 * Tests:
 *   See src/utils/NotificationClassifier.test.ts for comprehensive test cases.
 *   Run tests with: npm test
 */

// Interface for notification objects
interface NotificationLike {
  content?: string;
  type?: string;
  related_booking_id?: string | null;
  related_car_id?: string | null;
  metadata?: any;
  // Extended properties for enhanced classification
  amount?: number;
  currency?: string;
  currency_code?: string;
  sender_role?: string;
}

// Advanced Notification Classification System (Full 9-Layer, Priority-Weighted, Backend-Agnostic, Context-Aware)
export class NotificationClassifier {
  private static readonly PAYMENT_KEYWORDS = [
    'wallet', 'payment', 'earned', 'commission', 'balance', 'transaction', 'funds', 'credit', 'debit', 'withdrawal', 'deposit', 'refund',
    'charge', 'billing', 'invoice', 'receipt', 'transfer', 'settlement', 'payout', 'revenue', 'income', 'profit', 'fee', 'cost', 'amount', 'dollar', 'usd', '$', 'peso', 'pesos', 'p₱', '₱'
  ];
  private static readonly BOOKING_KEYWORDS = [
    'booking', 'rental', 'car', 'vehicle', 'reservation', 'pickup', 'return', 'host', 'renter', 'trip', 'journey', 'drive', 'start', 'end', 'schedule', 'cancel', 'request', 'appointment', 'time', 'date', 'duration', 'location', 'address', 'dropoff', 'handover', 'inspection'
  ];
  private static readonly PAYMENT_ACTIONS = [
    'topped up', 'deducted', 'received', 'processed', 'sent', 'withdrawn', 'credited', 'debited', 'completed', 'successful', 'failed', 'pending', 'approved', 'rejected', 'settled', 'transferred', 'deposited'
  ];
  private static readonly BOOKING_ACTIONS = [
    'confirmed', 'cancelled', 'requested', 'started', 'ended', 'scheduled', 'rescheduled', 'extended', 'shortened', 'approved', 'rejected', 'pending', 'completed', 'active', 'inactive', 'expired', 'terminated'
  ];
  private static readonly CURRENCY_PATTERNS = [
    /\$[\d,]+\.?\d*/g,
    /\bP\d+\.?\d*\b/i,
    /\b\d+\.?\d*\s*pesos?\b/i,
    /\d+\.?\d*\s*(dollars?|USD|usd)/gi,
    /amount:\s*\$?[\d,]+\.?\d*/gi,
    /total:\s*\$?[\d,]+\.?\d*/gi
  ];
  private static readonly CAR_BRANDS = [
    'toyota', 'honda', 'bmw', 'mercedes', 'audi', 'ford', 'chevrolet', 'nissan', 'hyundai', 'kia', 'volkswagen', 'volvo', 'lexus', 'acura', 'infiniti', 'cadillac', 'buick', 'dodge', 'chrysler', 'jeep', 'ram', 'gmc', 'subaru', 'mazda', 'mitsubishi', 'suzuki', 'fiat', 'alfa romeo', 'maserati', 'ferrari', 'lamborghini', 'porsche', 'bentley', 'rolls royce', 'aston martin', 'jaguar', 'land rover', 'range rover', 'mini', 'smart', 'tesla', 'rivian', 'lucid'
  ];
  private static readonly TIME_PATTERNS = [
    /tomorrow/i, /today/i, /yesterday/i, /\d{1,2}:\d{2}\s*(am|pm)/i, /\d{1,2}\/\d{1,2}\/\d{4}/, /\d{4}-\d{2}-\d{2}/, /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i, /january|february|march|april|may|june|july|august|september|october|november|december/i
  ];

  public static classifyNotification(notification: NotificationLike): { type: 'payment' | 'booking' | 'other', confidence: number, reasons: string[] } {
    const content = (notification.content || '').toLowerCase();
    const type = (notification.type || '').toLowerCase();
    let paymentScore = 0;
    let bookingScore = 0;
    const reasons: string[] = [];

    // 1. Backend type as a WEAK hint (2 points only)
    if (type.includes('booking')) {
      bookingScore += 2;
      reasons.push("Type contains 'booking' (weak hint)");
    } else if (type.includes('wallet') || type.includes('payment')) {
      paymentScore += 2;
      reasons.push("Type contains 'wallet' or 'payment' (weak hint)");
    }

    // 2. Currency pattern (priority 12)
    if (this.CURRENCY_PATTERNS.some((pattern) => pattern.test(content))) {
      paymentScore += 12;
      reasons.push('Currency pattern detected');
    }

    // 3. Strong payment indicators (priority 15)
    if (content.includes('wallet') || content.includes('topup') || content.includes('topped up')) {
      paymentScore += 15;
      reasons.push('Strong payment indicator (wallet/topup)');
    }

    // 4. Keyword density (1 per keyword)
    const paymentKeywordCount = this.PAYMENT_KEYWORDS.filter((k) => content.includes(k)).length;
    const bookingKeywordCount = this.BOOKING_KEYWORDS.filter((k) => content.includes(k)).length;
    paymentScore += paymentKeywordCount;
    bookingScore += bookingKeywordCount;
    if (paymentKeywordCount > 0) reasons.push(`Payment keywords: ${paymentKeywordCount}`);
    if (bookingKeywordCount > 0) reasons.push(`Booking keywords: ${bookingKeywordCount}`);

    // 5. Action verb analysis (3 per action)
    const paymentActionCount = this.PAYMENT_ACTIONS.filter((a) => content.includes(a)).length;
    const bookingActionCount = this.BOOKING_ACTIONS.filter((a) => content.includes(a)).length;
    paymentScore += paymentActionCount * 3;
    bookingScore += bookingActionCount * 3;
    if (paymentActionCount > 0) reasons.push(`Payment actions: ${paymentActionCount}`);
    if (bookingActionCount > 0) reasons.push(`Booking actions: ${bookingActionCount}`);

    // 6. Car brand detection (5)
    if (this.CAR_BRANDS.some((brand) => content.includes(brand))) {
      bookingScore += 5;
      reasons.push('Car brand detected');
    }

    // 7. Time/date pattern (3)
    if (this.TIME_PATTERNS.some((pattern) => pattern.test(content))) {
      bookingScore += 3;
      reasons.push('Time/date pattern detected');
    }

    // 8. Semantic context (6)
    if (content.includes('earned') || content.includes('commission') || content.includes('profit')) {
      paymentScore += 6;
      reasons.push('Semantic: earning/profit context');
    }
    if (content.includes('pickup') || content.includes('return') || content.includes('handover')) {
      bookingScore += 6;
      reasons.push('Semantic: rental logistics context');
    }

    // 9. Contextual clues from metadata/fields
    if (notification.related_booking_id) {
      bookingScore += 10;
      reasons.push('related_booking_id present (strong booking clue)');
    }
    if (notification.related_car_id) {
      bookingScore += 5;
      reasons.push('related_car_id present (booking clue)');
    }
    if (typeof notification.amount === 'number' && notification.amount > 0) {
      paymentScore += 10;
      reasons.push('amount field present (strong payment clue)');
    }
    if (notification.currency || notification.currency_code) {
      paymentScore += 5;
      reasons.push('currency field present (payment clue)');
    }
    // Sender/receiver roles (if available)
    if (notification.sender_role === 'host' && content.includes('payment')) {
      paymentScore += 2;
      reasons.push('sender_role host with payment context');
    }
    if (notification.sender_role === 'renter' && content.includes('booking')) {
      bookingScore += 2;
      reasons.push('sender_role renter with booking context');
    }

    // 10. Negative signals: if payment words are present, reduce booking score, and vice versa
    if (paymentKeywordCount > 0) {
      bookingScore -= paymentKeywordCount * 1.5;
      reasons.push(`Booking score penalized by payment keywords: -${paymentKeywordCount * 1.5}`);
      bookingScore = Math.max(0, bookingScore); // Ensure score doesn't go below 0
    }
    if (bookingKeywordCount > 0) {
      paymentScore -= bookingKeywordCount * 1.5;
      reasons.push(`Payment score penalized by booking keywords: -${bookingKeywordCount * 1.5}`);
      paymentScore = Math.max(0, paymentScore); // Ensure score doesn't go below 0
    }
    // If both payment and booking scores are high, mark as ambiguous
    if (paymentScore > 10 && bookingScore > 10) {
      reasons.push('Both payment and booking clues are strong: ambiguous');
      return { type: 'other', confidence: 50, reasons };
    }

    // 11. Fallback analysis (1)
    if (content.length > 100 && paymentScore === 0 && bookingScore === 0) {
      bookingScore += 1; // Give a minimal score to trigger booking type
      reasons.push('Fallback: long message, default to booking');
      // Explicitly set confidence for fallback to a low value
      return { type: 'booking', confidence: 50, reasons };
    }

    // Final scoring and confidence
    let finalType: 'payment' | 'booking' | 'other';
    if (paymentScore > bookingScore && paymentScore > 0) {
      finalType = 'payment';
    } else if (bookingScore > paymentScore && bookingScore > 0) {
      finalType = 'booking';
    } else {
      finalType = 'other';
    }
    const total = paymentScore + bookingScore;
    const confidence = total > 0 ? Math.round((Math.max(paymentScore, bookingScore) / total) * 100) : 0;
    // If confidence is low, mark as other
    if (confidence < 60) {
      reasons.push('Low confidence: marked as other');
      finalType = 'other';
    }
    return { type: finalType, confidence, reasons };
  }
}

export function classifyType(notification: NotificationLike): 'payment' | 'booking' | 'other' {
  const classification = NotificationClassifier.classifyNotification(notification);
  return classification.type;
} 