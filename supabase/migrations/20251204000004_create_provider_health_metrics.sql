-- Migration to create provider health metrics table
-- Extracted from production schema backup

CREATE TABLE IF NOT EXISTS "public"."provider_health_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "total_requests" integer DEFAULT 0,
    "successful_requests" integer DEFAULT 0,
    "failed_requests" integer DEFAULT 0,
    "average_latency_ms" integer DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 0,
    "circuit_breaker_state" "text",
    "consecutive_failures" integer DEFAULT 0,
    "last_failure_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "health_check_status" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "provider_health_metrics_circuit_breaker_state_check" CHECK (("circuit_breaker_state" = ANY (ARRAY['CLOSED'::"text", 'OPEN'::"text", 'HALF_OPEN'::"text"]))),
    CONSTRAINT "provider_health_metrics_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"])))
);

ALTER TABLE "public"."provider_health_metrics" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."provider_performance_summary" AS
 SELECT "p"."provider",
    "p"."success_rate",
    "p"."average_latency_ms",
    "p"."circuit_breaker_state",
    "p"."consecutive_failures",
    "p"."last_failure_at",
    "p"."last_success_at",
    "p"."health_check_status",
    "count"("e"."id") AS "recent_events_24h"
    FROM ("public"."provider_health_metrics" "p"
        LEFT JOIN "public"."email_webhook_events" "e" ON ((("e"."provider" = "p"."provider") AND ("e"."webhook_received_at" >= ("now"() - '24:00:00'::interval)))))
    GROUP BY "p"."provider", "p"."success_rate", "p"."average_latency_ms", "p"."circuit_breaker_state", "p"."consecutive_failures", "p"."last_failure_at", "p"."last_success_at", "p"."health_check_status";

ALTER TABLE "public"."provider_performance_summary" OWNER TO "postgres";

ALTER TABLE "public"."provider_health_metrics" ENABLE ROW LEVEL SECURITY;
