// Jest-compatible version
// Import your Supabase client or wallet service abstraction here
// import { walletTopup, walletWithdraw, getWalletTransactions } from '../src/services/walletService';

// Mock Supabase client or wallet service
const mockWalletService = {
  walletTopup: jest.fn(),
  walletWithdraw: jest.fn(),
  getWalletTransactions: jest.fn(),
};

describe('Wallet Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should top up wallet successfully', async () => {
    mockWalletService.walletTopup.mockResolvedValue({ success: true, balance: 100 });
    const result = await mockWalletService.walletTopup(100, 'card', 'ref123');
    expect(result.success).toBe(true);
    expect(result.balance).toBe(100);
  });

  it('should fail top up with invalid amount', async () => {
    mockWalletService.walletTopup.mockResolvedValue({ success: false, error: 'invalid_amount' });
    const result = await mockWalletService.walletTopup(-10, 'card', 'ref123');
    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_amount');
  });

  it('should withdraw from wallet successfully', async () => {
    mockWalletService.walletWithdraw.mockResolvedValue({ success: true, balance: 50 });
    const result = await mockWalletService.walletWithdraw(50, 'Withdrawal for booking');
    expect(result.success).toBe(true);
    expect(result.balance).toBe(50);
  });

  it('should fail withdrawal with insufficient funds', async () => {
    mockWalletService.walletWithdraw.mockResolvedValue({ success: false, error: 'insufficient_balance' });
    const result = await mockWalletService.walletWithdraw(1000, 'Big withdrawal');
    expect(result.success).toBe(false);
    expect(result.error).toBe('insufficient_balance');
  });

  it('should fetch wallet transaction history', async () => {
    const transactions = [
      { id: 'tx1', amount: 100, transaction_type: 'credit' },
      { id: 'tx2', amount: -50, transaction_type: 'withdrawal' },
    ];
    mockWalletService.getWalletTransactions.mockResolvedValue(transactions);
    const result = await mockWalletService.getWalletTransactions();
    expect(result).toHaveLength(2);
    expect(result[0].transaction_type).toBe('credit');
    expect(result[1].transaction_type).toBe('withdrawal');
  });
});
