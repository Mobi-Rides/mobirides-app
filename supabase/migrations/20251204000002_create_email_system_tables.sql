-- Migration to create email system tables
-- Extracted from production schema backup

CREATE TABLE IF NOT EXISTS "public"."email_analytics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "provider" "text" NOT NULL,
    "template_id" "text",
    "total_sent" integer DEFAULT 0,
    "total_delivered" integer DEFAULT 0,
    "total_bounced" integer DEFAULT 0,
    "total_complained" integer DEFAULT 0,
    "total_opened" integer DEFAULT 0,
    "total_clicked" integer DEFAULT 0,
    "total_failed" integer DEFAULT 0,
    "delivery_rate" numeric(5,2) DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "complaint_rate" numeric(5,2) DEFAULT 0,
    "open_rate" numeric(5,2) DEFAULT 0,
    "click_rate" numeric(5,2) DEFAULT 0,
    "average_latency_ms" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."email_analytics_daily" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."email_analytics_summary" AS
 SELECT "email_analytics_daily"."provider",
    "date_trunc"('month'::"text", ("email_analytics_daily"."date")::timestamp with time zone) AS "month",
    "sum"("email_analytics_daily"."total_sent") AS "total_sent",
    "sum"("email_analytics_daily"."total_delivered") AS "total_delivered",
    "sum"("email_analytics_daily"."total_bounced") AS "total_bounced",
    "sum"("email_analytics_daily"."total_complained") AS "total_complained",
    "sum"("email_analytics_daily"."total_opened") AS "total_opened",
    "sum"("email_analytics_daily"."total_clicked") AS "total_clicked",
    "sum"("email_analytics_daily"."total_failed") AS "total_failed",
    "round"("avg"("email_analytics_daily"."delivery_rate"), 2) AS "avg_delivery_rate",
    "round"("avg"("email_analytics_daily"."bounce_rate"), 2) AS "avg_bounce_rate",
    "round"("avg"("email_analytics_daily"."complaint_rate"), 2) AS "avg_complaint_rate",
    "round"("avg"("email_analytics_daily"."open_rate"), 2) AS "avg_open_rate",
    "round"("avg"("email_analytics_daily"."click_rate"), 2) AS "avg_click_rate",
    "round"("avg"("email_analytics_daily"."average_latency_ms")) AS "avg_latency_ms"
   FROM "public"."email_analytics_daily"
  GROUP BY "email_analytics_daily"."provider", ("date_trunc"('month'::"text", ("email_analytics_daily"."date")::timestamp with time zone))
  ORDER BY ("date_trunc"('month'::"text", ("email_analytics_daily"."date")::timestamp with time zone)) DESC, "email_analytics_daily"."provider";

ALTER TABLE "public"."email_analytics_summary" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."email_delivery_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "text" NOT NULL,
    "correlation_id" "uuid" DEFAULT "gen_random_uuid"(),
    "recipient_email" "text" NOT NULL,
    "sender_email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "template_id" "text",
    "status" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "bounced_at" timestamp with time zone,
    "complained_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_delivery_logs_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"]))),
    CONSTRAINT "email_delivery_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'bounced'::"text", 'complained'::"text", 'opened'::"text", 'clicked'::"text"])))
);

ALTER TABLE "public"."email_delivery_logs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."email_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "operation_type" "text" NOT NULL,
    "latency_ms" integer NOT NULL,
    "success" boolean NOT NULL,
    "circuit_breaker_state" "text",
    "fallback_used" boolean DEFAULT false,
    "error_type" "text",
    "error_message" "text",
    "request_size_bytes" integer,
    "response_size_bytes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_performance_metrics_circuit_breaker_state_check" CHECK (("circuit_breaker_state" = ANY (ARRAY['CLOSED'::"text", 'OPEN'::"text", 'HALF_OPEN'::"text"]))),
    CONSTRAINT "email_performance_metrics_operation_type_check" CHECK (("operation_type" = ANY (ARRAY['send'::"text", 'batch_send'::"text", 'webhook'::"text"]))),
    CONSTRAINT "email_performance_metrics_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"])))
);

ALTER TABLE "public"."email_performance_metrics" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."email_suppressions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_address" "text" NOT NULL,
    "suppression_type" "text" NOT NULL,
    "reason" "text",
    "provider" "text" NOT NULL,
    "message_id" "text",
    "suppressed_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_suppressions_suppression_type_check" CHECK (("suppression_type" = ANY (ARRAY['bounce'::"text", 'complaint'::"text", 'unsubscribe'::"text", 'manual'::"text"])))
);

ALTER TABLE "public"."email_suppressions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."email_webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "message_id" "text" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "event_timestamp" timestamp with time zone NOT NULL,
    "webhook_received_at" timestamp with time zone DEFAULT "now"(),
    "raw_payload" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "processing_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_webhook_events_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"])))
);

ALTER TABLE "public"."email_webhook_events" OWNER TO "postgres";

-- Enable RLS
ALTER TABLE "public"."email_analytics_daily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_delivery_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_performance_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_suppressions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_webhook_events" ENABLE ROW LEVEL SECURITY;

-- TODO: Add RLS policies (placeholder - assumed admin access or similar)
