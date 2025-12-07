-- Migration to create E2E encryption tables
-- Extracted from production schema backup

-- 1. Identity Keys
CREATE TABLE IF NOT EXISTS "public"."identity_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "public_identity_key" "text" NOT NULL,
    "private_identity_key_encrypted" "text" NOT NULL,
    "registration_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."identity_keys" OWNER TO "postgres";

-- 2. Pre Keys
CREATE TABLE IF NOT EXISTS "public"."pre_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "key_id" integer NOT NULL,
    "public_key" "text" NOT NULL,
    "private_key_encrypted" "text" NOT NULL,
    "is_signed" boolean DEFAULT false,
    "signature" "text",
    "is_used" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."pre_keys" OWNER TO "postgres";

-- 3. Signal Sessions
CREATE TABLE IF NOT EXISTS "public"."signal_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_user_id" "uuid" NOT NULL,
    "session_data" "jsonb" NOT NULL,
    "identity_key" "text" NOT NULL,
    "signed_pre_key" "text" NOT NULL,
    "one_time_pre_keys" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."signal_sessions" OWNER TO "postgres";

-- 4. User Public Keys
CREATE TABLE IF NOT EXISTS "public"."user_public_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "public_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."user_public_keys" OWNER TO "postgres";

-- 5. File Encryption
CREATE TABLE IF NOT EXISTS "public"."file_encryption" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_id" "uuid" NOT NULL,
    "message_id" "uuid",
    "encryption_key_encrypted" "text" NOT NULL,
    "file_hash" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "original_filename" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."file_encryption" OWNER TO "postgres";

-- Enable RLS
ALTER TABLE "public"."identity_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pre_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."signal_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_public_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."file_encryption" ENABLE ROW LEVEL SECURITY;

-- TODO: Add RLS policies (placeholder)
