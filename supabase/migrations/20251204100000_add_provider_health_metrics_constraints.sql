-- Add missing constraints to provider_health_metrics table
-- These are required for ON CONFLICT clauses in subsequent migrations

-- Add PRIMARY KEY constraint (required for table integrity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'provider_health_metrics_pkey' 
    AND conrelid = 'public.provider_health_metrics'::regclass
  ) THEN
    ALTER TABLE "public"."provider_health_metrics" 
      ADD CONSTRAINT "provider_health_metrics_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

-- Add UNIQUE constraint on provider (required for ON CONFLICT in later migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'provider_health_metrics_provider_key' 
    AND conrelid = 'public.provider_health_metrics'::regclass
  ) THEN
    ALTER TABLE "public"."provider_health_metrics" 
      ADD CONSTRAINT "provider_health_metrics_provider_key" UNIQUE ("provider");
  END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS "idx_provider_health_metrics_provider" 
  ON "public"."provider_health_metrics" ("provider");
CREATE INDEX IF NOT EXISTS "idx_provider_health_metrics_updated_at" 
  ON "public"."provider_health_metrics" ("updated_at");