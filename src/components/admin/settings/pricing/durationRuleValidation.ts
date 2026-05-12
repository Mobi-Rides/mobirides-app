import { PricingConditions, PricingRule, PricingRuleType } from '@/types/pricing';

type DurationRange = {
  min: number;
  max: number;
};

const getDurationRange = (rule: Pick<PricingRule, 'type' | 'conditions'>): DurationRange | null => {
  if (rule.type !== PricingRuleType.DURATION) return null;

  const min = rule.conditions.min_duration_days;
  const max = rule.conditions.max_duration_days;

  if (min === undefined) return null;
  return {
    min,
    max: max ?? Number.POSITIVE_INFINITY,
  };
};

const durationRangesOverlap = (left: DurationRange, right: DurationRange) =>
  left.min <= right.max && right.min <= left.max;

export const validateDurationRuleCandidate = (
  rules: Pick<PricingRule, 'id' | 'type' | 'conditions'>[],
  candidate: Pick<PricingRule, 'id' | 'type' | 'conditions'>,
): string | null => {
  const candidateRange = getDurationRange(candidate);
  if (!candidateRange) return null;

  if (candidateRange.min < 1) {
    return 'Duration rules must start at 1 day or more.';
  }

  if (candidateRange.max < candidateRange.min) {
    return 'Maximum days must be greater than or equal to minimum days.';
  }

  const overlappingRule = rules.find((rule) => {
    if (rule.id === candidate.id) return false;
    const existingRange = getDurationRange(rule);
    return existingRange ? durationRangesOverlap(candidateRange, existingRange) : false;
  });

  if (overlappingRule) {
    return 'Duration range overlaps an existing duration rule.';
  }

  return null;
};

export const getNextDurationRuleConditions = (
  rules: Pick<PricingRule, 'type' | 'conditions'>[],
): PricingConditions | null => {
  const ranges = rules
    .map(getDurationRange)
    .filter((range): range is DurationRange => range !== null)
    .sort((left, right) => left.min - right.min);

  if (ranges.length === 0) {
    return {
      min_duration_days: 7,
      max_duration_days: 27,
    };
  }

  let nextMin = 1;
  for (const range of ranges) {
    if (nextMin < range.min) {
      return {
        min_duration_days: nextMin,
        max_duration_days: range.min - 1,
      };
    }

    if (range.max === Number.POSITIVE_INFINITY) {
      return null;
    }

    nextMin = Math.max(nextMin, range.max + 1);
  }

  return {
    min_duration_days: nextMin,
  };
};
