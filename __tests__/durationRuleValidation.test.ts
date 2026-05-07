import {
  getNextDurationRuleConditions,
  validateDurationRuleCandidate,
} from '@/components/admin/settings/pricing/durationRuleValidation';
import { PricingRuleType } from '@/types/pricing';

const durationRule = (
  id: string,
  min: number | undefined,
  max?: number,
) => ({
  id,
  type: PricingRuleType.DURATION,
  conditions: {
    min_duration_days: min,
    max_duration_days: max,
  },
});

describe('duration pricing rule validation', () => {
  it('allows adjacent non-overlapping duration ranges', () => {
    const rules = [
      durationRule('weekly', 7, 27),
      durationRule('monthly', 28),
    ];

    expect(validateDurationRuleCandidate(rules, durationRule('short', 1, 6))).toBeNull();
    expect(validateDurationRuleCandidate(rules, durationRule('weekly', 7, 27))).toBeNull();
  });

  it('rejects overlapping duration ranges', () => {
    const rules = [
      durationRule('weekly', 7, 27),
      durationRule('monthly', 28),
    ];

    expect(validateDurationRuleCandidate(rules, durationRule('overlap-weekly', 14, 21))).toContain('overlaps');
    expect(validateDurationRuleCandidate(rules, durationRule('open-ended-overlap', 21))).toContain('overlaps');
  });

  it('rejects invalid duration boundaries', () => {
    expect(validateDurationRuleCandidate([], durationRule('zero', 0, 6))).toContain('1 day');
    expect(validateDurationRuleCandidate([], durationRule('backwards', 14, 7))).toContain('Maximum days');
  });

  it('does not validate incomplete or non-duration rules as overlapping', () => {
    expect(validateDurationRuleCandidate([], durationRule('draft', undefined))).toBeNull();
    expect(validateDurationRuleCandidate([
      {
        id: 'destination',
        type: PricingRuleType.DESTINATION,
        conditions: { destination_type: 'local' },
      },
    ], durationRule('weekly', 7, 27))).toBeNull();
  });

  it('suggests a non-overlapping default for new duration rules', () => {
    expect(getNextDurationRuleConditions([])).toEqual({
      min_duration_days: 7,
      max_duration_days: 27,
    });

    expect(getNextDurationRuleConditions([
      durationRule('weekly', 7, 27),
    ])).toEqual({
      min_duration_days: 1,
      max_duration_days: 6,
    });

    expect(getNextDurationRuleConditions([
      durationRule('short', 1, 6),
      durationRule('weekly', 7, 27),
    ])).toEqual({
      min_duration_days: 28,
    });
  });

  it('does not suggest a new duration range when an open-ended range leaves no gap', () => {
    expect(getNextDurationRuleConditions([
      durationRule('weekly', 7, 27),
      durationRule('monthly', 28),
    ])).toEqual({
      min_duration_days: 1,
      max_duration_days: 6,
    });

    expect(getNextDurationRuleConditions([
      durationRule('all', 1),
    ])).toBeNull();
  });
});
