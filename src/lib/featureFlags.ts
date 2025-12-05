export const featureFlags = {
  DYNAMIC_PRICING: true,
  INSURANCE_V2: false,
  SUPERADMIN_ANALYTICS: false,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

export const isFeatureEnabled = (key: FeatureFlagKey) => featureFlags[key] === true;

