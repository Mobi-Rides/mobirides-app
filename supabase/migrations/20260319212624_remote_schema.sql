create type "public"."old_notification_type" as enum ('booking_cancelled', 'booking_confirmed', 'booking_request', 'message_received', 'booking_reminder', 'wallet_topup', 'wallet_deduction', 'handover_ready', 'payment_received', 'payment_failed', 'booking_request_sent', 'pickup_reminder', 'return_reminder');

drop trigger if exists "set_admin_capabilities_updated_at" on "public"."admin_capabilities";

drop trigger if exists "blog_posts_updated_at" on "public"."blog_posts";

drop trigger if exists "update_host_wallets_updated_at" on "public"."host_wallets";

drop trigger if exists "set_notification_campaigns_updated_at" on "public"."notification_campaigns";

drop trigger if exists "log_notification_trigger" on "public"."notifications";

drop trigger if exists "user_roles_audit_trigger" on "public"."user_roles";

drop trigger if exists "update_wallet_transactions_updated_at" on "public"."wallet_transactions";

drop trigger if exists "update_messages_updated_at" on "archive"."messages";

drop trigger if exists "admin_changes_log" on "public"."admins";

drop trigger if exists "audit_logs_immutable" on "public"."audit_logs";

drop trigger if exists "booking_status_change_trigger" on "public"."bookings";

drop trigger if exists "trigger_handle_booking_status_change" on "public"."bookings";

drop trigger if exists "update_bookings_updated_at" on "public"."bookings";

drop trigger if exists "set_campaign_delivery_logs_updated_at" on "public"."campaign_delivery_logs";

drop trigger if exists "update_car_images_updated_at" on "public"."car_images";

drop trigger if exists "trg_validate_car_verification_status" on "public"."cars";

drop trigger if exists "update_cars_updated_at" on "public"."cars";

drop trigger if exists "update_commission_rates_updated_at" on "public"."commission_rates";

drop trigger if exists "message_notification_trigger" on "public"."conversation_messages";

drop trigger if exists "ensure_conversation_integrity_trigger" on "public"."conversation_participants";

drop trigger if exists "update_conversations_updated_at" on "public"."conversations";

drop trigger if exists "validate_conversation_creation_trigger" on "public"."conversations";

drop trigger if exists "update_device_tokens_updated_at" on "public"."device_tokens";

drop trigger if exists "update_documents_updated_at" on "public"."documents";

drop trigger if exists "trigger_handle_handover_completion" on "public"."handover_sessions";

drop trigger if exists "enforce_step_dependencies_trigger" on "public"."handover_step_completion";

drop trigger if exists "handover_step_completion_trigger" on "public"."handover_step_completion";

drop trigger if exists "update_handover_session_trigger" on "public"."handover_step_completion";

drop trigger if exists "update_insurance_claims_updated_at" on "public"."insurance_claims";

drop trigger if exists "update_insurance_packages_updated_at" on "public"."insurance_packages";

drop trigger if exists "update_insurance_policies_updated_at" on "public"."insurance_policies";

drop trigger if exists "update_license_verifications_updated_at" on "public"."license_verifications";

drop trigger if exists "notification_preferences_updated_at" on "public"."notification_preferences";

drop trigger if exists "update_notifications_updated_at" on "public"."notifications";

drop trigger if exists "cleanup_expired_confirmations_trigger" on "public"."pending_confirmations";

drop trigger if exists "update_profiles_updated_at" on "public"."profiles";

drop trigger if exists "update_push_subscriptions_updated_at" on "public"."push_subscriptions";

drop trigger if exists "trigger_clean_expired_locations" on "public"."real_time_locations";

drop trigger if exists "update_saved_cars_updated_at" on "public"."saved_cars";

drop trigger if exists "update_user_guide_progress_updated_at" on "public"."user_guide_progress";

drop trigger if exists "handle_user_restrictions_updated_at" on "public"."user_restrictions";

drop trigger if exists "audit_user_roles_changes" on "public"."user_roles";

drop trigger if exists "update_user_roles_updated_at" on "public"."user_roles";

drop trigger if exists "on_verification_status_change" on "public"."user_verifications";

drop trigger if exists "update_user_verifications_updated_at" on "public"."user_verifications";

drop trigger if exists "verification_completion_trigger" on "public"."user_verifications";

drop trigger if exists "verification_insert_trigger" on "public"."user_verifications";

drop trigger if exists "update_verification_address_updated_at" on "public"."verification_address";

drop policy "messages_delete_policy" on "archive"."messages";

drop policy "messages_insert_policy" on "archive"."messages";

drop policy "messages_select_policy" on "archive"."messages";

drop policy "messages_update_policy" on "archive"."messages";

drop policy "SuperAdmins manage all capabilities" on "public"."admin_capabilities";

drop policy "Admins can create posts" on "public"."blog_posts";

drop policy "Admins can delete posts" on "public"."blog_posts";

drop policy "Admins can update posts" on "public"."blog_posts";

drop policy "Admins can view all posts" on "public"."blog_posts";

drop policy "Anyone can view published posts" on "public"."blog_posts";

drop policy "Users can send messages to conversations they participate in" on "public"."conversation_messages";

drop policy "Users can update their own messages" on "public"."conversation_messages";

drop policy "Users can view messages in conversations they participate in" on "public"."conversation_messages";

drop policy "messages_delete_policy" on "public"."conversation_messages";

drop policy "messages_update_policy" on "public"."conversation_messages";

drop policy "temp_authenticated_insert_messages" on "public"."conversation_messages";

drop policy "temp_open_messages_select" on "public"."conversation_messages";

drop policy "users_can_delete_own_messages" on "public"."conversation_messages";

drop policy "users_can_insert_conversation_messages" on "public"."conversation_messages";

drop policy "users_can_read_conversation_messages" on "public"."conversation_messages";

drop policy "users_can_update_own_messages" on "public"."conversation_messages";

drop policy "Users can view participants of conversations they're in" on "public"."conversation_participants";

drop policy "participants_delete_policy" on "public"."conversation_participants";

drop policy "participants_insert_policy" on "public"."conversation_participants";

drop policy "participants_update_policy" on "public"."conversation_participants";

drop policy "temp_authenticated_insert_participants" on "public"."conversation_participants";

drop policy "temp_open_participants_select" on "public"."conversation_participants";

drop policy "users_can_insert_own_participation" on "public"."conversation_participants";

drop policy "users_can_read_conversation_participants" on "public"."conversation_participants";

drop policy "Users can update conversations they participate in" on "public"."conversations";

drop policy "creators_can_update_conversations" on "public"."conversations";

drop policy "temp_authenticated_insert_conversations" on "public"."conversations";

drop policy "temp_open_conversations_select" on "public"."conversations";

drop policy "users_can_create_conversations" on "public"."conversations";

drop policy "users_can_read_participated_conversations" on "public"."conversations";

drop policy "Service role can manage all wallets" on "public"."host_wallets";

drop policy "Users can update identity checks for their handovers" on "public"."identity_verification_checks";

drop policy "Users can view their own notification logs" on "public"."notification_logs";

drop policy "admin_manage_notifications" on "public"."notifications";

drop policy "system_insert_notifications" on "public"."notifications";

drop policy "users_update_own_notifications" on "public"."notifications";

drop policy "profiles_own_select" on "public"."profiles";

drop policy "Anyone can read real-time locations" on "public"."real_time_locations";

drop policy "user_roles_admin_delete" on "public"."user_roles";

drop policy "user_roles_admin_insert" on "public"."user_roles";

drop policy "user_roles_admin_select_all" on "public"."user_roles";

drop policy "user_roles_admin_update" on "public"."user_roles";

drop policy "user_roles_select_own" on "public"."user_roles";

drop policy "Service role can manage all wallet transactions" on "public"."wallet_transactions";

drop policy "Users can view their own wallet transactions" on "public"."wallet_transactions";

drop policy "Admins can view their own activity logs" on "public"."admin_activity_logs";

drop policy "Super admins can view all activity logs" on "public"."admin_activity_logs";

drop policy "Super admins can manage all capabilities" on "public"."admin_capabilities";

drop policy "Super admins manage capabilities" on "public"."admin_capabilities";

drop policy "Admins can update their own sessions" on "public"."admin_sessions";

drop policy "Admins can view their own sessions" on "public"."admin_sessions";

drop policy "Super admins can view all sessions" on "public"."admin_sessions";

drop policy "Hosts can update bookings for their cars" on "public"."bookings";

drop policy "Hosts can view bookings for their cars" on "public"."bookings";

drop policy "campaign_delivery_logs_admin_all" on "public"."campaign_delivery_logs";

drop policy "Owners can manage blocked dates" on "public"."car_blocked_dates";

drop policy "Admins can view all car images" on "public"."car_images";

drop policy "Car images are viewable by everyone" on "public"."car_images";

drop policy "Car owners or admins can delete their car images" on "public"."car_images";

drop policy "Car owners or admins can insert their car images" on "public"."car_images";

drop policy "Car owners or admins can update their car images" on "public"."car_images";

drop policy "Admins can update all cars" on "public"."cars";

drop policy "Only admins can insert commission rates" on "public"."commission_rates";

drop policy "Only admins can update commission rates" on "public"."commission_rates";

drop policy "Users can insert messages in their conversations" on "public"."conversation_messages";

drop policy "Users can view messages in their conversations" on "public"."conversation_messages";

drop policy "conversation_messages_insert_policy" on "public"."conversation_messages";

drop policy "conversation_messages_select_policy" on "public"."conversation_messages";

drop policy "conversation_participants_select_policy" on "public"."conversation_participants";

drop policy "conversation_participants_update_policy" on "public"."conversation_participants";

drop policy "view_conversation_peers" on "public"."conversation_participants";

drop policy "conversations_select_policy" on "public"."conversations";

drop policy "view_conversations_as_participant" on "public"."conversations";

drop policy "Users can create handover sessions for their bookings" on "public"."handover_sessions";

drop policy "Users can update their own handover sessions" on "public"."handover_sessions";

drop policy "Users can view their own handover sessions" on "public"."handover_sessions";

drop policy "Users can create handover steps for their sessions" on "public"."handover_step_completion";

drop policy "Users can manage handover steps for their sessions" on "public"."handover_step_completion";

drop policy "Users can update handover steps for their sessions" on "public"."handover_step_completion";

drop policy "Users can view handover steps for their sessions" on "public"."handover_step_completion";

drop policy "Users can create identity checks for their handovers" on "public"."identity_verification_checks";

drop policy "Users can create identity verification checks for their handove" on "public"."identity_verification_checks";

drop policy "Users can update identity verification checks for their handove" on "public"."identity_verification_checks";

drop policy "Users can view identity checks for their handovers" on "public"."identity_verification_checks";

drop policy "Users can view identity verification checks for their handover " on "public"."identity_verification_checks";

drop policy "Admins can view all claim activities" on "public"."insurance_claim_activities";

drop policy "Users can view activities for their claims" on "public"."insurance_claim_activities";

drop policy "Admins can manage all claims" on "public"."insurance_claims";

drop policy "Admins can view all claims" on "public"."insurance_claims";

drop policy "Car owners can view claims for their cars" on "public"."insurance_claims";

drop policy "Users can submit claims for their active policies" on "public"."insurance_claims";

drop policy "Only admins can manage insurance packages" on "public"."insurance_packages";

drop policy "Admins can view all insurance policies" on "public"."insurance_policies";

drop policy "Car owners can view policies for their cars" on "public"."insurance_policies";

drop policy "System can update policy status" on "public"."insurance_policies";

drop policy "Admins can update all license verifications" on "public"."license_verifications";

drop policy "Admins can view all license verifications" on "public"."license_verifications";

drop policy "Users can insert their own license verification" on "public"."license_verifications";

drop policy "Users can update their own license verification" on "public"."license_verifications";

drop policy "Users can view their own license verification" on "public"."license_verifications";

drop policy "Users can add reactions to messages they can see" on "public"."message_reactions";

drop policy "Users can view reactions for messages they can see" on "public"."message_reactions";

drop policy "Admins can manage campaigns" on "public"."notification_campaigns";

drop policy "admin_read_cleanup_log" on "public"."notification_cleanup_log";

drop policy "admin_manage_expiration_policies" on "public"."notification_expiration_policies";

drop policy "hosts_view_host_only_notifications" on "public"."notifications";

drop policy "renters_view_renter_only_notifications" on "public"."notifications";

drop policy "users_view_system_wide_notifications" on "public"."notifications";

drop policy "Admins can manage payment config" on "public"."payment_config";

drop policy "Admins can view all payment transactions" on "public"."payment_transactions";

drop policy "Admins can manage all phone verifications" on "public"."phone_verifications";

drop policy "Admins can view all phone verifications" on "public"."phone_verifications";

drop policy "Admins can view all profiles" on "public"."profiles";

drop policy "Users can update their own profile" on "public"."profiles";

drop policy "profiles_own_delete" on "public"."profiles";

drop policy "profiles_own_insert" on "public"."profiles";

drop policy "profiles_own_update" on "public"."profiles";

drop policy "profiles_public_car_owner_read" on "public"."profiles";

drop policy "Admins can view all promo usage" on "public"."promo_code_usage";

drop policy "Admins can manage promo codes" on "public"."promo_codes";

drop policy "Public can view published car reviews" on "public"."reviews";

drop policy "Users can insert reviews for their bookings" on "public"."reviews";

drop policy "Users can view their own reviews and booking reviews" on "public"."reviews";

drop policy "Admins and super admins can create restrictions" on "public"."user_restrictions";

drop policy "Admins and super admins can update restrictions" on "public"."user_restrictions";

drop policy "Admins and super admins can view all restrictions" on "public"."user_restrictions";

drop policy "Admins can manage all verifications" on "public"."user_verifications";

drop policy "Admins can update all verifications" on "public"."user_verifications";

drop policy "Admins can view all verifications" on "public"."user_verifications";

drop policy "Users can create condition reports for their handovers" on "public"."vehicle_condition_reports";

drop policy "Users can create vehicle condition reports for their bookings" on "public"."vehicle_condition_reports";

drop policy "Users can update their own condition reports" on "public"."vehicle_condition_reports";

drop policy "Users can view condition reports for their handovers" on "public"."vehicle_condition_reports";

drop policy "Users can view vehicle condition reports for their bookings" on "public"."vehicle_condition_reports";

drop policy "Admins can insert vehicle transfers" on "public"."vehicle_transfers";

drop policy "Admins can view vehicle transfers" on "public"."vehicle_transfers";

drop policy "Admins can manage all address verifications" on "public"."verification_address";

drop policy "Admins can view all address verifications" on "public"."verification_address";

drop policy "Users can create own address verification" on "public"."verification_address";

drop policy "Users can delete own address verification" on "public"."verification_address";

drop policy "Users can update own address verification" on "public"."verification_address";

drop policy "Users can view own address verification" on "public"."verification_address";

drop policy "Admins can manage all documents" on "public"."verification_documents";

drop policy "Admins can update all documents" on "public"."verification_documents";

drop policy "Admins can view all documents" on "public"."verification_documents";

revoke delete on table "public"."notification_logs" from "anon";

revoke insert on table "public"."notification_logs" from "anon";

revoke references on table "public"."notification_logs" from "anon";

revoke select on table "public"."notification_logs" from "anon";

revoke trigger on table "public"."notification_logs" from "anon";

revoke truncate on table "public"."notification_logs" from "anon";

revoke update on table "public"."notification_logs" from "anon";

revoke delete on table "public"."notification_logs" from "authenticated";

revoke insert on table "public"."notification_logs" from "authenticated";

revoke references on table "public"."notification_logs" from "authenticated";

revoke select on table "public"."notification_logs" from "authenticated";

revoke trigger on table "public"."notification_logs" from "authenticated";

revoke truncate on table "public"."notification_logs" from "authenticated";

revoke update on table "public"."notification_logs" from "authenticated";

revoke delete on table "public"."notification_logs" from "service_role";

revoke insert on table "public"."notification_logs" from "service_role";

revoke references on table "public"."notification_logs" from "service_role";

revoke select on table "public"."notification_logs" from "service_role";

revoke trigger on table "public"."notification_logs" from "service_role";

revoke truncate on table "public"."notification_logs" from "service_role";

revoke update on table "public"."notification_logs" from "service_role";

alter table "public"."conversation_messages" drop constraint "conversation_messages_sender_id_fkey";

alter table "public"."host_wallets" drop constraint "positive_balance";

alter table "public"."host_wallets" drop constraint "unique_host_wallet";

alter table "public"."notification_logs" drop constraint "notification_logs_booking_id_fkey";

alter table "public"."notification_logs" drop constraint "notification_logs_status_check";

alter table "public"."notification_logs" drop constraint "notification_logs_type_check";

alter table "public"."notification_logs" drop constraint "notification_logs_user_id_fkey";

alter table "public"."notifications" drop constraint "content_or_description_required";

alter table "public"."notifications" drop constraint "notifications_priority_check";

alter table "public"."notifications" drop constraint "notifications_related_booking_id_fkey1";

alter table "public"."notifications" drop constraint "notifications_related_car_id_fkey1";

alter table "public"."notifications" drop constraint "notifications_related_user_id_fkey";

alter table "public"."notifications" drop constraint "unique_notification_per_user_booking";

alter table "public"."user_roles" drop constraint "user_roles_user_id_role_unique";

alter table "archive"."messages" drop constraint "messages_migrated_to_conversation_id_fkey";

alter table "archive"."messages" drop constraint "messages_receiver_id_fkey";

alter table "archive"."messages" drop constraint "messages_related_car_id_fkey";

alter table "archive"."messages" drop constraint "messages_sender_id_fkey";

alter table "public"."admin_activity_logs" drop constraint "admin_activity_logs_admin_id_fkey";

alter table "public"."admin_capabilities" drop constraint "admin_capabilities_admin_id_fkey";

alter table "public"."admin_capabilities" drop constraint "admin_capabilities_granted_by_fkey";

alter table "public"."admin_sessions" drop constraint "admin_sessions_admin_id_fkey";

alter table "public"."admins" drop constraint "admins_id_fkey";

alter table "public"."bookings" drop constraint "bookings_car_id_fkey";

alter table "public"."bookings" drop constraint "bookings_payment_transaction_id_fkey";

alter table "public"."bookings" drop constraint "bookings_renter_id_fkey";

alter table "public"."campaign_delivery_logs" drop constraint "campaign_delivery_logs_campaign_id_fkey";

alter table "public"."campaign_delivery_logs" drop constraint "campaign_delivery_logs_notification_id_fkey";

alter table "public"."car_blocked_dates" drop constraint "car_blocked_dates_car_id_fkey";

alter table "public"."car_images" drop constraint "car_images_car_id_fkey";

alter table "public"."cars" drop constraint "cars_owner_id_fkey";

alter table "public"."conversation_messages" drop constraint "conversation_messages_conversation_id_fkey";

alter table "public"."conversation_messages" drop constraint "conversation_messages_related_car_id_fkey";

alter table "public"."conversation_messages" drop constraint "conversation_messages_reply_to_message_id_fkey";

alter table "public"."conversation_messages" drop constraint "fk_conversation_messages_sender_id";

alter table "public"."conversation_participants" drop constraint "conversation_participants_conversation_id_fkey";

alter table "public"."conversation_participants" drop constraint "conversation_participants_user_id_fkey";

alter table "public"."conversations" drop constraint "conversations_created_by_fkey";

alter table "public"."conversations" drop constraint "conversations_type_check";

alter table "public"."device_tokens" drop constraint "device_tokens_user_id_fkey";

alter table "public"."documents" drop constraint "documents_user_id_fkey";

alter table "public"."documents" drop constraint "documents_verified_by_fkey";

alter table "public"."handover_sessions" drop constraint "handover_sessions_booking_id_fkey";

alter table "public"."handover_sessions" drop constraint "handover_sessions_host_id_fkey";

alter table "public"."handover_sessions" drop constraint "handover_sessions_renter_id_fkey";

alter table "public"."handover_step_completion" drop constraint "handover_step_completion_completed_by_fkey";

alter table "public"."handover_step_completion" drop constraint "handover_step_completion_handover_session_id_fkey";

alter table "public"."host_wallets" drop constraint "host_wallets_host_id_fkey";

alter table "public"."identity_verification_checks" drop constraint "identity_verification_checks_handover_session_id_fkey";

alter table "public"."identity_verification_checks" drop constraint "identity_verification_checks_verification_status_check";

alter table "public"."identity_verification_checks" drop constraint "identity_verification_checks_verified_user_id_fkey";

alter table "public"."identity_verification_checks" drop constraint "identity_verification_checks_verifier_id_fkey";

alter table "public"."insurance_claim_activities" drop constraint "insurance_claim_activities_claim_id_fkey";

alter table "public"."insurance_claims" drop constraint "insurance_claims_booking_id_fkey";

alter table "public"."insurance_claims" drop constraint "insurance_claims_policy_id_fkey";

alter table "public"."insurance_policies" drop constraint "insurance_policies_booking_id_fkey";

alter table "public"."insurance_policies" drop constraint "insurance_policies_car_id_fkey";

alter table "public"."insurance_policies" drop constraint "insurance_policies_package_id_fkey";

alter table "public"."license_verifications" drop constraint "license_verifications_user_id_fkey";

alter table "public"."message_reactions" drop constraint "message_reactions_message_id_fkey";

alter table "public"."notifications" drop constraint "notifications_user_id_fkey1";

alter table "public"."payment_transactions" drop constraint "payment_transactions_booking_id_fkey";

alter table "public"."payments" drop constraint "payments_booking_id_fkey";

alter table "public"."payments" drop constraint "payments_payer_id_fkey";

alter table "public"."payments" drop constraint "payments_status_check";

alter table "public"."phone_verifications" drop constraint "phone_verifications_user_id_fkey";

alter table "public"."policy_selections" drop constraint "policy_selections_booking_id_fkey";

alter table "public"."policy_selections" drop constraint "policy_selections_plan_id_fkey";

alter table "public"."promo_code_usage" drop constraint "promo_code_usage_booking_id_fkey";

alter table "public"."promo_code_usage" drop constraint "promo_code_usage_promo_code_id_fkey";

alter table "public"."real_time_locations" drop constraint "real_time_locations_car_id_fkey";

alter table "public"."real_time_locations" drop constraint "real_time_locations_host_id_fkey";

alter table "public"."real_time_locations" drop constraint "real_time_locations_trip_id_fkey";

alter table "public"."reviews" drop constraint "reviews_booking_id_fkey";

alter table "public"."reviews" drop constraint "reviews_car_id_fkey";

alter table "public"."reviews" drop constraint "reviews_rating_check";

alter table "public"."reviews" drop constraint "reviews_reviewee_id_fkey";

alter table "public"."reviews" drop constraint "reviews_reviewer_id_fkey";

alter table "public"."saved_cars" drop constraint "saved_cars_car_id_fkey";

alter table "public"."saved_cars" drop constraint "saved_cars_user_id_fkey";

alter table "public"."user_guide_progress" drop constraint "user_guide_progress_guide_id_fkey";

alter table "public"."user_restrictions" drop constraint "user_restrictions_created_by_fkey";

alter table "public"."user_verifications" drop constraint "user_verifications_user_id_fkey";

alter table "public"."vehicle_condition_reports" drop constraint "vehicle_condition_reports_booking_id_fkey";

alter table "public"."vehicle_condition_reports" drop constraint "vehicle_condition_reports_car_id_fkey";

alter table "public"."vehicle_condition_reports" drop constraint "vehicle_condition_reports_handover_session_id_fkey";

alter table "public"."vehicle_condition_reports" drop constraint "vehicle_condition_reports_report_type_check";

alter table "public"."vehicle_condition_reports" drop constraint "vehicle_condition_reports_reporter_id_fkey";

alter table "public"."vehicle_transfers" drop constraint "vehicle_transfers_from_owner_id_fkey";

alter table "public"."vehicle_transfers" drop constraint "vehicle_transfers_to_owner_id_fkey";

alter table "public"."vehicle_transfers" drop constraint "vehicle_transfers_transferred_by_fkey";

alter table "public"."vehicle_transfers" drop constraint "vehicle_transfers_vehicle_id_fkey";

alter table "public"."verification_address" drop constraint "verification_address_confirmed_by_fkey";

alter table "public"."verification_address" drop constraint "verification_address_supporting_document_id_fkey";

alter table "public"."verification_address" drop constraint "verification_address_verification_id_fkey";

alter table "public"."verification_documents" drop constraint "verification_documents_user_id_fkey";

alter table "public"."wallet_transactions" drop constraint "wallet_transactions_booking_id_fkey";

alter table "public"."wallet_transactions" drop constraint "wallet_transactions_wallet_id_fkey";

alter table "public"."withdrawal_requests" drop constraint "withdrawal_requests_wallet_id_fkey";

drop function if exists "public"."assert_admin"(p_require_super_admin boolean);

drop function if exists "public"."audit_user_roles_changes"();

drop function if exists "public"."ban_user"(p_user_id uuid, p_reason text);

drop function if exists "public"."bulk_suspend_users"(p_user_ids uuid[], p_reason text, p_duration interval);

drop function if exists "public"."cleanup_expired_restrictions"();

drop function if exists "public"."create_notification"(p_user_id uuid, p_type notification_type, p_title text, p_description text, p_content text, p_role_target notification_role, p_related_booking_id uuid, p_related_car_id uuid, p_related_user_id uuid, p_priority integer, p_metadata jsonb, p_expires_at timestamp with time zone);

drop function if exists "public"."create_notification_with_expiration"(p_user_id uuid, p_type notification_type, p_title text, p_description text, p_content text, p_role_target notification_role, p_related_booking_id uuid, p_related_car_id uuid, p_related_user_id uuid, p_priority integer, p_metadata jsonb, p_custom_expiration_hours integer);

drop function if exists "public"."create_renter_arrival_notification"(p_booking_id uuid, p_renter_id uuid);

drop function if exists "public"."export_user_data"(p_user_id uuid);

drop function if exists "public"."generate_audit_hash"(event_type audit_event_type, actor_id uuid, target_id uuid, action_details jsonb, event_timestamp timestamp with time zone, previous_hash text);

drop function if exists "public"."get_admin_capabilities"(p_admin_id uuid);

drop function if exists "public"."get_notification_expiration_info"(p_notification_type notification_type);

drop function if exists "public"."get_user_conversation_ids"(user_uuid uuid);

drop function if exists "public"."grant_admin_capability"(p_admin_id uuid, p_capability_key text, p_granted_by uuid, p_metadata jsonb);

drop function if exists "public"."has_admin_capability"(p_admin_id uuid, p_capability_key text);

drop function if exists "public"."has_role"(_user_id uuid, _role user_role);

drop function if exists "public"."is_conversation_participant"(conversation_uuid uuid, user_uuid uuid);

drop function if exists "public"."log_audit_event"(p_event_type audit_event_type, p_severity audit_severity, p_actor_id uuid, p_target_id uuid, p_session_id text, p_ip_address inet, p_user_agent text, p_location_data jsonb, p_action_details jsonb, p_resource_type text, p_resource_id uuid, p_reason text, p_anomaly_flags jsonb, p_compliance_tags text[]);

drop function if exists "public"."mark_notification_read"(p_notification_id bigint, p_user_id uuid);

drop function if exists "public"."migrate_existing_notifications"();

drop function if exists "public"."migrate_notifications_from_backup"();

drop view if exists "public"."notification_role_analysis";

drop function if exists "public"."revoke_admin_capability"(p_admin_id uuid, p_capability_key text);

drop function if exists "public"."suspend_user"(p_user_id uuid, p_reason text, p_duration interval);

drop function if exists "public"."transfer_vehicle"(p_vehicle_id uuid, p_from_owner_id uuid, p_to_owner_id uuid, p_reason text, p_notes text);

drop function if exists "public"."update_blog_posts_updated_at"();

drop function if exists "public"."update_notification_expiration_policy"(p_notification_type notification_type, p_expiration_hours integer, p_auto_cleanup_enabled boolean);

drop function if exists "public"."update_notification_preferences"(p_whatsapp_enabled boolean, p_email_enabled boolean, p_marketing_enabled boolean);

drop function if exists "public"."update_verification_step"(user_uuid uuid, new_step verification_step);

drop function if exists "public"."validate_notification_campaign"(p_campaign_data jsonb);

drop function if exists "public"."validate_step_dependencies"(handover_session_id_param uuid, step_name_param character varying, step_order_param integer);

drop function if exists "public"."validate_vehicle_transfer"(p_vehicle_id uuid, p_from_owner_id uuid, p_to_owner_id uuid);

drop type "public"."vehicle_transfer_validation_result";

drop view if exists "public"."audit_analytics";

drop view if exists "public"."conversation_messages_with_replies";

drop function if exists "public"."get_admin_users"();

drop type "public"."http_request";

drop type "public"."http_response";

alter table "public"."notification_logs" drop constraint "notification_logs_pkey";

drop index if exists "public"."idx_documents_document_type";

drop index if exists "public"."idx_guides_is_popular";

drop index if exists "public"."idx_guides_role";

drop index if exists "public"."idx_guides_section";

drop index if exists "public"."idx_handover_sessions_booking_id";

drop index if exists "public"."idx_handover_sessions_created_at";

drop index if exists "public"."idx_handover_sessions_host_id";

drop index if exists "public"."idx_handover_sessions_renter_id";

drop index if exists "public"."idx_handover_step_completion_handover_session_id";

drop index if exists "public"."idx_handover_step_completion_is_completed";

drop index if exists "public"."idx_handover_step_completion_step_name";

drop index if exists "public"."idx_host_wallets_balance";

drop index if exists "public"."idx_host_wallets_host_id";

drop index if exists "public"."idx_identity_verification_checks_handover_session_id";

drop index if exists "public"."idx_identity_verification_checks_verified_user_id";

drop index if exists "public"."idx_notifications_active";

drop index if exists "public"."idx_notifications_booking_related";

drop index if exists "public"."idx_notifications_car_related";

drop index if exists "public"."idx_notifications_priority_created";

drop index if exists "public"."idx_notifications_role_based_types";

drop index if exists "public"."idx_notifications_user_type";

drop index if exists "public"."idx_user_roles_role";

drop index if exists "public"."idx_user_roles_user_id";

drop index if exists "public"."idx_user_roles_user_role";

drop index if exists "public"."idx_vehicle_condition_reports_booking_id";

drop index if exists "public"."idx_vehicle_condition_reports_car_id";

drop index if exists "public"."idx_vehicle_condition_reports_handover_session_id";

drop index if exists "public"."idx_wallet_transactions_created_at";

drop index if exists "public"."idx_wallet_transactions_type";

drop index if exists "public"."idx_wallet_transactions_wallet_id";

drop index if exists "public"."notification_logs_booking_id_idx";

drop index if exists "public"."notification_logs_created_at_idx";

drop index if exists "public"."notification_logs_pkey";

drop index if exists "public"."notification_logs_type_status_idx";

drop index if exists "public"."notification_logs_user_id_idx";

drop index if exists "public"."unique_host_wallet";

drop index if exists "public"."unique_notification_per_user_booking";

drop index if exists "public"."user_roles_user_id_role_unique";

drop index if exists "public"."idx_admin_activity_logs_created_at";

drop index if exists "public"."idx_admin_activity_logs_resource";

drop index if exists "public"."idx_blog_posts_published_at";

drop index if exists "public"."idx_cars_location";

drop index if exists "public"."idx_conversation_messages_created_at";

drop index if exists "public"."idx_conversations_updated_at";

drop index if exists "public"."idx_notifications_created_at";

drop index if exists "public"."idx_notifications_expires_at";

drop index if exists "public"."idx_notifications_user_type_booking";

drop index if exists "public"."idx_unique_active_handover_session";

drop table "public"."notification_logs";

alter type "public"."booking_status" rename to "booking_status__old_version_to_be_dropped";

create type "public"."booking_status" as enum ('pending', 'confirmed', 'cancelled', 'completed', 'expired', 'in_progress', 'awaiting_payment');

alter type "public"."notification_role" rename to "notification_role__old_version_to_be_dropped";

create type "public"."notification_role" as enum ('host_only', 'renter_only', 'system_wide');

alter type "public"."notification_type" rename to "notification_type__old_version_to_be_dropped";

create type "public"."notification_type" as enum ('booking_request_received', 'booking_request_sent', 'booking_confirmed_host', 'booking_confirmed_renter', 'booking_cancelled_host', 'booking_cancelled_renter', 'pickup_reminder_host', 'pickup_reminder_renter', 'return_reminder_host', 'return_reminder_renter', 'wallet_topup', 'wallet_deduction', 'message_received', 'handover_ready', 'payment_received', 'payment_failed', 'system_notification', 'navigation_started', 'pickup_location_shared', 'return_location_shared', 'arrival_notification', 'early_return_notification', 'pickup_reminder', 'return_reminder', 'claim_submitted', 'claim_status_updated');

alter type "public"."review_type" rename to "review_type__old_version_to_be_dropped";

create type "public"."review_type" as enum ('car', 'renter', 'host_to_renter', 'renter_to_host');

alter type "public"."user_role" rename to "user_role__old_version_to_be_dropped";

create type "public"."user_role" as enum ('host', 'renter', 'admin', 'super_admin');

alter type "public"."vehicle_type" rename to "vehicle_type__old_version_to_be_dropped";

create type "public"."vehicle_type" as enum ('Basic', 'Standard', 'Executive', '4x4', 'SUV', 'Electric', 'Exotic');


  create table "archive"."messages_backup_20250930_093926" (
    "id" uuid,
    "sender_id" uuid,
    "receiver_id" uuid,
    "content" text,
    "status" public.message_status,
    "related_car_id" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "migrated_to_conversation_id" uuid
      );



  create table "archive"."notifications_backup" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" public.old_notification_type not null,
    "content" text not null,
    "is_read" boolean default false,
    "related_car_id" uuid,
    "related_booking_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "archive"."notifications_backup" enable row level security;


  create table "public"."auth_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "token_hash" text not null,
    "token_type" text not null,
    "expires_at" timestamp with time zone not null,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."auth_tokens" enable row level security;


  create table "public"."locations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid default auth.uid(),
    "latitude" character varying,
    "longitude" character varying
      );


alter table "public"."locations" enable row level security;


  create table "public"."rate_limits" (
    "id" uuid not null default gen_random_uuid(),
    "identifier" text not null,
    "endpoint" text not null,
    "attempts" integer default 1,
    "window_start" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "action" character varying(50),
    "expires_at" timestamp with time zone
      );


alter table "public"."rate_limits" enable row level security;


  create table "public"."verification_bypass_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "session_id" uuid,
    "action" text not null,
    "bypass_reason" text,
    "client_ip" text,
    "user_agent" text,
    "additional_data" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."verification_bypass_logs" enable row level security;


  create table "public"."verification_bypass_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "session_token" text not null,
    "bypass_reason" text not null,
    "client_ip" text,
    "user_agent" text,
    "is_active" boolean default true,
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."verification_bypass_sessions" enable row level security;

drop type "public"."booking_status__old_version_to_be_dropped";

drop type "public"."notification_role__old_version_to_be_dropped";

drop type "public"."notification_type__old_version_to_be_dropped";

drop type "public"."review_type__old_version_to_be_dropped";

drop type "public"."user_role__old_version_to_be_dropped";

drop type "public"."vehicle_type__old_version_to_be_dropped";

alter table "archive"."messages" add column "forwarded" boolean default false;

alter table "archive"."messages" add column "forwarded_at" timestamp with time zone;

alter table "archive"."messages" add column "forwarded_from" jsonb;

alter table "archive"."messages" add column "pinned" boolean default false;

alter table "archive"."messages" add column "replying_to_message_id" uuid;

alter table "archive"."messages" add column "selected" boolean default false;

alter table "archive"."messages" add column "starred" boolean default false;

alter table "archive"."messages" alter column "created_at" set default timezone('utc'::text, now());

alter table "archive"."messages" alter column "created_at" set not null;

alter table "archive"."messages" alter column "status" set default 'sent'::public.message_status;

alter table "archive"."messages" alter column "status" set data type public.message_status using "status"::text::public.message_status;

alter table "archive"."messages" alter column "updated_at" set default timezone('utc'::text, now());

alter table "archive"."messages" alter column "updated_at" set not null;

alter table "public"."admin_activity_logs" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."admin_activity_logs" alter column "details" set default '{}'::jsonb;

alter table "public"."admin_activity_logs" alter column "resource_id" set data type uuid using "resource_id"::uuid;

alter table "public"."admin_sessions" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."admin_sessions" alter column "expires_at" set default timezone('utc'::text, (now() + '08:00:00'::interval));

alter table "public"."admin_sessions" alter column "last_activity" set default timezone('utc'::text, now());

alter table "public"."admins" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."admins" alter column "password_changed_at" set default timezone('utc'::text, now());

alter table "public"."admins" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."audit_logs" alter column "event_type" set data type public.audit_event_type using "event_type"::text::public.audit_event_type;

alter table "public"."audit_logs" alter column "severity" set default 'medium'::public.audit_severity;

alter table "public"."audit_logs" alter column "severity" set data type public.audit_severity using "severity"::text::public.audit_severity;

alter table "public"."blog_posts" alter column "author_email" set data type character varying(255) using "author_email"::character varying(255);

alter table "public"."blog_posts" alter column "author_name" set data type character varying(100) using "author_name"::character varying(100);

alter table "public"."blog_posts" alter column "category" set data type character varying(100) using "category"::character varying(100);

alter table "public"."blog_posts" alter column "meta_description" set data type character varying(160) using "meta_description"::character varying(160);

alter table "public"."blog_posts" alter column "read_time" set default 5;

alter table "public"."blog_posts" alter column "slug" set data type character varying(255) using "slug"::character varying(255);

alter table "public"."blog_posts" alter column "status" set default 'draft'::character varying;

alter table "public"."blog_posts" alter column "status" set data type character varying(20) using "status"::character varying(20);

alter table "public"."blog_posts" alter column "tags" set default '{}'::text[];

alter table "public"."blog_posts" alter column "title" set data type character varying(255) using "title"::character varying(255);

alter table "public"."bookings" add column "is_test_booking" boolean default false;

alter table "public"."bookings" alter column "commission_status" set data type character varying(20) using "commission_status"::character varying(20);

alter table "public"."bookings" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."bookings" alter column "created_at" set not null;

alter table "public"."bookings" alter column "status" set default 'pending'::public.booking_status;

alter table "public"."bookings" alter column "status" set not null;

alter table "public"."bookings" alter column "status" set data type public.booking_status using "status"::text::public.booking_status;

alter table "public"."bookings" alter column "total_price" set data type numeric using "total_price"::numeric;

alter table "public"."bookings" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."bookings" alter column "updated_at" set not null;

alter table "public"."car_images" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."car_images" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."cars" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."cars" alter column "created_at" set not null;

alter table "public"."cars" alter column "latitude" set data type numeric(10,8) using "latitude"::numeric(10,8);

alter table "public"."cars" alter column "longitude" set data type numeric(10,8) using "longitude"::numeric(10,8);

alter table "public"."cars" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."cars" alter column "updated_at" set not null;

alter table "public"."cars" alter column "vehicle_type" set data type public.vehicle_type using "vehicle_type"::text::public.vehicle_type;

alter table "public"."commission_rates" alter column "rate" set default 0.1500;

alter table "public"."conversation_messages" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."conversation_messages" alter column "created_at" set not null;

alter table "public"."conversation_messages" alter column "delivery_status" set default 'sent'::public.message_delivery_status;

alter table "public"."conversation_messages" alter column "delivery_status" set not null;

alter table "public"."conversation_messages" alter column "delivery_status" set data type public.message_delivery_status using "delivery_status"::text::public.message_delivery_status;

alter table "public"."conversation_messages" alter column "message_type" set data type character varying(20) using "message_type"::character varying(20);

alter table "public"."conversation_messages" alter column "sent_at" set default timezone('utc'::text, now());

alter table "public"."conversation_messages" alter column "sent_at" set not null;

alter table "public"."conversation_messages" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."conversation_messages" alter column "updated_at" set not null;

alter table "public"."conversation_participants" alter column "joined_at" set default timezone('utc'::text, now());

alter table "public"."conversation_participants" alter column "joined_at" set not null;

alter table "public"."conversations" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."conversations" alter column "created_at" set not null;

alter table "public"."conversations" alter column "type" set data type character varying(20) using "type"::character varying(20);

alter table "public"."conversations" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."conversations" alter column "updated_at" set not null;

alter table "public"."device_tokens" alter column "last_used_at" set default now();

alter table "public"."documents" alter column "status" set default 'pending'::public.document_status;

alter table "public"."documents" alter column "status" set data type public.document_status using "status"::text::public.document_status;

alter table "public"."handover_sessions" alter column "handover_type" set default 'pickup'::public.handover_type;

alter table "public"."handover_sessions" alter column "handover_type" set data type public.handover_type using "handover_type"::text::public.handover_type;

alter table "public"."handover_sessions" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."host_wallets" alter column "created_at" set not null;

alter table "public"."host_wallets" alter column "currency" set default 'USD'::character varying;

alter table "public"."host_wallets" alter column "updated_at" set not null;

alter table "public"."license_verifications" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."license_verifications" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."notification_campaigns" alter column "status" set default 'draft'::public.notification_campaign_status;

alter table "public"."notification_campaigns" alter column "status" set data type public.notification_campaign_status using "status"::text::public.notification_campaign_status;

alter table "public"."notification_cleanup_log" alter column "id" set default nextval('public.notification_cleanup_log_id_seq'::regclass);

alter table "public"."notification_expiration_policies" alter column "id" set default nextval('public.notification_expiration_policies_id_seq'::regclass);

alter table "public"."notification_expiration_policies" alter column "notification_type" set data type public.notification_type using "notification_type"::text::public.notification_type;

alter table "public"."notifications" drop column "priority";

alter table "public"."notifications" drop column "related_user_id";

alter table "public"."notifications" drop column "content";

alter table "public"."notifications" add column "content" text generated always as (COALESCE(((title || ': '::text) || description), title, description, 'Notification'::text)) stored;

alter table "public"."notifications" alter column "id" drop default;

alter table "public"."notifications" alter column "id" add generated always as identity;

alter table "public"."notifications" alter column "metadata" drop default;

alter table "public"."notifications" alter column "role_target" set default 'system_wide'::public.notification_role;

alter table "public"."notifications" alter column "role_target" set data type public.notification_role using "role_target"::text::public.notification_role;

alter table "public"."notifications" alter column "title" set not null;

alter table "public"."notifications" alter column "type" set data type public.notification_type using "type"::text::public.notification_type;

alter table "public"."notifications" alter column "user_id" drop not null;

alter table "public"."pending_confirmations" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."profiles" drop column "email_notifications";

alter table "public"."profiles" drop column "is_verified";

alter table "public"."profiles" drop column "marketing_emails";

alter table "public"."profiles" drop column "whatsapp_notifications";

alter table "public"."profiles" add column "account_locked_until" timestamp with time zone;

alter table "public"."profiles" add column "email_confirmed" boolean default false;

alter table "public"."profiles" add column "email_confirmed_at" timestamp with time zone;

alter table "public"."profiles" add column "failed_login_attempts" integer default 0;

alter table "public"."profiles" add column "last_login_attempt" timestamp with time zone;

alter table "public"."profiles" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."profiles" alter column "created_at" set not null;

alter table "public"."profiles" alter column "role" set default 'renter'::public.user_role;

alter table "public"."profiles" alter column "role" set data type public.user_role using "role"::text::public.user_role;

alter table "public"."profiles" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."profiles" alter column "updated_at" set not null;

alter table "public"."profiles" alter column "verification_status" set default 'not_started'::public.verification_status;

alter table "public"."profiles" alter column "verification_status" set data type public.verification_status using "verification_status"::text::public.verification_status;

alter table "public"."reviews" alter column "rating" set data type integer using "rating"::integer;

alter table "public"."reviews" alter column "review_type" set data type public.review_type using "review_type"::text::public.review_type;

alter table "public"."reviews" alter column "reviewee_id" set not null;

alter table "public"."reviews" alter column "reviewer_id" set not null;

alter table "public"."saved_cars" drop column "updated_at";

alter table "public"."saved_cars" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."user_restrictions" alter column "restriction_type" set data type public.restriction_type_enum using "restriction_type"::text::public.restriction_type_enum;

alter table "public"."user_restrictions" enable row level security;

alter table "public"."user_roles" alter column "role" set data type public.user_role using "role"::text::public.user_role;

alter table "public"."user_verifications" alter column "current_step" set default 'personal_info'::public.verification_step;

alter table "public"."user_verifications" alter column "current_step" set data type public.verification_step using "current_step"::text::public.verification_step;

alter table "public"."user_verifications" alter column "overall_status" set default 'not_started'::public.verification_status;

alter table "public"."user_verifications" alter column "overall_status" set data type public.verification_status using "overall_status"::text::public.verification_status;

alter table "public"."verification_address" alter column "confirmation_method" set data type public.verification_method using "confirmation_method"::text::public.verification_method;

alter table "public"."verification_documents" alter column "document_type" set data type public.document_type using "document_type"::text::public.document_type;

alter table "public"."verification_documents" alter column "status" set default 'pending_review'::public.verification_status;

alter table "public"."verification_documents" alter column "status" set data type public.verification_status using "status"::text::public.verification_status;

alter table "public"."wallet_transactions" add column "booking_reference" character varying(50);

alter table "public"."wallet_transactions" add column "commission_rate" numeric(5,4);

alter table "public"."wallet_transactions" add column "payment_method" character varying(50);

alter table "public"."wallet_transactions" add column "payment_reference" character varying(100);

alter table "public"."wallet_transactions" add column "status" character varying(20) not null default 'completed'::character varying;

alter table "public"."wallet_transactions" alter column "created_at" set not null;

alter table "public"."wallet_transactions" alter column "updated_at" set not null;

drop sequence if exists "public"."notifications_id_seq";

CREATE INDEX idx_messages_forwarded ON archive.messages USING btree (forwarded) WHERE (forwarded = true);

CREATE INDEX idx_messages_pinned ON archive.messages USING btree (pinned) WHERE (pinned = true);

CREATE INDEX idx_messages_receiver_status ON archive.messages USING btree (receiver_id, status);

CREATE INDEX idx_messages_replies_by_original ON archive.messages USING btree (replying_to_message_id) WHERE (replying_to_message_id IS NOT NULL);

CREATE INDEX idx_messages_replying_to ON archive.messages USING btree (replying_to_message_id);

CREATE INDEX idx_messages_starred ON archive.messages USING btree (starred) WHERE (starred = true);

CREATE INDEX idx_notifications_user_read_date ON archive.notifications_backup USING btree (user_id, is_read, created_at DESC);

CREATE UNIQUE INDEX notifications_pkey ON archive.notifications_backup USING btree (id);

CREATE UNIQUE INDEX auth_tokens_pkey ON public.auth_tokens USING btree (id);

CREATE UNIQUE INDEX conversation_participants_conversation_id_user_id_key ON public.conversation_participants USING btree (conversation_id, user_id);

CREATE UNIQUE INDEX device_tokens_user_id_device_token_key ON public.device_tokens USING btree (user_id, device_token);

CREATE UNIQUE INDEX email_analytics_daily_date_provider_template_id_key ON public.email_analytics_daily USING btree (date, provider, template_id);

CREATE UNIQUE INDEX email_analytics_daily_pkey ON public.email_analytics_daily USING btree (id);

CREATE UNIQUE INDEX email_delivery_logs_pkey ON public.email_delivery_logs USING btree (id);

CREATE UNIQUE INDEX email_performance_metrics_pkey ON public.email_performance_metrics USING btree (id);

CREATE UNIQUE INDEX email_suppressions_email_address_key ON public.email_suppressions USING btree (email_address);

CREATE UNIQUE INDEX email_suppressions_pkey ON public.email_suppressions USING btree (id);

CREATE UNIQUE INDEX email_webhook_events_pkey ON public.email_webhook_events USING btree (id);

CREATE UNIQUE INDEX file_encryption_pkey ON public.file_encryption USING btree (id);

CREATE UNIQUE INDEX host_wallets_host_id_key ON public.host_wallets USING btree (host_id);

CREATE UNIQUE INDEX identity_keys_pkey ON public.identity_keys USING btree (id);

CREATE UNIQUE INDEX identity_keys_user_id_key ON public.identity_keys USING btree (user_id);

CREATE INDEX idx_admin_sessions_token ON public.admin_sessions USING btree (session_token);

CREATE INDEX idx_auth_tokens_expires_at ON public.auth_tokens USING btree (expires_at);

CREATE INDEX idx_auth_tokens_token_hash ON public.auth_tokens USING btree (token_hash);

CREATE INDEX idx_auth_tokens_type ON public.auth_tokens USING btree (token_type);

CREATE INDEX idx_auth_tokens_user_id ON public.auth_tokens USING btree (user_id);

CREATE INDEX idx_blog_posts_author_email ON public.blog_posts USING btree (author_email);

CREATE INDEX idx_bookings_car_status ON public.bookings USING btree (car_id, status);

CREATE INDEX idx_bookings_created_at_desc ON public.bookings USING btree (created_at DESC);

CREATE INDEX idx_bookings_date_range ON public.bookings USING btree (start_date, end_date);

CREATE INDEX idx_bookings_renter_status ON public.bookings USING btree (renter_id, status);

CREATE INDEX idx_bookings_test_booking ON public.bookings USING btree (is_test_booking);

CREATE INDEX idx_car_images_primary ON public.car_images USING btree (car_id, is_primary);

CREATE INDEX idx_cars_features ON public.cars USING gin (features);

CREATE INDEX idx_cars_owner_available ON public.cars USING btree (owner_id, is_available);

CREATE INDEX idx_conversation_messages_car_related ON public.conversation_messages USING btree (related_car_id, conversation_id) WHERE (related_car_id IS NOT NULL);

CREATE INDEX idx_conversation_messages_composite ON public.conversation_messages USING btree (conversation_id, created_at DESC);

CREATE INDEX idx_conversation_messages_conv_recent ON public.conversation_messages USING btree (conversation_id, created_at DESC);

CREATE INDEX idx_conversation_messages_conv_sender ON public.conversation_messages USING btree (conversation_id, sender_id, created_at DESC);

CREATE INDEX idx_conversation_messages_conversation_created ON public.conversation_messages USING btree (conversation_id, created_at DESC);

CREATE INDEX idx_conversation_messages_conversation_reply ON public.conversation_messages USING btree (conversation_id, reply_to_message_id);

CREATE INDEX idx_conversation_messages_conversation_status ON public.conversation_messages USING btree (conversation_id, delivery_status);

CREATE INDEX idx_conversation_messages_count ON public.conversation_messages USING btree (conversation_id);

CREATE INDEX idx_conversation_messages_delivered_at ON public.conversation_messages USING btree (delivered_at) WHERE (delivered_at IS NOT NULL);

CREATE INDEX idx_conversation_messages_delivery_pagination ON public.conversation_messages USING btree (conversation_id, delivery_status, created_at DESC);

CREATE INDEX idx_conversation_messages_delivery_status ON public.conversation_messages USING btree (delivery_status);

CREATE INDEX idx_conversation_messages_encrypted ON public.conversation_messages USING btree (is_encrypted);

CREATE INDEX idx_conversation_messages_metadata ON public.conversation_messages USING gin (metadata) WHERE (metadata IS NOT NULL);

CREATE INDEX idx_conversation_messages_pagination ON public.conversation_messages USING btree (conversation_id, created_at DESC);

CREATE INDEX idx_conversation_messages_read_at ON public.conversation_messages USING btree (read_at) WHERE (read_at IS NOT NULL);

CREATE INDEX idx_conversation_messages_reply_to ON public.conversation_messages USING btree (reply_to_message_id);

CREATE INDEX idx_conversation_messages_sender_id ON public.conversation_messages USING btree (sender_id);

CREATE INDEX idx_conversation_messages_sender_pagination ON public.conversation_messages USING btree (conversation_id, sender_id, created_at DESC);

CREATE INDEX idx_conversation_messages_sent_at ON public.conversation_messages USING btree (sent_at);

CREATE INDEX idx_conversation_messages_type_conv ON public.conversation_messages USING btree (message_type, conversation_id, created_at DESC);

CREATE INDEX idx_conversation_messages_type_pagination ON public.conversation_messages USING btree (conversation_id, message_type, created_at DESC);

CREATE INDEX idx_conversation_participants_composite ON public.conversation_participants USING btree (conversation_id, user_id);

CREATE INDEX idx_conversation_participants_conversation ON public.conversation_participants USING btree (conversation_id);

CREATE INDEX idx_conversation_participants_lookup ON public.conversation_participants USING btree (conversation_id, user_id);

CREATE INDEX idx_conversation_participants_user ON public.conversation_participants USING btree (user_id);

CREATE INDEX idx_conversation_participants_user_conv ON public.conversation_participants USING btree (user_id, conversation_id);

CREATE INDEX idx_conversations_active ON public.conversations USING btree (updated_at DESC, type);

CREATE INDEX idx_conversations_creator_updated ON public.conversations USING btree (created_by, updated_at DESC);

CREATE INDEX idx_conversations_type_created_by ON public.conversations USING btree (type, created_by);

CREATE INDEX idx_conversations_type_updated_at ON public.conversations USING btree (type, updated_at DESC);

CREATE INDEX idx_conversations_updated ON public.conversations USING btree (updated_at DESC);

CREATE INDEX idx_device_tokens_active ON public.device_tokens USING btree (is_active);

CREATE INDEX idx_email_analytics_daily_date ON public.email_analytics_daily USING btree (date);

CREATE INDEX idx_email_analytics_daily_provider ON public.email_analytics_daily USING btree (provider);

CREATE INDEX idx_email_analytics_daily_template ON public.email_analytics_daily USING btree (template_id);

CREATE INDEX idx_email_delivery_logs_correlation_id ON public.email_delivery_logs USING btree (correlation_id);

CREATE INDEX idx_email_delivery_logs_message_id ON public.email_delivery_logs USING btree (message_id);

CREATE INDEX idx_email_delivery_logs_provider ON public.email_delivery_logs USING btree (provider);

CREATE INDEX idx_email_delivery_logs_recipient ON public.email_delivery_logs USING btree (recipient_email);

CREATE INDEX idx_email_delivery_logs_sent_at ON public.email_delivery_logs USING btree (sent_at);

CREATE INDEX idx_email_delivery_logs_status ON public.email_delivery_logs USING btree (status);

CREATE INDEX idx_email_performance_metrics_created_at ON public.email_performance_metrics USING btree (created_at);

CREATE INDEX idx_email_performance_metrics_provider ON public.email_performance_metrics USING btree (provider);

CREATE INDEX idx_email_performance_metrics_success ON public.email_performance_metrics USING btree (success);

CREATE INDEX idx_email_suppressions_email ON public.email_suppressions USING btree (email_address);

CREATE INDEX idx_email_suppressions_provider ON public.email_suppressions USING btree (provider);

CREATE INDEX idx_email_suppressions_type ON public.email_suppressions USING btree (suppression_type);

CREATE INDEX idx_email_webhook_events_message_id ON public.email_webhook_events USING btree (message_id);

CREATE INDEX idx_email_webhook_events_processed ON public.email_webhook_events USING btree (processed);

CREATE INDEX idx_email_webhook_events_provider ON public.email_webhook_events USING btree (provider);

CREATE INDEX idx_email_webhook_events_timestamp ON public.email_webhook_events USING btree (event_timestamp);

CREATE INDEX idx_file_encryption_message_id ON public.file_encryption USING btree (message_id);

CREATE INDEX idx_identity_keys_user_id ON public.identity_keys USING btree (user_id);

CREATE INDEX idx_notifications_related_booking_id ON public.notifications USING btree (related_booking_id) WHERE (related_booking_id IS NOT NULL);

CREATE INDEX idx_notifications_related_car_id ON public.notifications USING btree (related_car_id) WHERE (related_car_id IS NOT NULL);

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_notifications_user_created_at ON public.notifications USING btree (user_id, created_at DESC);

CREATE INDEX idx_pre_keys_unused ON public.pre_keys USING btree (user_id, is_used) WHERE (is_used = false);

CREATE INDEX idx_pre_keys_user_id ON public.pre_keys USING btree (user_id);

CREATE INDEX idx_profiles_account_locked ON public.profiles USING btree (account_locked_until);

CREATE INDEX idx_profiles_email_confirmed ON public.profiles USING btree (email_confirmed);

CREATE INDEX idx_profiles_full_name_search ON public.profiles USING btree (full_name);

CREATE INDEX idx_profiles_id ON public.profiles USING btree (id);

CREATE INDEX idx_profiles_id_lookup ON public.profiles USING btree (id);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX idx_rate_limits_action ON public.rate_limits USING btree (action);

CREATE INDEX idx_rate_limits_endpoint ON public.rate_limits USING btree (endpoint);

CREATE INDEX idx_rate_limits_expires_at ON public.rate_limits USING btree (expires_at);

CREATE INDEX idx_rate_limits_identifier ON public.rate_limits USING btree (identifier);

CREATE INDEX idx_rate_limits_window_start ON public.rate_limits USING btree (window_start);

CREATE INDEX idx_signal_sessions_user_contact ON public.signal_sessions USING btree (user_id, contact_user_id);

CREATE INDEX idx_user_public_keys_created_at ON public.user_public_keys USING btree (created_at);

CREATE UNIQUE INDEX idx_user_public_keys_user_id ON public.user_public_keys USING btree (user_id);

CREATE INDEX idx_verification_bypass_logs_action ON public.verification_bypass_logs USING btree (action);

CREATE INDEX idx_verification_bypass_logs_created_at ON public.verification_bypass_logs USING btree (created_at);

CREATE INDEX idx_verification_bypass_logs_session_id ON public.verification_bypass_logs USING btree (session_id);

CREATE INDEX idx_verification_bypass_logs_user_id ON public.verification_bypass_logs USING btree (user_id);

CREATE INDEX idx_verification_bypass_sessions_active ON public.verification_bypass_sessions USING btree (is_active);

CREATE INDEX idx_verification_bypass_sessions_expires ON public.verification_bypass_sessions USING btree (expires_at);

CREATE INDEX idx_verification_bypass_sessions_session_token ON public.verification_bypass_sessions USING btree (session_token);

CREATE INDEX idx_verification_bypass_sessions_user_id ON public.verification_bypass_sessions USING btree (user_id);

CREATE INDEX idx_wallet_transactions_wallet_date ON public.wallet_transactions USING btree (wallet_id, created_at DESC);

CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id);

CREATE UNIQUE INDEX pre_keys_pkey ON public.pre_keys USING btree (id);

CREATE UNIQUE INDEX pre_keys_user_id_key_id_key ON public.pre_keys USING btree (user_id, key_id);

CREATE UNIQUE INDEX rate_limits_identifier_endpoint_key ON public.rate_limits USING btree (identifier, endpoint);

CREATE UNIQUE INDEX rate_limits_pkey ON public.rate_limits USING btree (id);

CREATE UNIQUE INDEX signal_sessions_pkey ON public.signal_sessions USING btree (id);

CREATE UNIQUE INDEX signal_sessions_user_id_contact_user_id_key ON public.signal_sessions USING btree (user_id, contact_user_id);

CREATE UNIQUE INDEX unique_conversation_participant ON public.conversation_participants USING btree (conversation_id, user_id);

CREATE UNIQUE INDEX uq_user_roles_user ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX user_public_keys_pkey ON public.user_public_keys USING btree (id);

CREATE UNIQUE INDEX verification_bypass_logs_pkey ON public.verification_bypass_logs USING btree (id);

CREATE UNIQUE INDEX verification_bypass_sessions_pkey ON public.verification_bypass_sessions USING btree (id);

CREATE UNIQUE INDEX verification_bypass_sessions_session_token_key ON public.verification_bypass_sessions USING btree (session_token);

CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs USING btree (created_at);

CREATE INDEX idx_admin_activity_logs_resource ON public.admin_activity_logs USING btree (resource_type, resource_id);

CREATE INDEX idx_blog_posts_published_at ON public.blog_posts USING btree (published_at);

CREATE INDEX idx_cars_location ON public.cars USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));

CREATE INDEX idx_conversation_messages_created_at ON public.conversation_messages USING btree (created_at DESC);

CREATE INDEX idx_conversations_updated_at ON public.conversations USING btree (updated_at DESC);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);

CREATE INDEX idx_notifications_expires_at ON public.notifications USING btree (expires_at);

CREATE INDEX idx_notifications_user_type_booking ON public.notifications USING btree (user_id, type, related_booking_id);

CREATE UNIQUE INDEX idx_unique_active_handover_session ON public.handover_sessions USING btree (booking_id, handover_type, renter_id) WHERE (handover_completed = false);

alter table "archive"."notifications_backup" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."auth_tokens" add constraint "auth_tokens_pkey" PRIMARY KEY using index "auth_tokens_pkey";

alter table "public"."email_analytics_daily" add constraint "email_analytics_daily_pkey" PRIMARY KEY using index "email_analytics_daily_pkey";

alter table "public"."email_delivery_logs" add constraint "email_delivery_logs_pkey" PRIMARY KEY using index "email_delivery_logs_pkey";

alter table "public"."email_performance_metrics" add constraint "email_performance_metrics_pkey" PRIMARY KEY using index "email_performance_metrics_pkey";

alter table "public"."email_suppressions" add constraint "email_suppressions_pkey" PRIMARY KEY using index "email_suppressions_pkey";

alter table "public"."email_webhook_events" add constraint "email_webhook_events_pkey" PRIMARY KEY using index "email_webhook_events_pkey";

alter table "public"."file_encryption" add constraint "file_encryption_pkey" PRIMARY KEY using index "file_encryption_pkey";

alter table "public"."identity_keys" add constraint "identity_keys_pkey" PRIMARY KEY using index "identity_keys_pkey";

alter table "public"."locations" add constraint "locations_pkey" PRIMARY KEY using index "locations_pkey";

alter table "public"."pre_keys" add constraint "pre_keys_pkey" PRIMARY KEY using index "pre_keys_pkey";

alter table "public"."rate_limits" add constraint "rate_limits_pkey" PRIMARY KEY using index "rate_limits_pkey";

alter table "public"."signal_sessions" add constraint "signal_sessions_pkey" PRIMARY KEY using index "signal_sessions_pkey";

alter table "public"."user_public_keys" add constraint "user_public_keys_pkey" PRIMARY KEY using index "user_public_keys_pkey";

alter table "public"."verification_bypass_logs" add constraint "verification_bypass_logs_pkey" PRIMARY KEY using index "verification_bypass_logs_pkey";

alter table "public"."verification_bypass_sessions" add constraint "verification_bypass_sessions_pkey" PRIMARY KEY using index "verification_bypass_sessions_pkey";

alter table "archive"."messages" add constraint "check_not_self_reply" CHECK ((id <> replying_to_message_id)) not valid;

alter table "archive"."messages" validate constraint "check_not_self_reply";

alter table "archive"."messages" add constraint "messages_replying_to_message_id_fkey" FOREIGN KEY (replying_to_message_id) REFERENCES archive.messages(id) ON DELETE SET NULL not valid;

alter table "archive"."messages" validate constraint "messages_replying_to_message_id_fkey";

alter table "archive"."notifications_backup" add constraint "notifications_related_booking_id_fkey" FOREIGN KEY (related_booking_id) REFERENCES public.bookings(id) not valid;

alter table "archive"."notifications_backup" validate constraint "notifications_related_booking_id_fkey";

alter table "archive"."notifications_backup" add constraint "notifications_related_car_id_fkey" FOREIGN KEY (related_car_id) REFERENCES public.cars(id) not valid;

alter table "archive"."notifications_backup" validate constraint "notifications_related_car_id_fkey";

alter table "archive"."notifications_backup" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "archive"."notifications_backup" validate constraint "notifications_user_id_fkey";

alter table "public"."auth_tokens" add constraint "auth_tokens_token_type_check" CHECK ((token_type = ANY (ARRAY['email_confirmation'::text, 'password_reset'::text]))) not valid;

alter table "public"."auth_tokens" validate constraint "auth_tokens_token_type_check";

alter table "public"."auth_tokens" add constraint "auth_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."auth_tokens" validate constraint "auth_tokens_user_id_fkey";

alter table "public"."blog_posts" add constraint "blog_posts_status_check" CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('scheduled'::character varying)::text]))) not valid;

alter table "public"."blog_posts" validate constraint "blog_posts_status_check";

alter table "public"."bookings" add constraint "valid_date_range" CHECK ((end_date >= start_date)) not valid;

alter table "public"."bookings" validate constraint "valid_date_range";

alter table "public"."conversation_messages" add constraint "check_message_timestamp_order" CHECK ((((delivered_at IS NULL) OR (delivered_at >= sent_at)) AND ((read_at IS NULL) OR (read_at >= COALESCE(delivered_at, sent_at))))) not valid;

alter table "public"."conversation_messages" validate constraint "check_message_timestamp_order";

alter table "public"."conversation_messages" add constraint "check_not_self_reply" CHECK ((id <> reply_to_message_id)) not valid;

alter table "public"."conversation_messages" validate constraint "check_not_self_reply";

alter table "public"."conversation_participants" add constraint "conversation_participants_conversation_id_user_id_key" UNIQUE using index "conversation_participants_conversation_id_user_id_key";

alter table "public"."conversation_participants" add constraint "unique_conversation_participant" UNIQUE using index "unique_conversation_participant";

alter table "public"."device_tokens" add constraint "device_tokens_user_id_device_token_key" UNIQUE using index "device_tokens_user_id_device_token_key";

alter table "public"."email_analytics_daily" add constraint "email_analytics_daily_date_provider_template_id_key" UNIQUE using index "email_analytics_daily_date_provider_template_id_key";

alter table "public"."email_suppressions" add constraint "email_suppressions_email_address_key" UNIQUE using index "email_suppressions_email_address_key";

alter table "public"."file_encryption" add constraint "file_encryption_message_id_fkey" FOREIGN KEY (message_id) REFERENCES public.conversation_messages(id) ON DELETE CASCADE not valid;

alter table "public"."file_encryption" validate constraint "file_encryption_message_id_fkey";

alter table "public"."host_wallets" add constraint "host_wallets_host_id_key" UNIQUE using index "host_wallets_host_id_key";

alter table "public"."identity_keys" add constraint "identity_keys_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."identity_keys" validate constraint "identity_keys_user_id_fkey";

alter table "public"."identity_keys" add constraint "identity_keys_user_id_key" UNIQUE using index "identity_keys_user_id_key";

alter table "public"."notifications" add constraint "notifications_related_booking_id_fkey" FOREIGN KEY (related_booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL not valid;

alter table "public"."notifications" validate constraint "notifications_related_booking_id_fkey";

alter table "public"."notifications" add constraint "notifications_related_car_id_fkey" FOREIGN KEY (related_car_id) REFERENCES public.cars(id) ON DELETE SET NULL not valid;

alter table "public"."notifications" validate constraint "notifications_related_car_id_fkey";

alter table "public"."pre_keys" add constraint "pre_keys_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pre_keys" validate constraint "pre_keys_user_id_fkey";

alter table "public"."pre_keys" add constraint "pre_keys_user_id_key_id_key" UNIQUE using index "pre_keys_user_id_key_id_key";

alter table "public"."rate_limits" add constraint "rate_limits_identifier_endpoint_key" UNIQUE using index "rate_limits_identifier_endpoint_key";

alter table "public"."signal_sessions" add constraint "signal_sessions_contact_user_id_fkey" FOREIGN KEY (contact_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."signal_sessions" validate constraint "signal_sessions_contact_user_id_fkey";

alter table "public"."signal_sessions" add constraint "signal_sessions_user_id_contact_user_id_key" UNIQUE using index "signal_sessions_user_id_contact_user_id_key";

alter table "public"."signal_sessions" add constraint "signal_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."signal_sessions" validate constraint "signal_sessions_user_id_fkey";

alter table "public"."user_public_keys" add constraint "user_public_keys_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_public_keys" validate constraint "user_public_keys_user_id_fkey";

alter table "public"."user_roles" add constraint "uq_user_roles_user" UNIQUE using index "uq_user_roles_user";

alter table "public"."verification_bypass_logs" add constraint "verification_bypass_logs_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.verification_bypass_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."verification_bypass_logs" validate constraint "verification_bypass_logs_session_id_fkey";

alter table "public"."verification_bypass_logs" add constraint "verification_bypass_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."verification_bypass_logs" validate constraint "verification_bypass_logs_user_id_fkey";

alter table "public"."verification_bypass_sessions" add constraint "verification_bypass_sessions_session_token_key" UNIQUE using index "verification_bypass_sessions_session_token_key";

alter table "public"."verification_bypass_sessions" add constraint "verification_bypass_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."verification_bypass_sessions" validate constraint "verification_bypass_sessions_user_id_fkey";

alter table "public"."wallet_transactions" add constraint "wallet_transactions_status_check" CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text]))) not valid;

alter table "public"."wallet_transactions" validate constraint "wallet_transactions_status_check";

alter table "archive"."messages" add constraint "messages_migrated_to_conversation_id_fkey" FOREIGN KEY (migrated_to_conversation_id) REFERENCES public.conversations(id) not valid;

alter table "archive"."messages" validate constraint "messages_migrated_to_conversation_id_fkey";

alter table "archive"."messages" add constraint "messages_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) not valid;

alter table "archive"."messages" validate constraint "messages_receiver_id_fkey";

alter table "archive"."messages" add constraint "messages_related_car_id_fkey" FOREIGN KEY (related_car_id) REFERENCES public.cars(id) not valid;

alter table "archive"."messages" validate constraint "messages_related_car_id_fkey";

alter table "archive"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) not valid;

alter table "archive"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."admin_activity_logs" add constraint "admin_activity_logs_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE not valid;

alter table "public"."admin_activity_logs" validate constraint "admin_activity_logs_admin_id_fkey";

alter table "public"."admin_capabilities" add constraint "admin_capabilities_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE not valid;

alter table "public"."admin_capabilities" validate constraint "admin_capabilities_admin_id_fkey";

alter table "public"."admin_capabilities" add constraint "admin_capabilities_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES public.admins(id) ON DELETE SET NULL not valid;

alter table "public"."admin_capabilities" validate constraint "admin_capabilities_granted_by_fkey";

alter table "public"."admin_sessions" add constraint "admin_sessions_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE not valid;

alter table "public"."admin_sessions" validate constraint "admin_sessions_admin_id_fkey";

alter table "public"."admins" add constraint "admins_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."admins" validate constraint "admins_id_fkey";

alter table "public"."bookings" add constraint "bookings_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_car_id_fkey";

alter table "public"."bookings" add constraint "bookings_payment_transaction_id_fkey" FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id) not valid;

alter table "public"."bookings" validate constraint "bookings_payment_transaction_id_fkey";

alter table "public"."bookings" add constraint "bookings_renter_id_fkey" FOREIGN KEY (renter_id) REFERENCES public.profiles(id) not valid;

alter table "public"."bookings" validate constraint "bookings_renter_id_fkey";

alter table "public"."campaign_delivery_logs" add constraint "campaign_delivery_logs_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.notification_campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."campaign_delivery_logs" validate constraint "campaign_delivery_logs_campaign_id_fkey";

alter table "public"."campaign_delivery_logs" add constraint "campaign_delivery_logs_notification_id_fkey" FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE SET NULL not valid;

alter table "public"."campaign_delivery_logs" validate constraint "campaign_delivery_logs_notification_id_fkey";

alter table "public"."car_blocked_dates" add constraint "car_blocked_dates_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE not valid;

alter table "public"."car_blocked_dates" validate constraint "car_blocked_dates_car_id_fkey";

alter table "public"."car_images" add constraint "car_images_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE not valid;

alter table "public"."car_images" validate constraint "car_images_car_id_fkey";

alter table "public"."cars" add constraint "cars_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) not valid;

alter table "public"."cars" validate constraint "cars_owner_id_fkey";

alter table "public"."conversation_messages" add constraint "conversation_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."conversation_messages" validate constraint "conversation_messages_conversation_id_fkey";

alter table "public"."conversation_messages" add constraint "conversation_messages_related_car_id_fkey" FOREIGN KEY (related_car_id) REFERENCES public.cars(id) not valid;

alter table "public"."conversation_messages" validate constraint "conversation_messages_related_car_id_fkey";

alter table "public"."conversation_messages" add constraint "conversation_messages_reply_to_message_id_fkey" FOREIGN KEY (reply_to_message_id) REFERENCES public.conversation_messages(id) not valid;

alter table "public"."conversation_messages" validate constraint "conversation_messages_reply_to_message_id_fkey";

alter table "public"."conversation_messages" add constraint "fk_conversation_messages_sender_id" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."conversation_messages" validate constraint "fk_conversation_messages_sender_id";

alter table "public"."conversation_participants" add constraint "conversation_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_conversation_id_fkey";

alter table "public"."conversation_participants" add constraint "conversation_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_user_id_fkey";

alter table "public"."conversations" add constraint "conversations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."conversations" validate constraint "conversations_created_by_fkey";

alter table "public"."conversations" add constraint "conversations_type_check" CHECK (((type)::text = ANY (ARRAY[('direct'::character varying)::text, ('group'::character varying)::text]))) not valid;

alter table "public"."conversations" validate constraint "conversations_type_check";

alter table "public"."device_tokens" add constraint "device_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."device_tokens" validate constraint "device_tokens_user_id_fkey";

alter table "public"."documents" add constraint "documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_user_id_fkey";

alter table "public"."documents" add constraint "documents_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES public.profiles(id) not valid;

alter table "public"."documents" validate constraint "documents_verified_by_fkey";

alter table "public"."handover_sessions" add constraint "handover_sessions_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."handover_sessions" validate constraint "handover_sessions_booking_id_fkey";

alter table "public"."handover_sessions" add constraint "handover_sessions_host_id_fkey" FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."handover_sessions" validate constraint "handover_sessions_host_id_fkey";

alter table "public"."handover_sessions" add constraint "handover_sessions_renter_id_fkey" FOREIGN KEY (renter_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."handover_sessions" validate constraint "handover_sessions_renter_id_fkey";

alter table "public"."handover_step_completion" add constraint "handover_step_completion_completed_by_fkey" FOREIGN KEY (completed_by) REFERENCES public.profiles(id) not valid;

alter table "public"."handover_step_completion" validate constraint "handover_step_completion_completed_by_fkey";

alter table "public"."handover_step_completion" add constraint "handover_step_completion_handover_session_id_fkey" FOREIGN KEY (handover_session_id) REFERENCES public.handover_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."handover_step_completion" validate constraint "handover_step_completion_handover_session_id_fkey";

alter table "public"."host_wallets" add constraint "host_wallets_host_id_fkey" FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."host_wallets" validate constraint "host_wallets_host_id_fkey";

alter table "public"."identity_verification_checks" add constraint "identity_verification_checks_handover_session_id_fkey" FOREIGN KEY (handover_session_id) REFERENCES public.handover_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."identity_verification_checks" validate constraint "identity_verification_checks_handover_session_id_fkey";

alter table "public"."identity_verification_checks" add constraint "identity_verification_checks_verification_status_check" CHECK (((verification_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('verified'::character varying)::text, ('failed'::character varying)::text]))) not valid;

alter table "public"."identity_verification_checks" validate constraint "identity_verification_checks_verification_status_check";

alter table "public"."identity_verification_checks" add constraint "identity_verification_checks_verified_user_id_fkey" FOREIGN KEY (verified_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."identity_verification_checks" validate constraint "identity_verification_checks_verified_user_id_fkey";

alter table "public"."identity_verification_checks" add constraint "identity_verification_checks_verifier_id_fkey" FOREIGN KEY (verifier_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."identity_verification_checks" validate constraint "identity_verification_checks_verifier_id_fkey";

alter table "public"."insurance_claim_activities" add constraint "insurance_claim_activities_claim_id_fkey" FOREIGN KEY (claim_id) REFERENCES public.insurance_claims(id) ON DELETE CASCADE not valid;

alter table "public"."insurance_claim_activities" validate constraint "insurance_claim_activities_claim_id_fkey";

alter table "public"."insurance_claims" add constraint "insurance_claims_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) not valid;

alter table "public"."insurance_claims" validate constraint "insurance_claims_booking_id_fkey";

alter table "public"."insurance_claims" add constraint "insurance_claims_policy_id_fkey" FOREIGN KEY (policy_id) REFERENCES public.insurance_policies(id) not valid;

alter table "public"."insurance_claims" validate constraint "insurance_claims_policy_id_fkey";

alter table "public"."insurance_policies" add constraint "insurance_policies_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."insurance_policies" validate constraint "insurance_policies_booking_id_fkey";

alter table "public"."insurance_policies" add constraint "insurance_policies_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) not valid;

alter table "public"."insurance_policies" validate constraint "insurance_policies_car_id_fkey";

alter table "public"."insurance_policies" add constraint "insurance_policies_package_id_fkey" FOREIGN KEY (package_id) REFERENCES public.insurance_packages(id) not valid;

alter table "public"."insurance_policies" validate constraint "insurance_policies_package_id_fkey";

alter table "public"."license_verifications" add constraint "license_verifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."license_verifications" validate constraint "license_verifications_user_id_fkey";

alter table "public"."message_reactions" add constraint "message_reactions_message_id_fkey" FOREIGN KEY (message_id) REFERENCES public.conversation_messages(id) ON DELETE CASCADE not valid;

alter table "public"."message_reactions" validate constraint "message_reactions_message_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey1" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey1";

alter table "public"."payment_transactions" add constraint "payment_transactions_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_booking_id_fkey";

alter table "public"."payments" add constraint "payments_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_booking_id_fkey";

alter table "public"."payments" add constraint "payments_payer_id_fkey" FOREIGN KEY (payer_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_payer_id_fkey";

alter table "public"."payments" add constraint "payments_status_check" CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('succeeded'::character varying)::text, ('failed'::character varying)::text, ('refunded'::character varying)::text]))) not valid;

alter table "public"."payments" validate constraint "payments_status_check";

alter table "public"."phone_verifications" add constraint "phone_verifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."phone_verifications" validate constraint "phone_verifications_user_id_fkey";

alter table "public"."policy_selections" add constraint "policy_selections_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."policy_selections" validate constraint "policy_selections_booking_id_fkey";

alter table "public"."policy_selections" add constraint "policy_selections_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.insurance_plans(id) ON DELETE RESTRICT not valid;

alter table "public"."policy_selections" validate constraint "policy_selections_plan_id_fkey";

alter table "public"."promo_code_usage" add constraint "promo_code_usage_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL not valid;

alter table "public"."promo_code_usage" validate constraint "promo_code_usage_booking_id_fkey";

alter table "public"."promo_code_usage" add constraint "promo_code_usage_promo_code_id_fkey" FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON DELETE CASCADE not valid;

alter table "public"."promo_code_usage" validate constraint "promo_code_usage_promo_code_id_fkey";

alter table "public"."real_time_locations" add constraint "real_time_locations_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE not valid;

alter table "public"."real_time_locations" validate constraint "real_time_locations_car_id_fkey";

alter table "public"."real_time_locations" add constraint "real_time_locations_host_id_fkey" FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."real_time_locations" validate constraint "real_time_locations_host_id_fkey";

alter table "public"."real_time_locations" add constraint "real_time_locations_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.bookings(id) ON DELETE SET NULL not valid;

alter table "public"."real_time_locations" validate constraint "real_time_locations_trip_id_fkey";

alter table "public"."reviews" add constraint "reviews_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) not valid;

alter table "public"."reviews" validate constraint "reviews_booking_id_fkey";

alter table "public"."reviews" add constraint "reviews_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) not valid;

alter table "public"."reviews" validate constraint "reviews_car_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_reviewee_id_fkey" FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewee_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewer_id_fkey";

alter table "public"."saved_cars" add constraint "saved_cars_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE not valid;

alter table "public"."saved_cars" validate constraint "saved_cars_car_id_fkey";

alter table "public"."saved_cars" add constraint "saved_cars_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."saved_cars" validate constraint "saved_cars_user_id_fkey";

alter table "public"."user_guide_progress" add constraint "user_guide_progress_guide_id_fkey" FOREIGN KEY (guide_id) REFERENCES public.guides(id) ON DELETE CASCADE not valid;

alter table "public"."user_guide_progress" validate constraint "user_guide_progress_guide_id_fkey";

alter table "public"."user_restrictions" add constraint "user_restrictions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."user_restrictions" validate constraint "user_restrictions_created_by_fkey";

alter table "public"."user_verifications" add constraint "user_verifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_verifications" validate constraint "user_verifications_user_id_fkey";

alter table "public"."vehicle_condition_reports" add constraint "vehicle_condition_reports_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_condition_reports" validate constraint "vehicle_condition_reports_booking_id_fkey";

alter table "public"."vehicle_condition_reports" add constraint "vehicle_condition_reports_car_id_fkey" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_condition_reports" validate constraint "vehicle_condition_reports_car_id_fkey";

alter table "public"."vehicle_condition_reports" add constraint "vehicle_condition_reports_handover_session_id_fkey" FOREIGN KEY (handover_session_id) REFERENCES public.handover_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_condition_reports" validate constraint "vehicle_condition_reports_handover_session_id_fkey";

alter table "public"."vehicle_condition_reports" add constraint "vehicle_condition_reports_report_type_check" CHECK (((report_type)::text = ANY (ARRAY[('pickup'::character varying)::text, ('return'::character varying)::text]))) not valid;

alter table "public"."vehicle_condition_reports" validate constraint "vehicle_condition_reports_report_type_check";

alter table "public"."vehicle_condition_reports" add constraint "vehicle_condition_reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_condition_reports" validate constraint "vehicle_condition_reports_reporter_id_fkey";

alter table "public"."vehicle_transfers" add constraint "vehicle_transfers_from_owner_id_fkey" FOREIGN KEY (from_owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."vehicle_transfers" validate constraint "vehicle_transfers_from_owner_id_fkey";

alter table "public"."vehicle_transfers" add constraint "vehicle_transfers_to_owner_id_fkey" FOREIGN KEY (to_owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."vehicle_transfers" validate constraint "vehicle_transfers_to_owner_id_fkey";

alter table "public"."vehicle_transfers" add constraint "vehicle_transfers_transferred_by_fkey" FOREIGN KEY (transferred_by) REFERENCES public.admins(id) ON DELETE SET NULL not valid;

alter table "public"."vehicle_transfers" validate constraint "vehicle_transfers_transferred_by_fkey";

alter table "public"."vehicle_transfers" add constraint "vehicle_transfers_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES public.cars(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_transfers" validate constraint "vehicle_transfers_vehicle_id_fkey";

alter table "public"."verification_address" add constraint "verification_address_confirmed_by_fkey" FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id) not valid;

alter table "public"."verification_address" validate constraint "verification_address_confirmed_by_fkey";

alter table "public"."verification_address" add constraint "verification_address_supporting_document_id_fkey" FOREIGN KEY (supporting_document_id) REFERENCES public.verification_documents(id) not valid;

alter table "public"."verification_address" validate constraint "verification_address_supporting_document_id_fkey";

alter table "public"."verification_address" add constraint "verification_address_verification_id_fkey" FOREIGN KEY (verification_id) REFERENCES public.user_verifications(id) ON DELETE CASCADE not valid;

alter table "public"."verification_address" validate constraint "verification_address_verification_id_fkey";

alter table "public"."verification_documents" add constraint "verification_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."verification_documents" validate constraint "verification_documents_user_id_fkey";

alter table "public"."wallet_transactions" add constraint "wallet_transactions_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL not valid;

alter table "public"."wallet_transactions" validate constraint "wallet_transactions_booking_id_fkey";

alter table "public"."wallet_transactions" add constraint "wallet_transactions_wallet_id_fkey" FOREIGN KEY (wallet_id) REFERENCES public.host_wallets(id) ON DELETE CASCADE not valid;

alter table "public"."wallet_transactions" validate constraint "wallet_transactions_wallet_id_fkey";

alter table "public"."withdrawal_requests" add constraint "withdrawal_requests_wallet_id_fkey" FOREIGN KEY (wallet_id) REFERENCES public.host_wallets(id) not valid;

alter table "public"."withdrawal_requests" validate constraint "withdrawal_requests_wallet_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_conversation_creator_as_participant()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only add participant if created_by is not null
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
    VALUES (NEW.id, NEW.created_by, true)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.analyze_conversation_query_performance()
 RETURNS TABLE(query_type text, table_name text, index_usage text, estimated_cost numeric, recommendations text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- This function can be used to analyze query performance
    -- and identify slow queries in the conversation system
    
    RETURN QUERY
    SELECT 
        'conversation_lookup'::text as query_type,
        'conversations'::text as table_name,
        'Check EXPLAIN ANALYZE for actual usage'::text as index_usage,
        0::numeric as estimated_cost,
        'Monitor slow query log for conversation queries'::text as recommendations;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auth_uid_test()
 RETURNS TABLE(current_user_id uuid, is_authenticated boolean, session_info text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (auth.uid() IS NOT NULL) as is_authenticated,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 'Valid session'
      ELSE 'No session or auth.uid() is null'
    END as session_info;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_circular_reply()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the reply would create a circular chain
  IF NEW.replying_to_message_id IS NOT NULL THEN
    -- Simple check: prevent direct circular reference (A replies to B which replies to A)
    IF EXISTS (
      SELECT 1 FROM public.messages 
      WHERE id = NEW.replying_to_message_id 
      AND replying_to_message_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reply detected: message % is already replying to message %', NEW.replying_to_message_id, NEW.id;
    END IF;
    
    -- Additional check: prevent longer circular chains (up to 5 levels deep)
    -- This prevents A->B->C->D->E->A type chains
    IF EXISTS (
      WITH RECURSIVE reply_chain AS (
        -- Start with the message we're replying to
        SELECT id, replying_to_message_id, 1 as depth
        FROM public.messages 
        WHERE id = NEW.replying_to_message_id
        
        UNION ALL
        
        -- Follow the reply chain
        SELECT m.id, m.replying_to_message_id, rc.depth + 1
        FROM public.messages m
        JOIN reply_chain rc ON m.id = rc.replying_to_message_id
        WHERE rc.depth < 5 -- Limit depth to prevent infinite recursion
      )
      SELECT 1 FROM reply_chain 
      WHERE replying_to_message_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reply chain detected for message %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_circular_reply_conversation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the reply would create a circular chain
  IF NEW.reply_to_message_id IS NOT NULL THEN
    -- Simple check: prevent direct circular reference (A replies to B which replies to A)
    IF EXISTS (
      SELECT 1 FROM public.conversation_messages 
      WHERE id = NEW.reply_to_message_id 
      AND reply_to_message_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reply detected: message % is already replying to message % in conversation %', NEW.reply_to_message_id, NEW.id, NEW.conversation_id;
    END IF;
    
    -- Additional check: prevent longer circular chains (up to 5 levels deep)
    -- This prevents A->B->C->D->E->A type chains within the same conversation
    IF EXISTS (
      WITH RECURSIVE reply_chain AS (
        -- Start with the message we're replying to
        SELECT id, reply_to_message_id, conversation_id, 1 as depth
        FROM public.conversation_messages 
        WHERE id = NEW.reply_to_message_id AND conversation_id = NEW.conversation_id
        
        UNION ALL
        
        -- Follow the reply chain within the same conversation
        SELECT cm.id, cm.reply_to_message_id, cm.conversation_id, rc.depth + 1
        FROM public.conversation_messages cm
        JOIN reply_chain rc ON cm.id = rc.reply_to_message_id AND cm.conversation_id = rc.conversation_id
        WHERE rc.depth < 5 -- Limit depth to prevent infinite recursion
      )
      SELECT 1 FROM reply_chain 
      WHERE reply_to_message_id = NEW.id AND conversation_id = NEW.conversation_id
    ) THEN
      RAISE EXCEPTION 'Circular reply chain detected for message % in conversation %', NEW.id, NEW.conversation_id;
    END IF;
    
    -- Check that the message we're replying to exists and is in the same conversation
    IF NOT EXISTS (
      SELECT 1 FROM public.conversation_messages 
      WHERE id = NEW.reply_to_message_id
      AND conversation_id = NEW.conversation_id
    ) THEN
      RAISE EXCEPTION 'Reply to message does not exist or is not in the same conversation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_conversation_access(p_conversation_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if user is a participant or creator
    RETURN EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = p_conversation_id AND user_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = p_conversation_id AND created_by = p_user_id
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE expires_at < timezone('utc'::text, now()) 
  AND is_active = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_bypass_sessions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deactivate expired sessions
    UPDATE verification_bypass_sessions
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true AND expires_at < NOW();

    -- Log the deactivation
    INSERT INTO verification_bypass_logs (
        user_id, session_id, action, bypass_reason, created_at
    )
    SELECT user_id, id, 'expired', bypass_reason, NOW()
    FROM verification_bypass_sessions
    WHERE is_active = false AND updated_at = NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.count_unread_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_unread_count INTEGER;
BEGIN
    SELECT 
        COUNT(*)
    INTO 
        v_unread_count
    FROM 
        notifications
    WHERE 
        user_id = (SELECT auth.uid())
        AND is_read = false
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_unread_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_booking_notification(p_booking_id uuid, p_renter_notification_type public.notification_type, p_host_notification_type public.notification_type, p_title text, p_description text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_renter_id uuid;
    v_host_id uuid;
    v_car_id uuid;
BEGIN
    -- Retrieve renter, host, and car IDs in a single query
    SELECT 
        b.renter_id, 
        c.owner_id,
        b.car_id
    INTO 
        v_renter_id, 
        v_host_id,
        v_car_id
    FROM bookings b
    JOIN cars c ON b.car_id = c.id
    WHERE b.id = p_booking_id;
    
    -- Validate both IDs
    IF v_renter_id IS NULL OR v_host_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find renter or host for booking %', p_booking_id;
    END IF;
    
    -- Renter notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read
    ) VALUES (
        v_renter_id,
        p_renter_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false
    );
    
    -- Host notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read
    ) VALUES (
        v_host_id,
        p_host_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Failed to create notifications for booking %: %', p_booking_id, SQLERRM;
        RAISE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_booking_notification(p_booking_id uuid, p_renter_notification_type public.notification_type, p_host_notification_type public.notification_type, p_title text, p_description text, p_metadata jsonb DEFAULT NULL::jsonb, p_role_target public.notification_role DEFAULT 'system_wide'::public.notification_role)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_renter_id uuid;
    v_host_id uuid;
    v_car_id uuid;
BEGIN
    -- Log the start of notification creation
    RAISE LOG 'Creating booking notifications for booking ID: %', p_booking_id;

    -- Retrieve renter, host, and car IDs in a single query
    SELECT 
        b.renter_id, 
        c.owner_id,
        b.car_id
    INTO 
        v_renter_id, 
        v_host_id,
        v_car_id
    FROM bookings b
    JOIN cars c ON b.car_id = c.id
    WHERE b.id = p_booking_id;
    
    -- Validate both IDs
    IF v_renter_id IS NULL OR v_host_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find renter or host for booking %', p_booking_id;
    END IF;
    
    -- Renter notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read,
        role_target
    ) VALUES (
        v_renter_id,  -- Ensure this matches the notification policy
        p_renter_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false,
        p_role_target
    );
    
    -- Host notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read,
        role_target
    ) VALUES (
        v_host_id,  -- Ensure this matches the notification policy
        p_host_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false,
        p_role_target
    );

    -- Log successful notification creation
    RAISE LOG 'Successfully created notifications for booking ID: % (Renter: %, Host: %)', 
        p_booking_id, v_renter_id, v_host_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Enhanced error logging
        RAISE LOG 'Failed to create notifications for booking %: %', 
            p_booking_id, SQLERRM;
        RAISE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification_with_expiration(p_user_id uuid, p_type public.notification_type, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_content text DEFAULT NULL::text, p_role_target public.notification_role DEFAULT 'system_wide'::public.notification_role, p_related_booking_id uuid DEFAULT NULL::uuid, p_related_car_id uuid DEFAULT NULL::uuid, p_related_user_id uuid DEFAULT NULL::uuid, p_priority integer DEFAULT 1, p_metadata jsonb DEFAULT '{}'::jsonb, p_custom_expiration_hours integer DEFAULT NULL::integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    notification_id BIGINT;
    expiration_timestamp TIMESTAMP WITH TIME ZONE := NULL;
    policy_expiration_hours INTEGER;
BEGIN
    -- Validate that either content or description is provided
    IF (p_content IS NULL OR p_content = '') AND (p_description IS NULL OR p_description = '') THEN
        RAISE EXCEPTION 'Either content or description must be provided';
    END IF;
    
    -- Determine expiration timestamp
    IF p_custom_expiration_hours IS NOT NULL THEN
        expiration_timestamp := NOW() + INTERVAL '1 hour' * p_custom_expiration_hours;
    ELSE
        SELECT default_expiration_hours INTO policy_expiration_hours
        FROM public.notification_expiration_policies
        WHERE notification_type = p_type;
        
        IF policy_expiration_hours IS NOT NULL THEN
            expiration_timestamp := NOW() + INTERVAL '1 hour' * policy_expiration_hours;
        END IF;
    END IF;
    
    -- Insert notification WITHOUT priority and related_user_id (columns don't exist)
    INSERT INTO public.notifications (
        user_id, type, title, description, role_target,
        related_booking_id, related_car_id,
        metadata, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_description, p_role_target,
        p_related_booking_id, p_related_car_id,
        p_metadata, expiration_timestamp
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_renter_arrival_notification(p_booking_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host_id UUID;
  v_car_brand TEXT;
  v_car_model TEXT;
  v_notification_id BIGINT;
  v_car_location TEXT;
BEGIN
  -- Get host ID and car details from booking
  SELECT 
    c.owner_id,
    c.brand,
    c.model,
    c.location
  INTO 
    v_host_id,
    v_car_brand,
    v_car_model,
    v_car_location
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;

  -- Check if host exists
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Host not found for booking %', p_booking_id;
  END IF;

  -- Create notification for host
  INSERT INTO notifications (
    user_id,
    type,
    title,
    description,
    related_booking_id,
    is_read,
    created_at,
    expires_at
  )
  VALUES (
    v_host_id,
    'arrival_notification'::notification_type,
    'Renter has arrived',
    format('The renter has arrived at %s for your %s %s. Please proceed to complete the handover process.', 
           COALESCE(v_car_location, 'the pickup location'), v_car_brand, v_car_model),
    p_booking_id,
    false,
    NOW(),
    NOW() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_wallet_notification(p_wallet_transaction_id uuid, p_user_id uuid, p_type public.notification_type, p_title text, p_description text, p_metadata jsonb DEFAULT NULL::jsonb, p_role_target public.notification_role DEFAULT 'system_wide'::public.notification_role)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_booking_id uuid;
    v_car_id uuid;
BEGIN
    -- Log the start of wallet notification creation
    RAISE LOG 'Creating wallet notification for transaction ID: %', p_wallet_transaction_id;

    -- Attempt to retrieve associated booking and car details
    SELECT 
        wt.booking_id, 
        b.car_id
    INTO 
        v_booking_id, 
        v_car_id
    FROM wallet_transactions wt
    LEFT JOIN bookings b ON wt.booking_id = b.id
    WHERE wt.id = p_wallet_transaction_id;

    -- Insert wallet notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_description,
        v_booking_id,
        v_car_id,
        p_metadata,
        false,
        p_role_target
    );

    -- Log successful notification creation
    RAISE LOG 'Successfully created wallet notification for transaction ID: % (User: %)', 
        p_wallet_transaction_id, p_user_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Enhanced error logging
        RAISE LOG 'Failed to create wallet notification for transaction %: %', 
            p_wallet_transaction_id, SQLERRM;
        RAISE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_old_notifications(p_days_old integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_deleted_count INTEGER;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());

    DELETE FROM notifications
    WHERE user_id = v_user_id
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND is_read = true;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_audit_hash(event_type public.audit_event_type, actor_id uuid, target_id uuid, action_details jsonb, event_timestamp timestamp with time zone, previous_hash text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    hash_input text;
BEGIN
    -- Create hash input string
    hash_input := event_type::text || '|' ||
                  COALESCE(actor_id::text, '') || '|' ||
                  COALESCE(target_id::text, '') || '|' ||
                  action_details::text || '|' ||
                  event_timestamp::text || '|' ||
                  COALESCE(previous_hash, '');

    -- Return SHA-256 hash
    RETURN encode(digest(hash_input, 'sha256'), 'hex');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_bypass_statistics(p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(total_sessions bigint, active_sessions bigint, expired_sessions bigint, most_common_reason text, unique_users bigint, avg_session_duration interval)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
        COUNT(*) FILTER (WHERE is_active = false) as expired_sessions,
        mode() WITHIN GROUP (ORDER BY bypass_reason) as most_common_reason,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(expires_at - created_at) as avg_session_duration
    FROM verification_bypass_sessions
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, content text, sender_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- First check if user has access to this conversation
    IF NOT public.check_conversation_access(p_conversation_id, p_user_id) THEN
        RAISE EXCEPTION 'Access denied to conversation';
    END IF;
    
    RETURN QUERY
    SELECT 
        cm.id,
        cm.content,
        cm.sender_id,
        cm.created_at,
        cm.updated_at
    FROM public.conversation_messages cm
    WHERE cm.conversation_id = p_conversation_id
    ORDER BY cm.created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_notification_expiration_info(p_notification_type public.notification_type)
 RETURNS TABLE(notification_type public.notification_type, default_expiration_hours integer, auto_cleanup_enabled boolean, estimated_expiration timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        nep.notification_type,
        nep.default_expiration_hours,
        nep.auto_cleanup_enabled,
        CASE 
            WHEN nep.default_expiration_hours IS NOT NULL THEN
                NOW() + INTERVAL '1 hour' * nep.default_expiration_hours
            ELSE NULL
        END as estimated_expiration
    FROM public.notification_expiration_policies nep
    WHERE nep.notification_type = p_notification_type;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_profile(user_uuid uuid)
 RETURNS TABLE(id uuid, full_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = user_uuid
    AND p.id IS NOT NULL; -- Explicit null check
$function$
;

CREATE OR REPLACE FUNCTION public.get_reply_chain(p_message_id uuid, p_max_depth integer DEFAULT 10)
 RETURNS TABLE(message_id uuid, conversation_id uuid, sender_id uuid, content text, reply_to_message_id uuid, depth integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reply_chain AS (
    -- Base case: the original message
    SELECT 
      cm.id as message_id,
      cm.conversation_id,
      cm.sender_id,
      cm.content,
      cm.reply_to_message_id,
      0 as depth,
      cm.created_at
    FROM public.conversation_messages cm
    WHERE cm.id = p_message_id
    
    UNION ALL
    
    -- Recursive case: messages that reply to the current message
    SELECT 
      cm.id as message_id,
      cm.conversation_id,
      cm.sender_id,
      cm.content,
      cm.reply_to_message_id,
      rc.depth + 1,
      cm.created_at
    FROM public.conversation_messages cm
    INNER JOIN reply_chain rc ON cm.reply_to_message_id = rc.message_id
    WHERE rc.depth < p_max_depth
  )
  SELECT * FROM reply_chain
  ORDER BY depth, created_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_reply_counts(conversation_id_param uuid, message_ids uuid[])
 RETURNS TABLE(message_id uuid, reply_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as message_id,
    COUNT(r.id) as reply_count
  FROM unnest(message_ids) AS m(id)
  LEFT JOIN public.conversation_messages r ON r.reply_to_message_id = m.id
  WHERE r.conversation_id = conversation_id_param OR r.conversation_id IS NULL
  GROUP BY m.id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(conversation_id uuid, title text, created_at timestamp with time zone, updated_at timestamp with time zone, is_participant boolean, is_creator boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        (cp.user_id IS NOT NULL) as is_participant,
        (c.created_by = p_user_id) as is_creator
    FROM public.conversations c
    LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = p_user_id
    WHERE c.created_by = p_user_id OR cp.user_id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_notifications(p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, p_only_unread boolean DEFAULT false)
 RETURNS TABLE(id bigint, type public.notification_type, role_target public.notification_role, title text, description text, is_read boolean, created_at timestamp with time zone, expires_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE 
    v_offset INT;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    v_offset := (p_page - 1) * p_page_size;

    RETURN QUERY 
    SELECT 
        n.id, 
        n.type, 
        n.role_target,
        n.title, 
        n.description, 
        n.is_read, 
        n.created_at, 
        n.expires_at,
        n.metadata
    FROM 
        notifications n
    WHERE 
        n.user_id = v_user_id 
        AND (p_only_unread = false OR n.is_read = false)
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ORDER BY 
        n.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user(user_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
  user_email text;
  user_metadata jsonb;
  result json;
BEGIN
  -- If no user_id provided, this might be called as a trigger
  IF user_id IS NULL THEN
    -- This would be NEW.id in a trigger context, but we can't access that here
    RAISE EXCEPTION 'user_id parameter is required when calling this function directly';
  END IF;
  
  target_user_id := user_id;
  
  -- Get user details from auth.users (if accessible)
  SELECT email, raw_user_meta_data 
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = target_user_id;
  
  -- If we can't access auth.users, use provided data
  IF user_email IS NULL THEN
    user_email := 'unknown@example.com';
    user_metadata := '{}'::jsonb;
  END IF;
  
  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    role,
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    target_user_id,
    'renter',
    '+267 ' || LPAD((RANDOM() * 99999999)::INTEGER::TEXT, 8, '0'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  
  -- Log welcome email to email_delivery_logs
  INSERT INTO public.email_delivery_logs (
    message_id,
    recipient_email,
    sender_email,
    subject,
    provider,
    status,
    metadata,
    sent_at
  )
  VALUES (
    'welcome_' || target_user_id::text,
    user_email,
    'noreply@mobirides.com',
    'Welcome to MobiRides!',
    'resend',
    'sent',
    jsonb_build_object('user_id', target_user_id, 'email_type', 'welcome_email'),
    NOW()
  );
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'message', 'Profile created and welcome email logged successfully'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := json_build_object(
      'success', false,
      'user_id', target_user_id,
      'error', SQLERRM,
      'message', 'Error processing new user'
    );
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_active_bypass_session(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM verification_bypass_sessions 
        WHERE user_id = p_user_id 
        AND is_active = true 
        AND expires_at > NOW()
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_conversation_admin(_conversation_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
      AND cp.is_admin = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_conversation_creator(_conversation_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND c.created_by = _user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_admin_activity(p_admin_id uuid, p_action text, p_resource_type text DEFAULT NULL::text, p_resource_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_admin_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_event_type public.audit_event_type, p_severity public.audit_severity DEFAULT 'medium'::public.audit_severity, p_actor_id uuid DEFAULT auth.uid(), p_target_id uuid DEFAULT NULL::uuid, p_session_id text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_location_data jsonb DEFAULT NULL::jsonb, p_action_details jsonb DEFAULT '{}'::jsonb, p_resource_type text DEFAULT NULL::text, p_resource_id uuid DEFAULT NULL::uuid, p_reason text DEFAULT NULL::text, p_anomaly_flags jsonb DEFAULT NULL::jsonb, p_compliance_tags text[] DEFAULT NULL::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_audit_id uuid;
    prev_hash text;
    curr_hash text;
BEGIN
    -- Get the previous hash (most recent audit log)
    SELECT current_hash INTO prev_hash
    FROM public.audit_logs
    ORDER BY event_timestamp DESC, id DESC
    LIMIT 1;

    -- Generate current hash
    curr_hash := generate_audit_hash(
        p_event_type,
        p_actor_id,
        p_target_id,
        p_action_details,
        now(),
        prev_hash
    );

    -- Insert the audit log
    INSERT INTO public.audit_logs (
        event_type,
        severity,
        actor_id,
        target_id,
        session_id,
        ip_address,
        user_agent,
        location_data,
        action_details,
        previous_hash,
        current_hash,
        resource_type,
        resource_id,
        reason,
        anomaly_flags,
        compliance_tags
    ) VALUES (
        p_event_type,
        p_severity,
        p_actor_id,
        p_target_id,
        p_session_id,
        p_ip_address,
        p_user_agent,
        p_location_data,
        p_action_details,
        prev_hash,
        curr_hash,
        p_resource_type,
        p_resource_id,
        p_reason,
        p_anomaly_flags,
        p_compliance_tags
    )
    RETURNING id INTO new_audit_id;

    RETURN new_audit_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_bypass_session_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO verification_bypass_logs (
        user_id, session_id, action, bypass_reason, client_ip, user_agent, created_at
    ) VALUES (
        NEW.user_id, NEW.id, 'created', NEW.bypass_reason, NEW.client_ip, NEW.user_agent, NOW()
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_bypass_session_deactivation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.is_active = true AND NEW.is_active = false THEN
        INSERT INTO verification_bypass_logs (
            user_id, session_id, action, bypass_reason, created_at
        ) VALUES (
            NEW.user_id, NEW.id, 'deactivated', NEW.bypass_reason, NOW()
        );
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_bypass_session_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- This will be called when a bypass session is used for verification
    -- Can be triggered by application code
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_notification_ids bigint[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_updated_count INTEGER;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());

    UPDATE notifications
    SET is_read = true
    WHERE id = ANY(p_notification_ids)
    AND user_id = v_user_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.remove_message_operation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- For star operations, update the messages table
  IF OLD.operation_type = 'star' THEN
    UPDATE messages 
    SET starred = FALSE 
    WHERE id = OLD.message_id;
  END IF;
  
  -- For pin operations, update the messages table
  IF OLD.operation_type = 'pin' THEN
    UPDATE messages 
    SET pinned = FALSE 
    WHERE id = OLD.message_id;
  END IF;
  
  -- For select operations, update the messages table
  IF OLD.operation_type = 'select' THEN
    UPDATE messages 
    SET selected = FALSE 
    WHERE id = OLD.message_id;
  END IF;
  
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_message_operation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- For star operations, update the messages table
  IF NEW.operation_type = 'star' THEN
    UPDATE messages 
    SET starred = TRUE 
    WHERE id = NEW.message_id;
  END IF;
  
  -- For pin operations, update the messages table
  IF NEW.operation_type = 'pin' THEN
    UPDATE messages 
    SET pinned = TRUE 
    WHERE id = NEW.message_id;
  END IF;
  
  -- For select operations, update the messages table
  IF NEW.operation_type = 'select' THEN
    UPDATE messages 
    SET selected = TRUE 
    WHERE id = NEW.message_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_message_reaction(p_message_id uuid, p_emoji text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_conversation_id UUID;
  v_metadata JSONB;
  v_reactions JSONB;
  v_new_reactions JSONB;
BEGIN
  -- Require authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING HINT = 'User must be signed in';
  END IF;

  -- Load message row
  SELECT conversation_id, metadata
    INTO v_conversation_id, v_metadata
  FROM public.conversation_messages
  WHERE id = p_message_id;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'message_not_found' USING HINT = 'Invalid message id';
  END IF;

  -- Ensure user is a participant in the conversation
  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = v_conversation_id
      AND cp.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'not_a_participant' USING HINT = 'User must be a participant to react';
  END IF;

  -- Current reactions array
  v_reactions := COALESCE(v_metadata->'reactions', '[]'::JSONB);

  -- Toggle: remove if exists, else add
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_reactions) AS r
    WHERE r->>'emoji' = p_emoji AND r->>'userId' = v_user_id::TEXT
  ) THEN
    v_new_reactions := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM jsonb_array_elements(v_reactions) AS elem
      WHERE NOT (elem->>'emoji' = p_emoji AND elem->>'userId' = v_user_id::TEXT)
    );
  ELSE
    v_new_reactions := v_reactions || jsonb_build_array(
      jsonb_build_object(
        'emoji', p_emoji,
        'userId', v_user_id::TEXT,
        'timestamp', NOW()
      )
    );
  END IF;

  -- Persist metadata with merged reactions
  UPDATE public.conversation_messages
  SET metadata = COALESCE(v_metadata, '{}'::JSONB) || jsonb_build_object('reactions', v_new_reactions)
  WHERE id = p_message_id;

  -- Return updated reactions
  RETURN (
    SELECT metadata->'reactions'
    FROM public.conversation_messages
    WHERE id = p_message_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_message_delivery_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-set delivered_at when status changes to 'delivered'
  IF NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = timezone('utc'::text, now());
  END IF;
  
  -- Auto-set read_at when status changes to 'read'
  IF NEW.delivery_status = 'read' AND OLD.delivery_status != 'read' AND NEW.read_at IS NULL THEN
    NEW.read_at = timezone('utc'::text, now());
    -- Also ensure delivered_at is set when marking as read
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at = timezone('utc'::text, now());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_message_operations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_notification_expiration_policy(p_notification_type public.notification_type, p_expiration_hours integer DEFAULT NULL::integer, p_auto_cleanup_enabled boolean DEFAULT true)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.notification_expiration_policies (
        notification_type, default_expiration_hours, auto_cleanup_enabled, updated_at
    ) VALUES (
        p_notification_type, p_expiration_hours, p_auto_cleanup_enabled, NOW()
    )
    ON CONFLICT (notification_type) DO UPDATE SET
        default_expiration_hours = EXCLUDED.default_expiration_hours,
        auto_cleanup_enabled = EXCLUDED.auto_cleanup_enabled,
        updated_at = NOW();
    
    RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_public_keys_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_verification_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_verification_step(user_uuid uuid, new_step public.verification_step)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.user_verifications
    SET 
        current_step = new_step,
        last_updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_admin_session(p_session_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  session_record RECORD;
BEGIN
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = p_session_token
  AND is_active = true
  AND expires_at > timezone('utc'::text, now());
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update last activity
  UPDATE public.admin_sessions
  SET last_activity = timezone('utc'::text, now())
  WHERE session_token = p_session_token;
  
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_conversation_access(p_conversation_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_participant boolean;
  v_is_creator boolean;
BEGIN
  -- Validate authentication
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'error', 'authentication_required'
    );
  END IF;
  
  -- Check participant status
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) INTO v_is_participant;
  
  -- Check creator status
  SELECT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = p_conversation_id AND created_by = p_user_id
  ) INTO v_is_creator;
  
  RETURN jsonb_build_object(
    'has_access', (v_is_participant OR v_is_creator),
    'is_participant', v_is_participant,
    'is_creator', v_is_creator
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_step_dependencies(handover_session_id_param uuid, step_order_param integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  required_steps_completed BOOLEAN;
BEGIN
  -- Check if all previous steps are completed
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO required_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND step_order < step_order_param;
  
  RETURN required_steps_completed;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_conversation_policies()
 RETURNS TABLE(test_name text, status text, details text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Test 1: Check if RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS_ENABLED'::text,
        CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END::text,
        'Row Level Security status for conversations'::text
    FROM pg_class 
    WHERE relname = 'conversations' AND relnamespace = 'public'::regnamespace;
    
    -- Test 2: Count policies
    RETURN QUERY
    SELECT 
        'POLICY_COUNT'::text,
        CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END::text,
        'Number of policies on conversations: ' || COUNT(*)::text
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'conversations';
    
    -- Test 3: Check for recursion-prone function calls in policies
    RETURN QUERY
    SELECT 
        'NO_FUNCTION_CALLS'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Policies with function calls (should be 0): ' || COUNT(*)::text
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
    AND (qual LIKE '%is_conversation_participant%' OR with_check LIKE '%is_conversation_participant%');
    
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_no_recursion_policies()
 RETURNS TABLE(table_name text, policy_count bigint, has_cross_references boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::text,
        COUNT(*)::bigint,
        bool_or(
            p.qual LIKE '%conversation_participants%' OR 
            p.qual LIKE '%conversations%' OR
            p.with_check LIKE '%conversation_participants%' OR
            p.with_check LIKE '%conversations%'
        ) AND p.tablename != 'conversation_participants' AND p.tablename != 'conversations'
    FROM pg_policies p
    WHERE p.schemaname = 'public' 
    AND p.tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
    GROUP BY p.tablename;
END;
$function$
;

create or replace view "public"."audit_analytics" as  SELECT date_trunc('day'::text, event_timestamp) AS date,
    event_type,
    severity,
    count(*) AS event_count,
    count(DISTINCT actor_id) AS unique_actors,
    count(DISTINCT target_id) AS unique_targets,
    array_agg(DISTINCT compliance_tags) FILTER (WHERE (compliance_tags IS NOT NULL)) AS compliance_tags
   FROM public.audit_logs
  GROUP BY (date_trunc('day'::text, event_timestamp)), event_type, severity
  ORDER BY (date_trunc('day'::text, event_timestamp)) DESC, (count(*)) DESC;


CREATE OR REPLACE FUNCTION public.calculate_car_rating(car_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    review_count INTEGER;
    avg_rating NUMERIC;
BEGIN
    -- Count reviews for this car
    SELECT COUNT(*) INTO review_count
    FROM reviews
    WHERE car_id = car_uuid
    AND review_type = 'car'
    AND status = 'published';
    
    -- If no reviews exist, return 4.0 as default
    IF review_count = 0 THEN
        RETURN 4.0;
    END IF;
    
    -- Calculate average rating
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 4.0) INTO avg_rating
    FROM reviews
    WHERE car_id = car_uuid
    AND review_type = 'car'
    AND status = 'published';
    
    RETURN avg_rating;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_category_ratings(p_car_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{}'::jsonb;
  category_key text;
  avg_val numeric;
  car_categories text[] := ARRAY['cleanliness', 'accuracy', 'communication', 'value'];
BEGIN
  FOREACH category_key IN ARRAY car_categories
  LOOP
    SELECT AVG((category_ratings->>category_key)::numeric)
    INTO avg_val
    FROM reviews
    WHERE car_id = p_car_id
      AND review_type = 'car'
      AND status = 'published'
      AND category_ratings ? category_key;

    IF avg_val IS NOT NULL THEN
      result := result || jsonb_build_object(category_key, ROUND(avg_val, 1));
    END IF;
  END LOOP;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_commission(booking_total numeric, rate numeric DEFAULT 0.1500)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ROUND(booking_total * rate, 2);
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_renter_category_ratings(p_renter_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{}'::jsonb;
  category_key text;
  avg_val numeric;
  renter_categories text[] := ARRAY['punctuality', 'car_care', 'communication'];
BEGIN
  FOREACH category_key IN ARRAY renter_categories
  LOOP
    SELECT AVG((category_ratings->>category_key)::numeric)
    INTO avg_val
    FROM reviews
    WHERE reviewee_id = p_renter_id
      AND review_type = 'host_to_renter'
      AND status = 'published'
      AND category_ratings ? category_key;

    IF avg_val IS NOT NULL THEN
      result := result || jsonb_build_object(category_key, ROUND(avg_val, 1));
    END IF;
  END LOOP;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    review_count INTEGER;
    avg_rating NUMERIC;
BEGIN
    -- Count reviews for this user (both as host and renter)
    SELECT COUNT(*) INTO review_count
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        -- Traditional reviews
        (r.reviewee_id = user_uuid AND r.review_type IN ('host_to_renter', 'renter_to_host'))
        OR
        -- Car reviews where this user is the car owner (host)
        (c.owner_id = user_uuid AND r.review_type = 'car')
    )
    AND r.status = 'published';
    
    -- If no reviews exist, return 4.0 as default
    IF review_count = 0 THEN
        RETURN 4.0;
    END IF;
    
    -- Calculate average rating
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 4.0) INTO avg_rating
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        r.reviewee_id = user_uuid
        OR c.owner_id = user_uuid
    )
    AND r.review_type IN ('car', 'host_to_renter', 'renter_to_host')
    AND r.status = 'published';
    
    RETURN avg_rating;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_host_wallet_balance(host_uuid uuid, required_commission numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_balance DECIMAL;
BEGIN
  -- Get current wallet balance
  SELECT balance INTO current_balance 
  FROM public.host_wallets 
  WHERE host_id = host_uuid;
  
  -- Return true if balance is sufficient, false otherwise
  RETURN COALESCE(current_balance, 0) >= required_commission;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Delete notifications that have expired
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW();
    
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications_enhanced()
 RETURNS TABLE(total_deleted integer, expired_by_timestamp integer, expired_by_policy integer, cleanup_details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    deleted_by_timestamp INTEGER := 0;
    deleted_by_policy INTEGER := 0;
    total_deleted_count INTEGER := 0;
    policy_record RECORD;
    cleanup_log JSONB := '{}'::JSONB;
    current_deleted INTEGER;
BEGIN
    -- Step 1: Clean up notifications with explicit expires_at timestamp
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_by_timestamp = ROW_COUNT;
    
    -- Step 2: Clean up notifications based on expiration policies
    FOR policy_record IN 
        SELECT nep.notification_type, nep.default_expiration_hours
        FROM public.notification_expiration_policies nep
        WHERE nep.default_expiration_hours IS NOT NULL 
        AND nep.auto_cleanup_enabled = true
    LOOP
        -- Delete notifications older than the policy expiration time
        DELETE FROM public.notifications 
        WHERE type = policy_record.notification_type
        AND expires_at IS NULL -- Only clean up those without explicit expiration
        AND created_at < (NOW() - INTERVAL '1 hour' * policy_record.default_expiration_hours);
        
        GET DIAGNOSTICS current_deleted = ROW_COUNT;
        deleted_by_policy := deleted_by_policy + current_deleted;
        
        -- Log cleanup details
        cleanup_log := cleanup_log || jsonb_build_object(
            policy_record.notification_type::TEXT, 
            jsonb_build_object(
                'expiration_hours', policy_record.default_expiration_hours,
                'deleted_count', current_deleted
            )
        );
    END LOOP;
    
    total_deleted_count := deleted_by_timestamp + deleted_by_policy;
    
    -- Log cleanup summary
    INSERT INTO public.notification_cleanup_log (deleted_count, cleanup_details, created_at)
    VALUES (total_deleted_count, cleanup_log, NOW());
    
    RETURN QUERY SELECT 
        total_deleted_count,
        deleted_by_timestamp,
        deleted_by_policy,
        cleanup_log;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_verification_temp()
 RETURNS TABLE(deleted_count integer, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  files_to_delete TEXT[];
  delete_count INTEGER := 0;
BEGIN
  -- Get list of files older than 24 hours
  SELECT ARRAY_AGG(name) INTO files_to_delete
  FROM storage.objects
  WHERE bucket_id = 'verification-temp'
    AND created_at < now() - interval '24 hours';

  -- If there are files to delete
  IF files_to_delete IS NOT NULL AND array_length(files_to_delete, 1) > 0 THEN
    -- Delete files using storage API
    FOR i IN 1..array_length(files_to_delete, 1) LOOP
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'verification-temp' AND name = files_to_delete[i];
        delete_count := delete_count + 1;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete file %: %', files_to_delete[i], SQLERRM;
      END;
    END LOOP;
  END IF;

  RETURN QUERY SELECT delete_count, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 0, SQLERRM;
END;
$function$
;

create or replace view "public"."conversation_messages_with_replies" as  SELECT cm.id,
    cm.conversation_id,
    cm.sender_id,
    cm.content,
    cm.message_type,
    cm.created_at,
    cm.updated_at,
    cm.edited,
    cm.edited_at,
    cm.reply_to_message_id,
    cm.related_car_id,
    cm.metadata,
    cm.delivery_status,
    cm.sent_at,
    cm.delivered_at,
    cm.read_at,
    cm.encrypted_content,
    cm.encryption_key_id,
    cm.is_encrypted,
    reply.id AS reply_original_id,
    reply.content AS reply_to_content,
    reply.sender_id AS reply_to_sender_id,
    reply.created_at AS reply_to_created_at,
    reply.message_type AS reply_to_message_type,
    ( SELECT count(*) AS count
           FROM public.conversation_messages r
          WHERE (r.reply_to_message_id = cm.id)) AS reply_count,
        CASE
            WHEN (reply.content IS NOT NULL) THEN
            CASE
                WHEN (length(reply.content) <= 50) THEN reply.content
                ELSE (SUBSTRING(reply.content FROM 1 FOR 47) || '...'::text)
            END
            ELSE NULL::text
        END AS reply_to_preview
   FROM (public.conversation_messages cm
     LEFT JOIN public.conversation_messages reply ON ((cm.reply_to_message_id = reply.id)));


CREATE OR REPLACE FUNCTION public.create_booking_notification(p_booking_id uuid, p_notification_type text, p_content text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_booking RECORD;
    v_host_id UUID;
    v_renter_id UUID;
    v_car_title TEXT;
    v_host_content TEXT;
    v_renter_content TEXT;
    v_host_title TEXT;
    v_renter_title TEXT;
    v_existing_count INTEGER;
BEGIN
    -- Get booking details
    SELECT b.*, c.brand, c.model, c.owner_id, b.renter_id
    INTO v_booking
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE WARNING 'Booking not found: %', p_booking_id;
        RETURN;
    END IF;
    
    v_host_id := v_booking.owner_id;
    v_renter_id := v_booking.renter_id;
    v_car_title := v_booking.brand || ' ' || v_booking.model;
    
    -- Handle different notification types
    CASE p_notification_type
        WHEN 'booking_request' THEN
            -- Host notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = 'booking_request_received'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_title := 'New Booking Request';
                v_host_content := 'New booking request for your ' || v_car_title || ' from ' || 
                                 TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_host_id, 'booking_request_received'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Renter notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_request_sent'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_title := 'Request Submitted';
                v_renter_content := 'Your booking request for ' || v_car_title || ' has been submitted and is pending approval';
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_renter_id, 'booking_request_sent'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
        WHEN 'booking_confirmed' THEN
            -- Renter notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_confirmed_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_title := 'Booking Confirmed';
                v_renter_content := 'Your booking for ' || v_car_title || ' has been confirmed for ' || 
                                   TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_renter_id, 'booking_confirmed_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Host notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = 'booking_confirmed_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_title := 'Booking Confirmed';
                v_host_content := 'You confirmed the booking for your ' || v_car_title;
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_host_id, 'booking_confirmed_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
        WHEN 'booking_cancelled' THEN
            -- Host notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = 'booking_cancelled_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_title := 'Booking Cancelled';
                v_host_content := 'Booking for your ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_host_id, 'booking_cancelled_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Renter notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_cancelled_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_title := 'Booking Cancelled';
                v_renter_content := 'Your booking for ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_renter_id, 'booking_cancelled_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
        ELSE
            RAISE WARNING 'Unsupported notification type: %', p_notification_type;
    END CASE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_conversation_secure(p_title text DEFAULT NULL::text, p_type text DEFAULT 'direct'::text, p_participant_ids uuid[] DEFAULT '{}'::uuid[], p_created_by_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_conversation_id uuid;
  v_user_id uuid;
  v_participant_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID or use provided ID
  v_user_id := COALESCE(p_created_by_id, auth.uid());
  
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: No valid user ID found';
  END IF;
  
  -- Check if direct conversation already exists (for direct messages only)
  IF p_type = 'direct' AND array_length(p_participant_ids, 1) = 1 THEN
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp1 
      WHERE cp1.conversation_id = c.id AND cp1.user_id = v_user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2 
      WHERE cp2.conversation_id = c.id AND cp2.user_id = p_participant_ids[1]
    )
    AND (
      SELECT COUNT(*) FROM public.conversation_participants cp 
      WHERE cp.conversation_id = c.id
    ) = 2;
    
    IF v_conversation_id IS NOT NULL THEN
      RAISE LOG 'create_conversation_secure: Found existing conversation %', v_conversation_id;
      
      -- Return existing conversation with proper structure
      SELECT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'type', c.type,
        'created_by', c.created_by,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'exists', true
      ) INTO v_result
      FROM public.conversations c
      WHERE c.id = v_conversation_id;
      
      RETURN v_result;
    END IF;
  END IF;
  
  -- Create new conversation
  INSERT INTO public.conversations (
    title,
    type,
    created_by
  ) VALUES (
    p_title,
    p_type,
    v_user_id
  ) RETURNING id INTO v_conversation_id;
  
  RAISE LOG 'create_conversation_secure: Created conversation % for user %', v_conversation_id, v_user_id;
  
  -- Add creator as participant using INSERT ... ON CONFLICT DO NOTHING
  INSERT INTO public.conversation_participants (
    conversation_id,
    user_id
  ) VALUES (
    v_conversation_id,
    v_user_id
  ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  -- Add other participants
  IF p_participant_ids IS NOT NULL AND array_length(p_participant_ids, 1) > 0 THEN
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
      -- Skip if participant is the creator (already added)
      IF v_participant_id != v_user_id THEN
        INSERT INTO public.conversation_participants (
          conversation_id,
          user_id
        ) VALUES (
          v_conversation_id,
          v_participant_id
        ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
        
        RAISE LOG 'create_conversation_secure: Added participant % to conversation %', v_participant_id, v_conversation_id;
      END IF;
    END LOOP;
  END IF;
  
  -- Build and return result
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'type', c.type,
    'created_by', c.created_by,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'exists', false
  ) INTO v_result
  FROM public.conversations c
  WHERE c.id = v_conversation_id;
  
  RAISE LOG 'create_conversation_secure: Successfully created conversation % with result %', v_conversation_id, v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'create_conversation_secure: Error for user %: % %', v_user_id, SQLSTATE, SQLERRM;
    RAISE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_handover_notification(p_user_id uuid, p_booking_id uuid, p_handover_type text, p_location text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_car_info TEXT;
BEGIN
    -- Get car information
    SELECT c.brand || ' ' || c.model INTO v_car_info
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF p_handover_type = 'pickup' THEN
        v_title := 'Vehicle Ready for Pickup';
        v_description := 'Your ' || COALESCE(v_car_info, 'vehicle') || ' is ready for pickup';
    ELSE
        v_title := 'Vehicle Return Ready';
        v_description := 'Please return your ' || COALESCE(v_car_info, 'vehicle');
    END IF;
    
    IF p_location IS NOT NULL THEN
        v_description := v_description || ' at ' || p_location;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        'handover_ready'::notification_type,
        v_title,
        v_description,
        p_booking_id,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create handover notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_handover_notification(p_user_id uuid, p_handover_type text, p_car_brand text, p_car_model text, p_location text, p_status text DEFAULT 'ready'::text, p_step_name text DEFAULT NULL::text, p_progress_percentage integer DEFAULT 0)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_type notification_type;
  notification_title TEXT;
  notification_description TEXT;
  notification_id BIGINT;
BEGIN
  -- Determine notification type based on status (use only valid enum values)
  CASE p_status
    WHEN 'ready', 'pickup', 'return', 'completed' THEN
      notification_type := 'handover_ready';
    ELSE
      notification_type := 'system_notification';
  END CASE;
  
  -- Create appropriate title and description
  IF p_step_name IS NOT NULL THEN
    notification_title := 'Handover Step Update';
    notification_description := format('Step "%s" for %s %s at %s', 
                                      p_step_name, p_car_brand, p_car_model, p_location);
  ELSIF p_progress_percentage > 0 THEN
    notification_title := 'Handover Progress Update';
    notification_description := format('Handover %s%% complete for %s %s at %s', 
                                      p_progress_percentage, p_car_brand, p_car_model, p_location);
  ELSE
    notification_title := format('Handover %s', initcap(p_status));
    notification_description := format('Your %s handover for %s %s is %s at %s', 
                                      p_handover_type, p_car_brand, p_car_model, p_status, p_location);
  END IF;
  
  -- Insert notification using correct column names and let ID auto-generate
  INSERT INTO public.notifications (
    user_id,
    title,
    description,  -- Use 'description' not 'message'
    type,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    notification_title,
    notification_description,
    notification_type::notification_type,  -- Explicit cast
    jsonb_build_object(
      'handover_type', p_handover_type,
      'car_brand', p_car_brand,
      'car_model', p_car_model,
      'location', p_location,
      'status', p_status,
      'step_name', p_step_name,
      'progress_percentage', p_progress_percentage
    ),
    NOW()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_handover_progress_notification(p_handover_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    session_record record;
    -- REMOVED: booking_record record (was unused)
    car_record record;
    progress_percentage integer;
    progress_data jsonb;  -- Use jsonb first, then extract integer
    current_step text;
BEGIN
    -- Get handover session details
    SELECT hs.booking_id, b.renter_id, b.car_id, hs.host_id, hs.renter_id AS session_renter_id
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details
    SELECT brand, model
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Calculate progress with explicit type handling
    BEGIN
        SELECT calculate_handover_progress(p_handover_session_id) INTO progress_data;
        progress_percentage := (progress_data->>'progress_percentage')::integer;  -- FIX: explicit cast
    EXCEPTION WHEN OTHERS THEN
        progress_percentage := 0;
    END;
    
    -- Get the most recent incomplete step
    SELECT step_name
    INTO current_step
    FROM handover_step_completion
    WHERE handover_session_id = p_handover_session_id
      AND is_completed = false
    ORDER BY step_order ASC
    LIMIT 1;
    
    -- Create progress notifications for both users
    IF session_record.host_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            session_record.host_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'in_progress',
            current_step,
            progress_percentage
        );
    END IF;
    
    IF session_record.session_renter_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            session_record.session_renter_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'in_progress',
            current_step,
            progress_percentage
        );
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_handover_step_notification(p_handover_session_id uuid, p_step_name text, p_completed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    session_record record;
    car_record record;
    other_user_id uuid;
    progress_percentage integer;
    progress_data jsonb;  -- Use jsonb first, then extract integer
BEGIN
    -- Get handover session details
    SELECT hs.*, b.car_id
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details
    SELECT brand, model
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Calculate progress with explicit type handling
    BEGIN
        SELECT calculate_handover_progress(p_handover_session_id) INTO progress_data;
        progress_percentage := (progress_data->>'progress_percentage')::integer;  -- FIX: explicit cast
    EXCEPTION WHEN OTHERS THEN
        progress_percentage := 0;
    END;
    
    -- Determine the other user
    IF p_completed_by = session_record.host_id THEN
        other_user_id := session_record.renter_id;
    ELSE
        other_user_id := session_record.host_id;
    END IF;
    
    -- Create notification for the other user
    IF other_user_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            other_user_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'step_completed',
            p_step_name,
            progress_percentage
        );
    END IF;
    
    -- If handover is complete, create completion notification
    IF progress_percentage >= 100 AND other_user_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            other_user_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'completed',
            NULL,
            100
        );
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_message_notification(p_recipient_id uuid, p_sender_name text, p_message_preview text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_title TEXT;
    v_description TEXT;
BEGIN
    v_title := 'New Message';
    v_description := 'You have a new message from ' || p_sender_name;
    
    IF p_message_preview IS NOT NULL THEN
        v_description := v_description || ': ' || LEFT(p_message_preview, 50);
        IF LENGTH(p_message_preview) > 50 THEN
            v_description := v_description || '...';
        END IF;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read,
        role_target
    ) VALUES (
        p_recipient_id,
        'message_received'::notification_type,
        v_title,
        v_description,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create message notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification_campaign(p_campaign_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign_id UUID;
  v_user_record RECORD;
  v_notification_id BIGINT;
  v_created_count INTEGER := 0;
  v_total_recipients INTEGER := 0;
  v_send_immediately BOOLEAN;
BEGIN
  v_send_immediately := COALESCE((p_campaign_data->>'send_immediately')::BOOLEAN, false);
  
  -- Create campaign
  INSERT INTO notification_campaigns (
    name, description, status, target_user_roles,
    title, message, action_url, action_text, priority,
    scheduled_for, registration_start, registration_end,
    last_login_days, booking_count_min, metadata, created_by
  ) VALUES (
    p_campaign_data->>'name',
    p_campaign_data->>'description',
    CASE WHEN v_send_immediately THEN 'sending'::notification_campaign_status ELSE 'scheduled'::notification_campaign_status END,
    ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles')),
    p_campaign_data->>'title',
    p_campaign_data->>'message',
    p_campaign_data->>'action_url',
    p_campaign_data->>'action_text',
    COALESCE(p_campaign_data->>'priority', 'medium'),
    (p_campaign_data->>'scheduled_date')::TIMESTAMPTZ,
    (p_campaign_data->>'registration_start')::TIMESTAMPTZ,
    (p_campaign_data->>'registration_end')::TIMESTAMPTZ,
    (p_campaign_data->>'last_login_days')::INTEGER,
    (p_campaign_data->>'booking_count_min')::INTEGER,
    COALESCE(p_campaign_data->'metadata', '{}'::JSONB),
    auth.uid()
  ) RETURNING id INTO v_campaign_id;
  
  -- If sending immediately, create notifications
  IF v_send_immediately THEN
    FOR v_user_record IN
      SELECT DISTINCT p.id
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE 
        (p_campaign_data->'user_roles' IS NULL OR p.role::TEXT = ANY(ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles'))))
    LOOP
      v_total_recipients := v_total_recipients + 1;
      
      BEGIN
        INSERT INTO notifications (user_id, type, title, description, metadata)
        VALUES (
          v_user_record.id,
          'system_notification'::notification_type,
          p_campaign_data->>'title',
          p_campaign_data->>'message',
          jsonb_build_object('campaign_id', v_campaign_id)
        ) RETURNING id INTO v_notification_id;
        
        INSERT INTO campaign_delivery_logs (campaign_id, user_id, notification_id, status)
        VALUES (v_campaign_id, v_user_record.id, v_notification_id, 'sent');
        
        v_created_count := v_created_count + 1;
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO campaign_delivery_logs (campaign_id, user_id, status, error_message)
        VALUES (v_campaign_id, v_user_record.id, 'failed', SQLERRM);
      END;
    END LOOP;
    
    UPDATE notification_campaigns
    SET status = 'completed'::notification_campaign_status,
        sent_at = NOW(),
        total_recipients = v_total_recipients,
        successful_sends = v_created_count,
        failed_sends = v_total_recipients - v_created_count
    WHERE id = v_campaign_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', v_campaign_id,
    'notifications_created', v_created_count,
    'total_recipients', v_total_recipients
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_payment_notification(p_user_id uuid, p_payment_type text, p_amount numeric, p_booking_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_notification_type notification_type;
BEGIN
    CASE p_payment_type
        WHEN 'received' THEN
            v_title := 'Payment Received';
            v_description := 'Payment of P' || p_amount::TEXT || ' has been received';
            v_notification_type := 'payment_received';
        WHEN 'failed' THEN
            v_title := 'Payment Failed';
            v_description := 'Payment of P' || p_amount::TEXT || ' has failed';
            v_notification_type := 'payment_failed';
        ELSE
            v_title := 'Payment Update';
            v_description := COALESCE(p_description, 'Payment update for P' || p_amount::TEXT);
            v_notification_type := 'payment_received';
    END CASE;
    
    IF p_description IS NOT NULL THEN
        v_description := p_description;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        v_notification_type,
        v_title,
        v_description,
        p_booking_id,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create payment notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_system_notification(p_user_id uuid, p_title text, p_description text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        metadata,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        'system_notification'::notification_type,
        p_title,
        p_description,
        p_metadata,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create system notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_wallet_notification(p_host_id uuid, p_type text, p_amount numeric, p_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_notification_type notification_type;
BEGIN
    -- Generate title and description based on type
    CASE p_type
        WHEN 'topup' THEN
            v_title := 'Wallet Top-up';
            v_description := 'Your wallet has been topped up with P' || p_amount::TEXT;
            v_notification_type := 'wallet_topup';
        WHEN 'deduction' THEN
            v_title := 'Commission Deducted';
            v_description := 'P' || p_amount::TEXT || ' commission deducted from your wallet';
            v_notification_type := 'wallet_deduction';
        WHEN 'payment_received' THEN
            v_title := 'Payment Received';
            v_description := 'Payment of P' || p_amount::TEXT || ' received';
            v_notification_type := 'payment_received';
        ELSE
            v_title := 'Wallet Transaction';
            v_description := COALESCE(p_description, 'Wallet transaction of P' || p_amount::TEXT);
            v_notification_type := 'wallet_deduction';
    END CASE;
    
    -- Create notification without content column
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read
    ) VALUES (
        p_host_id,
        v_notification_type,
        v_title,
        v_description,
        false
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create wallet notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.credit_pending_earnings(p_booking_id uuid, p_host_earnings numeric, p_platform_commission numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host_id UUID;
  v_wallet_id UUID;
  v_balance_before NUMERIC;
BEGIN
  SELECT c.owner_id
  INTO v_host_id
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;
  
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  SELECT pending_balance INTO v_balance_before FROM host_wallets WHERE host_id = v_host_id;
  v_balance_before := COALESCE(v_balance_before, 0);

  UPDATE host_wallets
  SET 
    pending_balance = pending_balance + p_host_earnings,
    updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO host_wallets (host_id, balance, pending_balance, currency)
    VALUES (v_host_id, 0, p_host_earnings, 'BWP')
    RETURNING id INTO v_wallet_id;
  END IF;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    booking_id,
    balance_before,
    balance_after
  )
  SELECT 
    v_wallet_id,
    p_host_earnings,
    'rental_earnings_pending',
    'Pending earnings from booking ' || p_booking_id::TEXT || ' (Commission: P' || p_platform_commission::TEXT || ')',
    p_booking_id,
    v_balance_before,
    hw.pending_balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$function$
;

create or replace view "public"."email_analytics_summary" as  SELECT provider,
    date_trunc('month'::text, (date)::timestamp with time zone) AS month,
    sum(total_sent) AS total_sent,
    sum(total_delivered) AS total_delivered,
    sum(total_bounced) AS total_bounced,
    sum(total_complained) AS total_complained,
    sum(total_opened) AS total_opened,
    sum(total_clicked) AS total_clicked,
    sum(total_failed) AS total_failed,
    round(avg(delivery_rate), 2) AS avg_delivery_rate,
    round(avg(bounce_rate), 2) AS avg_bounce_rate,
    round(avg(complaint_rate), 2) AS avg_complaint_rate,
    round(avg(open_rate), 2) AS avg_open_rate,
    round(avg(click_rate), 2) AS avg_click_rate,
    round(avg(average_latency_ms)) AS avg_latency_ms
   FROM public.email_analytics_daily
  GROUP BY provider, (date_trunc('month'::text, (date)::timestamp with time zone))
  ORDER BY (date_trunc('month'::text, (date)::timestamp with time zone)) DESC, provider;


CREATE OR REPLACE FUNCTION public.enforce_step_dependencies()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only check dependencies when marking a step as completed
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    -- Skip dependency check for the first step
    IF NEW.step_order > 1 THEN
      IF NOT public.validate_step_dependencies(NEW.handover_session_id, NEW.step_order) THEN
        RAISE EXCEPTION 'Cannot complete step %. Previous steps must be completed first.', NEW.step_name;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_conversation_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When a participant is deleted, check if conversation should be deleted
  IF TG_OP = 'DELETE' THEN
    -- If conversation has less than 2 participants after deletion, delete the conversation
    IF (SELECT COUNT(*) FROM public.conversation_participants WHERE conversation_id = OLD.conversation_id) < 2 THEN
      DELETE FROM public.conversations WHERE id = OLD.conversation_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_insurance_policies()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update policies where end_date < now() AND status is 'active'
  WITH updated AS (
    UPDATE public.insurance_policies
    SET 
      status = 'expired',
      updated_at = now()
    WHERE 
      status = 'active' 
      AND end_date < now()
    RETURNING id
  )
  SELECT count(*) INTO expired_count FROM updated;

  IF expired_count > 0 THEN
    RAISE NOTICE 'Expired % insurance policies', expired_count;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_unpaid_bookings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
  -- Log start
  RAISE NOTICE 'Running expire_unpaid_bookings...';
  
  FOR r IN 
    SELECT id FROM bookings 
    WHERE status = 'awaiting_payment' 
    AND payment_deadline < NOW()
  LOOP
    RAISE NOTICE 'Expiring booking %', r.id;
    
    UPDATE bookings 
    SET 
      status = 'cancelled', -- or 'expired' if enum supports it
      payment_status = 'expired',
      updated_at = NOW()
    WHERE id = r.id;
    
    -- Optional: Insert notification logic here
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_claim_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM public.insurance_claims) + 1;
  new_number := 'CLM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_policy_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM public.insurance_policies) + 1;
  new_number := 'INS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(id uuid, email text, full_name text, phone_number text, role public.user_role, created_at timestamp with time zone, avatar_url text, verification_status public.verification_status)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT 
    p.id,
    u.email::text,
    p.full_name,
    p.phone_number,
    p.role,
    p.created_at,
    p.avatar_url,
    p.verification_status
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_users_complete()
 RETURNS TABLE(id uuid, full_name text, email text, role text, avatar_url text, phone_number text, created_at timestamp with time zone, updated_at timestamp with time zone, verification_status text, is_active boolean, user_roles text[], is_restricted boolean, active_restrictions jsonb, vehicles_count bigint, bookings_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.full_name,
    au.email::TEXT,
    pr.role::TEXT,
    pr.avatar_url,
    pr.phone_number,
    pr.created_at,
    pr.updated_at,
    pr.verification_status::TEXT,
    TRUE AS is_active,
    COALESCE(
      (SELECT array_agg(ur.role::TEXT) FROM public.user_roles ur WHERE ur.user_id = pr.id),
      ARRAY[]::TEXT[]
    ) AS user_roles,
    EXISTS (
      SELECT 1 FROM public.user_restrictions urs
      WHERE urs.user_id = pr.id
        AND urs.active = true
        AND urs.starts_at <= now()
        AND (urs.ends_at IS NULL OR urs.ends_at > now())
    ) AS is_restricted,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', urs.id,
        'restriction_type', urs.restriction_type,
        'reason', urs.reason,
        'starts_at', urs.starts_at,
        'ends_at', urs.ends_at
      )) FROM public.user_restrictions urs
      WHERE urs.user_id = pr.id
        AND urs.active = true
        AND urs.starts_at <= now()
        AND (urs.ends_at IS NULL OR urs.ends_at > now())),
      '[]'::JSONB
    ) AS active_restrictions,
    (SELECT COUNT(*) FROM public.cars c WHERE c.owner_id = pr.id) AS vehicles_count,
    (SELECT COUNT(*) FROM public.bookings b WHERE b.renter_id = pr.id) AS bookings_count
  FROM public.profiles pr
  LEFT JOIN auth.users au ON au.id = pr.id
  ORDER BY pr.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_campaign_analytics(p_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stats RECORD;
  v_result JSONB;
BEGIN
  SELECT 
    COUNT(*) as total_recipients,
    COUNT(*) FILTER (WHERE status = 'sent') as sent,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE status = 'opened') as opened,
    COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COUNT(*) FILTER (WHERE status = 'pending') as pending
  INTO v_stats
  FROM campaign_delivery_logs
  WHERE campaign_id = p_campaign_id;
  
  v_result := jsonb_build_object(
    'total_recipients', COALESCE(v_stats.total_recipients, 0),
    'sent', COALESCE(v_stats.sent, 0),
    'delivered', COALESCE(v_stats.delivered, 0),
    'opened', COALESCE(v_stats.opened, 0),
    'clicked', COALESCE(v_stats.clicked, 0),
    'failed', COALESCE(v_stats.failed, 0),
    'pending', COALESCE(v_stats.pending, 0),
    'delivery_rate', CASE WHEN v_stats.total_recipients > 0 THEN ROUND((v_stats.delivered::NUMERIC / v_stats.total_recipients) * 100, 2) ELSE 0 END,
    'open_rate', CASE WHEN v_stats.delivered > 0 THEN ROUND((v_stats.opened::NUMERIC / v_stats.delivered) * 100, 2) ELSE 0 END,
    'click_rate', CASE WHEN v_stats.opened > 0 THEN ROUND((v_stats.clicked::NUMERIC / v_stats.opened) * 100, 2) ELSE 0 END
  );
  
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_marketing_recipients()
 RETURNS TABLE(id uuid, email character varying, full_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Default to all users for now (ignoring marketing_notifications preference for broad reach)
  -- Or we can change the logic to WHERE p.marketing_notifications IS NOT FALSE (if we want to allow opt-out but default to true)
  -- User requested: "by default all users should recieve the notification"
  
  RETURN QUERY
  SELECT 
    p.id,
    au.email::varchar,
    p.full_name
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id;
  -- Removed: WHERE p.marketing_notifications = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_email_for_notification(user_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_email text;
BEGIN
    -- Get user email from auth.users table
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    RETURN user_email;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_push_subscriptions(user_id uuid)
 RETURNS TABLE(id uuid, endpoint text, p256dh text, auth text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth, ps.created_at
  FROM public.push_subscriptions ps
  WHERE ps.user_id = get_user_push_subscriptions.user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_review_stats(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB := '{}'::jsonb;  -- FIX: explicit jsonb cast
    host_rating NUMERIC;
    renter_rating NUMERIC;
    total_reviews INTEGER;
BEGIN
    -- Calculate host rating (when user is being reviewed as a host)
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO host_rating
    FROM reviews
    WHERE reviewee_id = user_uuid 
    AND review_type = 'renter_to_host'
    AND status = 'published';
    
    -- Calculate renter rating (when user is being reviewed as a renter)
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO renter_rating
    FROM reviews
    WHERE reviewee_id = user_uuid 
    AND review_type = 'host_to_renter'
    AND status = 'published';
    
    -- Count total reviews received
    SELECT COUNT(*) INTO total_reviews
    FROM reviews
    WHERE reviewee_id = user_uuid
    AND review_type IN ('host_to_renter', 'renter_to_host')
    AND status = 'published';
    
    result := jsonb_build_object(
        'host_rating', host_rating,
        'renter_rating', renter_rating,
        'total_reviews', total_reviews,
        'overall_rating', COALESCE((host_rating + renter_rating) / NULLIF(2, 0), 0)
    );
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Handle booking confirmation
    IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
        PERFORM create_booking_notification(NEW.id, 'booking_confirmed', '');
    END IF;
    
    -- Handle booking cancellation
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled' THEN
        PERFORM create_booking_notification(NEW.id, 'booking_cancelled', '');
    END IF;
    
    -- Handle new booking requests (INSERT)
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        PERFORM create_booking_notification(NEW.id, 'booking_request', '');
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_handover_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    booking_record record;
    car_record record;
    is_early_return boolean := false;
BEGIN
    -- Only process if handover_completed is being set to true
    IF NEW.handover_completed = true AND (OLD.handover_completed IS NULL OR OLD.handover_completed = false) THEN
        
        -- Only process return handovers
        IF NEW.handover_type = 'return' THEN
            
            -- Get booking details
            SELECT b.*, c.brand, c.model
            INTO booking_record
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            WHERE b.id = NEW.booking_id;
            
            IF FOUND THEN
                -- Set actual_end_date to current timestamp
                -- Check if this is an early return by comparing with original end_date
                IF NOW() < booking_record.end_date THEN
                    is_early_return := true;
                END IF;
                
                -- Update the booking record
                UPDATE bookings 
                SET 
                    status = 'completed',
                    early_return = is_early_return,
                    actual_end_date = NOW(),
                    updated_at = NOW()
                WHERE id = NEW.booking_id;
                
                -- Create early return notification if applicable
                IF is_early_return THEN
                    -- Create notification for the host (car owner)
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.host_id,
                        'early_return_notification'::notification_type,
                        'Early Return Completed',
                        format('The %s %s has been returned early by the renter', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'original_end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                    
                    -- Create notification for the renter
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.renter_id,
                        'early_return_notification'::notification_type,
                        'Early Return Confirmed',
                        format('You have successfully returned the %s %s early', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'original_end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                ELSE
                    -- Create regular completion notification for on-time returns
                    -- Create notification for the host
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.host_id,
                        'system_notification'::notification_type,
                        'Return Completed',
                        format('The %s %s has been returned successfully', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                    
                    -- Create notification for the renter
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.renter_id,
                        'system_notification'::notification_type,
                        'Return Confirmed',
                        format('You have successfully returned the %s %s', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    sender_name TEXT;
    participant_ids UUID[];
    participant_id UUID;
    message_preview TEXT;
BEGIN
    -- Get sender name from profiles table, fallback to auth.users email if full_name is null
    SELECT COALESCE(p.full_name, au.email, 'Unknown User') INTO sender_name
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE au.id = NEW.sender_id;

    -- Get message preview (first 100 characters)
    message_preview := LEFT(NEW.content, 100);

    -- Get all participant IDs for this conversation (excluding sender)
    SELECT array_agg(cp.user_id) INTO participant_ids
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id;

    -- Create notifications for each participant ONLY if there are participants
    IF participant_ids IS NOT NULL THEN
        FOREACH participant_id IN ARRAY participant_ids
        LOOP
            -- Create database notification
            INSERT INTO notifications (
                user_id,
                type,
                title,
                description,
                metadata,
                role_target,
                is_read
            ) VALUES (
                participant_id,
                'message_received'::notification_type,
                'New Message',
                COALESCE(sender_name, 'Someone') || ' sent you a message: ' || message_preview,
                jsonb_build_object(
                    'conversation_id', NEW.conversation_id,
                    'message_id', NEW.id,
                    'sender_id', NEW.sender_id,
                    'sender_name', COALESCE(sender_name, 'Unknown')
                ),
                NULL, -- Use NULL for user-specific notifications (was 'user' which is invalid enum)
                false
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_full_name text;
    user_phone_number text;
    user_email text;
BEGIN
    -- Extract user data
    user_email := NEW.email;
    user_full_name := NEW.raw_user_meta_data ->> 'full_name';
    user_phone_number := NEW.raw_user_meta_data ->> 'phone_number';
    
    -- Log the extracted data for debugging
    RAISE LOG 'handle_new_user: Processing user % with email %, full_name %, phone %',
        NEW.id, user_email, user_full_name, user_phone_number;
    
    -- Insert into profiles with extracted data
    INSERT INTO public.profiles (
        id,
        full_name,
        phone_number,
        email_confirmed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_full_name,
        user_phone_number,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW(),
        NOW()
    );
    
    -- Log successful profile creation
    RAISE LOG 'handle_new_user: Successfully created profile for user %', NEW.id;
    
    -- Call edge function to send welcome email (if email exists)
    IF user_email IS NOT NULL THEN
        BEGIN
            -- This will be handled by the resend-service edge function
            RAISE LOG 'handle_new_user: Email service call would be made for %', user_email;
        EXCEPTION WHEN OTHERS THEN
            -- Don't fail the user creation if email fails
            RAISE LOG 'handle_new_user: Email service failed for user %, error: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't prevent user creation
        RAISE LOG 'handle_new_user: Error processing user %, error: %', NEW.id, SQLERRM;
        -- Still return NEW to allow user creation to succeed
        RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_restrictions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

create type "public"."http_request" as ("method" public.http_method, "uri" character varying, "headers" public.http_header[], "content_type" character varying, "content" character varying);

create type "public"."http_response" as ("status" integer, "content_type" character varying, "headers" public.http_header[], "content" character varying);

CREATE OR REPLACE FUNCTION public.increment_car_view_count(car_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.cars 
  SET view_count = view_count + 1 
  WHERE id = car_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_promo_code_uses(promo_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.promo_codes 
  SET current_uses = current_uses + 1 
  WHERE id = promo_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_conversation_participant_secure(conversation_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_participant(p_conversation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  -- Direct check on the table.
  -- Since this is SECURITY DEFINER, it bypasses RLS on conversation_participants.
  -- This prevents the recursion loop when called from an RLS policy.
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id 
    AND user_id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_profile_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check admins table only for super admin
  IF EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_admin_from_admins()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid() AND a.is_super_admin = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_admin_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if admin_activity_logs table exists
  -- This allows the admins table to be created before admin_activity_logs
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_activity_logs'
  ) THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.admin_activity_logs (admin_id, action, details)
      VALUES (NEW.id, 'admin_created', jsonb_build_object('email', NEW.email, 'is_super_admin', NEW.is_super_admin));
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.admin_activity_logs (admin_id, action, details)
      VALUES (NEW.id, 'admin_updated', jsonb_build_object('email', NEW.email, 'is_super_admin', NEW.is_super_admin));
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.admin_activity_logs (admin_id, action, details)
      VALUES (OLD.id, 'admin_deleted', jsonb_build_object('email', OLD.email));
    END IF;
  END IF;
  
  -- Always return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_notification_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Log notification creation for debugging
    RAISE LOG 'Notification created: user_id=%, type=%, booking_id=%, content=%', 
        NEW.user_id, NEW.type, NEW.related_booking_id, LEFT(NEW.content, 50);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_due_earnings_releases()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Running process_due_earnings_releases...';
  
  FOR r IN
    SELECT b.id 
    FROM bookings b
    WHERE b.status = 'completed'
    AND b.actual_end_date < (NOW() - INTERVAL '24 hours') -- 24h buffer
    AND NOT EXISTS (
      SELECT 1 FROM wallet_transactions wt 
      WHERE wt.booking_id = b.id AND wt.transaction_type = 'earnings_released'
    )
  LOOP
    BEGIN
      RAISE NOTICE 'Releasing earnings for booking %', r.id;
      PERFORM release_pending_earnings(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to release earnings for booking %: %', r.id, SQLERRM;
    END;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_withdrawal_request(p_host_id uuid, p_amount numeric, p_payout_method character varying, p_payout_details jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id UUID;
  v_available_balance NUMERIC;
  v_withdrawal_id UUID;
  v_min_withdrawal NUMERIC;
  v_balance_before NUMERIC;
BEGIN
  -- FIX: Correctly extract numeric value from JSONB (remove quotes)
  SELECT (value #>> '{}')::NUMERIC INTO v_min_withdrawal
  FROM payment_config WHERE key = 'minimum_withdrawal';
  
  v_min_withdrawal := COALESCE(v_min_withdrawal, 200);
  
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Minimum withdrawal is P%', v_min_withdrawal;
  END IF;
  
  SELECT id, balance
  INTO v_wallet_id, v_available_balance
  FROM host_wallets
  WHERE host_id = p_host_id
  FOR UPDATE;
  
  v_balance_before := v_available_balance;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: P%', v_available_balance;
  END IF;
  
  UPDATE host_wallets
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  INSERT INTO withdrawal_requests (
    host_id,
    wallet_id,
    amount,
    payout_method,
    payout_details,
    status
  )
  VALUES (
    p_host_id,
    v_wallet_id,
    p_amount,
    p_payout_method,
    p_payout_details,
    'pending'
  )
  RETURNING id INTO v_withdrawal_id;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after,
    metadata
  )
  SELECT 
    v_wallet_id,
    -p_amount,
    'withdrawal',
    'Withdrawal request ' || v_withdrawal_id::TEXT,
    v_balance_before,
    hw.balance,
    jsonb_build_object('withdrawal_request_id', v_withdrawal_id)
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN v_withdrawal_id;
END;
$function$
;

create or replace view "public"."provider_performance_summary" as  SELECT p.provider,
    p.success_rate,
    p.average_latency_ms,
    p.circuit_breaker_state,
    p.consecutive_failures,
    p.last_failure_at,
    p.last_success_at,
    p.health_check_status,
    count(e.id) AS recent_events_24h
   FROM (public.provider_health_metrics p
     LEFT JOIN public.email_webhook_events e ON (((e.provider = p.provider) AND (e.webhook_received_at >= (now() - '24:00:00'::interval)))))
  GROUP BY p.provider, p.success_rate, p.average_latency_ms, p.circuit_breaker_state, p.consecutive_failures, p.last_failure_at, p.last_success_at, p.health_check_status;


CREATE OR REPLACE FUNCTION public.release_pending_earnings(p_booking_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host_id UUID;
  v_amount NUMERIC;
  v_wallet_id UUID;
  v_booking_status TEXT;
  v_balance_before NUMERIC;
BEGIN
  SELECT 
    c.owner_id,
    pt.host_earnings,
    b.status
  INTO v_host_id, v_amount, v_booking_status
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  LEFT JOIN payment_transactions pt ON b.payment_transaction_id = pt.id
  WHERE b.id = p_booking_id;
  
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  IF v_booking_status != 'completed' THEN
    RAISE EXCEPTION 'Booking must be completed to release earnings';
  END IF;
  
  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'No earnings to release for booking: %', p_booking_id;
  END IF;
  
  SELECT balance INTO v_balance_before FROM host_wallets WHERE host_id = v_host_id;
  
  UPDATE host_wallets
  SET 
    pending_balance = pending_balance - v_amount,
    balance = balance + v_amount,
    updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for host: %', v_host_id;
  END IF;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    booking_id,
    balance_before,
    balance_after
  )
  SELECT 
    v_wallet_id,
    v_amount,
    'earnings_released',
    'Earnings released for booking ' || p_booking_id::TEXT,
    p_booking_id,
    v_balance_before,
    hw.balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.remove_admin_complete(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_role user_role;
  v_executor_is_super_admin boolean;
BEGIN
  -- Check if executor is super admin
  SELECT is_super_admin INTO v_executor_is_super_admin
  FROM admins
  WHERE id = auth.uid();

  IF v_executor_is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only super admins can remove administrators.';
  END IF;

  -- Determine new role for the user (host if they have cars, otherwise renter)
  IF EXISTS (SELECT 1 FROM cars WHERE owner_id = target_user_id) THEN
    v_new_role := 'host';
  ELSE
    v_new_role := 'renter';
  END IF;

  -- Update profiles table
  UPDATE profiles
  SET role = v_new_role
  WHERE id = target_user_id;

  -- Remove from admins table
  DELETE FROM admins
  WHERE id = target_user_id;
  
  -- Log the action
  PERFORM log_admin_activity(
    auth.uid(),
    'remove_admin',
    'admin',
    target_user_id::text,
    jsonb_build_object('removed_admin_id', target_user_id, 'new_role', v_new_role)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_conversation_message(p_conversation_id uuid, p_content text, p_message_type text DEFAULT 'text'::text, p_related_car_id uuid DEFAULT NULL::uuid, p_reply_to_message_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_message_id UUID;
    v_participant_exists BOOLEAN;
    -- REMOVED: v_result JSON (was unused)
BEGIN
    -- Get the authenticated user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Validate required parameters
    IF p_conversation_id IS NULL OR p_content IS NULL OR trim(p_content) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Missing required parameters: conversation_id and content'
        );
    END IF;
    
    -- Check if user is a participant in the conversation
    SELECT EXISTS(
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = p_conversation_id 
        AND user_id = v_user_id
    ) INTO v_participant_exists;
    
    IF NOT v_participant_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User is not a participant in this conversation'
        );
    END IF;
    
    -- Validate reply_to_message_id if provided
    IF p_reply_to_message_id IS NOT NULL THEN
        IF NOT EXISTS(
            SELECT 1 FROM conversation_messages 
            WHERE id = p_reply_to_message_id 
            AND conversation_id = p_conversation_id
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Reply message not found in this conversation'
            );
        END IF;
    END IF;
    
    -- Validate related_car_id if provided
    IF p_related_car_id IS NOT NULL THEN
        IF NOT EXISTS(SELECT 1 FROM cars WHERE id = p_related_car_id) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Related car not found'
            );
        END IF;
    END IF;
    
    -- Insert the message
    INSERT INTO conversation_messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        related_car_id,
        reply_to_message_id,
        metadata
    ) VALUES (
        p_conversation_id,
        v_user_id,
        p_content,
        p_message_type,
        p_related_car_id,
        p_reply_to_message_id,
        p_metadata
    ) RETURNING id INTO v_message_id;
    
    -- Update conversation's last_message_at
    UPDATE conversations 
    SET 
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_conversation_id;
    
    -- Return success with message details
    RETURN json_build_object(
        'success', true,
        'message_id', v_message_id,
        'conversation_id', p_conversation_id,
        'sender_id', v_user_id,
        'content', p_content,
        'message_type', p_message_type,
        'related_car_id', p_related_car_id,
        'reply_to_message_id', p_reply_to_message_id,
        'metadata', p_metadata,
        'created_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to send message: ' || SQLERRM
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_admin_role(target_user_id uuid, new_is_super_admin boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_profile_role user_role;
  v_executor_is_super_admin boolean;
BEGIN
  -- Check if executor is super admin
  SELECT is_super_admin INTO v_executor_is_super_admin
  FROM admins
  WHERE id = auth.uid();

  IF v_executor_is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only super admins can update administrator roles.';
  END IF;

  -- Determine new profile role
  IF new_is_super_admin THEN
    v_new_profile_role := 'super_admin';
  ELSE
    v_new_profile_role := 'admin';
  END IF;

  -- Update admins table
  UPDATE admins
  SET is_super_admin = new_is_super_admin
  WHERE id = target_user_id;

  -- Update profiles table
  UPDATE profiles
  SET role = v_new_profile_role
  WHERE id = target_user_id;

  -- Log the action
  PERFORM log_admin_activity(
    auth.uid(),
    'update_admin_role',
    'admin',
    target_user_id::text,
    jsonb_build_object('updated_admin_id', target_user_id, 'new_is_super_admin', new_is_super_admin)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_campaign_delivery_logs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations 
  SET 
    updated_at = NEW.created_at,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_handover_session_on_step_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  all_steps_completed BOOLEAN;
BEGIN
  -- Check if all steps are completed for this handover session
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO all_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = NEW.handover_session_id;
  
  -- Update handover session completion status if all steps are done
  IF all_steps_completed THEN
    UPDATE handover_sessions
    SET 
      handover_completed = TRUE,
      updated_at = NOW()
    WHERE id = NEW.handover_session_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_insurance_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_notification_preferences_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_campaign_audience(p_user_roles text[] DEFAULT NULL::text[], p_registration_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_registration_end timestamp with time zone DEFAULT NULL::timestamp with time zone, p_last_login_days integer DEFAULT NULL::integer, p_booking_count_min integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Count matching users
  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN bookings b ON p.id = b.renter_id
  WHERE 
    (p_user_roles IS NULL OR p.role::TEXT = ANY(p_user_roles))
    AND (p_registration_start IS NULL OR p.created_at >= p_registration_start)
    AND (p_registration_end IS NULL OR p.created_at <= p_registration_end)
    AND (p_last_login_days IS NULL OR u.last_sign_in_at >= NOW() - (p_last_login_days || ' days')::INTERVAL)
    AND (p_booking_count_min IS NULL OR (
      SELECT COUNT(*) FROM bookings WHERE renter_id = p.id
    ) >= p_booking_count_min);
  
  v_result := jsonb_build_object(
    'is_valid', v_count > 0,
    'estimated_recipients', v_count,
    'warnings', CASE WHEN v_count = 0 THEN ARRAY['No users match the criteria']::TEXT[] ELSE ARRAY[]::TEXT[] END
  );
  
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_conversation_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure direct conversations don't have duplicate participants
  IF NEW.type = 'direct' THEN
    -- Check if a direct conversation already exists between these users
    IF EXISTS (
      SELECT 1 FROM public.conversations c1
      JOIN public.conversation_participants cp1 ON c1.id = cp1.conversation_id
      JOIN public.conversation_participants cp2 ON c1.id = cp2.conversation_id
      WHERE c1.type = 'direct' 
      AND c1.id != NEW.id
      AND cp1.user_id = NEW.created_by
      AND cp2.user_id != NEW.created_by
      AND cp2.user_id IN (
        SELECT user_id FROM public.conversation_participants 
        WHERE conversation_id = NEW.id AND user_id != NEW.created_by
      )
    ) THEN
      RAISE EXCEPTION 'Direct conversation already exists between these users';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount numeric, p_payment_method text DEFAULT NULL::text, p_payment_reference text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host_id UUID := auth.uid();
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  -- Ensure wallet exists
  SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.host_wallets WHERE host_id = v_host_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.host_wallets (host_id)
    VALUES (v_host_id)
    RETURNING id, balance INTO v_wallet_id, v_balance_before;
  END IF;

  v_balance_after := v_balance_before + p_amount;

  -- Update wallet balance
  UPDATE public.host_wallets SET balance = v_balance_after, updated_at = now() WHERE id = v_wallet_id;

  -- Record transaction as credit
  INSERT INTO public.wallet_transactions (
    id, wallet_id, transaction_type, amount, balance_before, balance_after, description, metadata
  ) VALUES (
    gen_random_uuid(), v_wallet_id, 'credit', p_amount, v_balance_before, v_balance_after,
    COALESCE('Wallet top-up via ' || COALESCE(p_payment_method, 'unknown'), 'Wallet top-up'),
    jsonb_strip_nulls(jsonb_build_object('payment_method', p_payment_method, 'payment_reference', p_payment_reference))
  ) RETURNING id INTO v_tx_id;

  PERFORM public.log_audit_event(
    p_event_type := 'payment_refunded_admin',
    p_severity := 'low',
    p_actor_id := v_host_id,
    p_action_details := jsonb_build_object('action', 'wallet_topup', 'amount', p_amount, 'wallet_id', v_wallet_id)
  );

  RETURN json_build_object('success', true, 'wallet_id', v_wallet_id, 'balance', v_balance_after, 'transaction_id', v_tx_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.wallet_withdraw(p_amount numeric, p_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host_id UUID := auth.uid();
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.host_wallets WHERE host_id = v_host_id;
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'wallet_not_found');
  END IF;

  IF v_balance_before < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  v_balance_after := v_balance_before - p_amount;

  UPDATE public.host_wallets SET balance = v_balance_after, updated_at = now() WHERE id = v_wallet_id;

  -- Record transaction as debit/withdrawal
  INSERT INTO public.wallet_transactions (
    id, wallet_id, transaction_type, amount, balance_before, balance_after, description
  ) VALUES (
    gen_random_uuid(), v_wallet_id, 'withdrawal', p_amount, v_balance_before, v_balance_after,
    COALESCE(p_description, 'Wallet withdrawal')
  ) RETURNING id INTO v_tx_id;

  PERFORM public.log_audit_event(
    p_event_type := 'payment_refunded_admin',
    p_severity := 'low',
    p_actor_id := v_host_id,
    p_action_details := jsonb_build_object('action', 'wallet_withdraw', 'amount', p_amount, 'wallet_id', v_wallet_id)
  );

  RETURN json_build_object('success', true, 'wallet_id', v_wallet_id, 'balance', v_balance_after, 'transaction_id', v_tx_id);
END;
$function$
;

grant delete on table "archive"."messages_backup_20250930_093926" to "anon";

grant insert on table "archive"."messages_backup_20250930_093926" to "anon";

grant references on table "archive"."messages_backup_20250930_093926" to "anon";

grant select on table "archive"."messages_backup_20250930_093926" to "anon";

grant trigger on table "archive"."messages_backup_20250930_093926" to "anon";

grant truncate on table "archive"."messages_backup_20250930_093926" to "anon";

grant update on table "archive"."messages_backup_20250930_093926" to "anon";

grant delete on table "archive"."messages_backup_20250930_093926" to "authenticated";

grant insert on table "archive"."messages_backup_20250930_093926" to "authenticated";

grant references on table "archive"."messages_backup_20250930_093926" to "authenticated";

grant select on table "archive"."messages_backup_20250930_093926" to "authenticated";

grant trigger on table "archive"."messages_backup_20250930_093926" to "authenticated";

grant truncate on table "archive"."messages_backup_20250930_093926" to "authenticated";

grant update on table "archive"."messages_backup_20250930_093926" to "authenticated";

grant delete on table "archive"."messages_backup_20250930_093926" to "service_role";

grant insert on table "archive"."messages_backup_20250930_093926" to "service_role";

grant references on table "archive"."messages_backup_20250930_093926" to "service_role";

grant select on table "archive"."messages_backup_20250930_093926" to "service_role";

grant trigger on table "archive"."messages_backup_20250930_093926" to "service_role";

grant truncate on table "archive"."messages_backup_20250930_093926" to "service_role";

grant update on table "archive"."messages_backup_20250930_093926" to "service_role";

grant delete on table "archive"."notifications_backup" to "anon";

grant insert on table "archive"."notifications_backup" to "anon";

grant references on table "archive"."notifications_backup" to "anon";

grant select on table "archive"."notifications_backup" to "anon";

grant trigger on table "archive"."notifications_backup" to "anon";

grant truncate on table "archive"."notifications_backup" to "anon";

grant update on table "archive"."notifications_backup" to "anon";

grant delete on table "archive"."notifications_backup" to "authenticated";

grant insert on table "archive"."notifications_backup" to "authenticated";

grant references on table "archive"."notifications_backup" to "authenticated";

grant select on table "archive"."notifications_backup" to "authenticated";

grant trigger on table "archive"."notifications_backup" to "authenticated";

grant truncate on table "archive"."notifications_backup" to "authenticated";

grant update on table "archive"."notifications_backup" to "authenticated";

grant delete on table "archive"."notifications_backup" to "service_role";

grant insert on table "archive"."notifications_backup" to "service_role";

grant references on table "archive"."notifications_backup" to "service_role";

grant select on table "archive"."notifications_backup" to "service_role";

grant trigger on table "archive"."notifications_backup" to "service_role";

grant truncate on table "archive"."notifications_backup" to "service_role";

grant update on table "archive"."notifications_backup" to "service_role";

grant delete on table "public"."auth_tokens" to "anon";

grant insert on table "public"."auth_tokens" to "anon";

grant references on table "public"."auth_tokens" to "anon";

grant select on table "public"."auth_tokens" to "anon";

grant trigger on table "public"."auth_tokens" to "anon";

grant truncate on table "public"."auth_tokens" to "anon";

grant update on table "public"."auth_tokens" to "anon";

grant delete on table "public"."auth_tokens" to "authenticated";

grant insert on table "public"."auth_tokens" to "authenticated";

grant references on table "public"."auth_tokens" to "authenticated";

grant select on table "public"."auth_tokens" to "authenticated";

grant trigger on table "public"."auth_tokens" to "authenticated";

grant truncate on table "public"."auth_tokens" to "authenticated";

grant update on table "public"."auth_tokens" to "authenticated";

grant delete on table "public"."auth_tokens" to "service_role";

grant insert on table "public"."auth_tokens" to "service_role";

grant references on table "public"."auth_tokens" to "service_role";

grant select on table "public"."auth_tokens" to "service_role";

grant trigger on table "public"."auth_tokens" to "service_role";

grant truncate on table "public"."auth_tokens" to "service_role";

grant update on table "public"."auth_tokens" to "service_role";

grant delete on table "public"."locations" to "anon";

grant insert on table "public"."locations" to "anon";

grant references on table "public"."locations" to "anon";

grant select on table "public"."locations" to "anon";

grant trigger on table "public"."locations" to "anon";

grant truncate on table "public"."locations" to "anon";

grant update on table "public"."locations" to "anon";

grant delete on table "public"."locations" to "authenticated";

grant insert on table "public"."locations" to "authenticated";

grant references on table "public"."locations" to "authenticated";

grant select on table "public"."locations" to "authenticated";

grant trigger on table "public"."locations" to "authenticated";

grant truncate on table "public"."locations" to "authenticated";

grant update on table "public"."locations" to "authenticated";

grant delete on table "public"."locations" to "service_role";

grant insert on table "public"."locations" to "service_role";

grant references on table "public"."locations" to "service_role";

grant select on table "public"."locations" to "service_role";

grant trigger on table "public"."locations" to "service_role";

grant truncate on table "public"."locations" to "service_role";

grant update on table "public"."locations" to "service_role";

grant delete on table "public"."rate_limits" to "anon";

grant insert on table "public"."rate_limits" to "anon";

grant references on table "public"."rate_limits" to "anon";

grant select on table "public"."rate_limits" to "anon";

grant trigger on table "public"."rate_limits" to "anon";

grant truncate on table "public"."rate_limits" to "anon";

grant update on table "public"."rate_limits" to "anon";

grant delete on table "public"."rate_limits" to "authenticated";

grant insert on table "public"."rate_limits" to "authenticated";

grant references on table "public"."rate_limits" to "authenticated";

grant select on table "public"."rate_limits" to "authenticated";

grant trigger on table "public"."rate_limits" to "authenticated";

grant truncate on table "public"."rate_limits" to "authenticated";

grant update on table "public"."rate_limits" to "authenticated";

grant delete on table "public"."rate_limits" to "service_role";

grant insert on table "public"."rate_limits" to "service_role";

grant references on table "public"."rate_limits" to "service_role";

grant select on table "public"."rate_limits" to "service_role";

grant trigger on table "public"."rate_limits" to "service_role";

grant truncate on table "public"."rate_limits" to "service_role";

grant update on table "public"."rate_limits" to "service_role";

grant delete on table "public"."verification_bypass_logs" to "anon";

grant insert on table "public"."verification_bypass_logs" to "anon";

grant references on table "public"."verification_bypass_logs" to "anon";

grant select on table "public"."verification_bypass_logs" to "anon";

grant trigger on table "public"."verification_bypass_logs" to "anon";

grant truncate on table "public"."verification_bypass_logs" to "anon";

grant update on table "public"."verification_bypass_logs" to "anon";

grant delete on table "public"."verification_bypass_logs" to "authenticated";

grant insert on table "public"."verification_bypass_logs" to "authenticated";

grant references on table "public"."verification_bypass_logs" to "authenticated";

grant select on table "public"."verification_bypass_logs" to "authenticated";

grant trigger on table "public"."verification_bypass_logs" to "authenticated";

grant truncate on table "public"."verification_bypass_logs" to "authenticated";

grant update on table "public"."verification_bypass_logs" to "authenticated";

grant delete on table "public"."verification_bypass_logs" to "service_role";

grant insert on table "public"."verification_bypass_logs" to "service_role";

grant references on table "public"."verification_bypass_logs" to "service_role";

grant select on table "public"."verification_bypass_logs" to "service_role";

grant trigger on table "public"."verification_bypass_logs" to "service_role";

grant truncate on table "public"."verification_bypass_logs" to "service_role";

grant update on table "public"."verification_bypass_logs" to "service_role";

grant delete on table "public"."verification_bypass_sessions" to "anon";

grant insert on table "public"."verification_bypass_sessions" to "anon";

grant references on table "public"."verification_bypass_sessions" to "anon";

grant select on table "public"."verification_bypass_sessions" to "anon";

grant trigger on table "public"."verification_bypass_sessions" to "anon";

grant truncate on table "public"."verification_bypass_sessions" to "anon";

grant update on table "public"."verification_bypass_sessions" to "anon";

grant delete on table "public"."verification_bypass_sessions" to "authenticated";

grant insert on table "public"."verification_bypass_sessions" to "authenticated";

grant references on table "public"."verification_bypass_sessions" to "authenticated";

grant select on table "public"."verification_bypass_sessions" to "authenticated";

grant trigger on table "public"."verification_bypass_sessions" to "authenticated";

grant truncate on table "public"."verification_bypass_sessions" to "authenticated";

grant update on table "public"."verification_bypass_sessions" to "authenticated";

grant delete on table "public"."verification_bypass_sessions" to "service_role";

grant insert on table "public"."verification_bypass_sessions" to "service_role";

grant references on table "public"."verification_bypass_sessions" to "service_role";

grant select on table "public"."verification_bypass_sessions" to "service_role";

grant trigger on table "public"."verification_bypass_sessions" to "service_role";

grant truncate on table "public"."verification_bypass_sessions" to "service_role";

grant update on table "public"."verification_bypass_sessions" to "service_role";


  create policy "Admins can view all messages"
  on "archive"."messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Users can insert their own messages"
  on "archive"."messages"
  as permissive
  for insert
  to authenticated
with check ((sender_id = auth.uid()));



  create policy "Users can update their own messages"
  on "archive"."messages"
  as permissive
  for update
  to authenticated
using ((sender_id = auth.uid()))
with check ((sender_id = auth.uid()));



  create policy "Users can view their own messages"
  on "archive"."messages"
  as permissive
  for select
  to authenticated
using (((sender_id = auth.uid()) OR (receiver_id = auth.uid())));



  create policy "Users can create notifications"
  on "archive"."notifications_backup"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Users can update their own notifications"
  on "archive"."notifications_backup"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can view their own notifications"
  on "archive"."notifications_backup"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Admins can create activity logs"
  on "public"."admin_activity_logs"
  as permissive
  for insert
  to public
with check ((admin_id = auth.uid()));



  create policy "Admins can create their own sessions"
  on "public"."admin_sessions"
  as permissive
  for insert
  to public
with check ((admin_id = auth.uid()));



  create policy "Super admins can view audit logs"
  on "public"."audit_logs"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins a
  WHERE ((a.id = auth.uid()) AND (a.is_super_admin = true)))));



  create policy "Service role can manage auth tokens"
  on "public"."auth_tokens"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Users can view their own auth tokens"
  on "public"."auth_tokens"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Public can view published blog posts"
  on "public"."blog_posts"
  as permissive
  for select
  to public
using ((((status)::text = 'published'::text) AND (published_at <= now())));



  create policy "blog_posts_authenticated_delete_own"
  on "public"."blog_posts"
  as permissive
  for delete
  to authenticated
using (((author_email)::text = (auth.jwt() ->> 'email'::text)));



  create policy "blog_posts_authenticated_insert_own"
  on "public"."blog_posts"
  as permissive
  for insert
  to authenticated
with check (((author_email)::text = (auth.jwt() ->> 'email'::text)));



  create policy "blog_posts_authenticated_update_own"
  on "public"."blog_posts"
  as permissive
  for update
  to authenticated
using (((author_email)::text = (auth.jwt() ->> 'email'::text)))
with check (((author_email)::text = (auth.jwt() ->> 'email'::text)));



  create policy "blog_posts_author_select_own"
  on "public"."blog_posts"
  as permissive
  for select
  to authenticated
using (((author_email)::text = (auth.jwt() ->> 'email'::text)));



  create policy "blog_posts_published_select"
  on "public"."blog_posts"
  as permissive
  for select
  to public
using ((((status)::text = 'published'::text) AND (published_at IS NOT NULL) AND (published_at <= now())));



  create policy "Car owners can view bookings for their cars"
  on "public"."bookings"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = bookings.car_id) AND (cars.owner_id = auth.uid())))));



  create policy "Renters can create bookings"
  on "public"."bookings"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = renter_id));



  create policy "Renters can view their own bookings"
  on "public"."bookings"
  as permissive
  for select
  to authenticated
using ((renter_id = auth.uid()));



  create policy "Users can update bookings they are involved with"
  on "public"."bookings"
  as permissive
  for update
  to public
using (((auth.uid() = renter_id) OR (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = bookings.car_id) AND (cars.owner_id = auth.uid()))))));



  create policy "Users can add images to their own cars"
  on "public"."car_images"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = car_images.car_id) AND (cars.owner_id = auth.uid())))));



  create policy "Users can delete their own car images"
  on "public"."car_images"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = car_images.car_id) AND (cars.owner_id = auth.uid())))));



  create policy "Allow public read access to cars"
  on "public"."cars"
  as permissive
  for select
  to public
using (true);



  create policy "Car owners can update their car locations"
  on "public"."cars"
  as permissive
  for update
  to public
using ((auth.uid() = owner_id))
with check ((auth.uid() = owner_id));



  create policy "Cars are viewable by everyone"
  on "public"."cars"
  as permissive
  for select
  to public
using (true);



  create policy "Super admins can update any car"
  on "public"."cars"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE ((admins.id = auth.uid()) AND (admins.is_super_admin = true)))));



  create policy "Users can create their own car listings"
  on "public"."cars"
  as permissive
  for insert
  to public
with check ((auth.uid() = owner_id));



  create policy "Users can delete their own car listings"
  on "public"."cars"
  as permissive
  for delete
  to public
using ((auth.uid() = owner_id));



  create policy "Users can update their own car listings"
  on "public"."cars"
  as permissive
  for update
  to public
using ((auth.uid() = owner_id));



  create policy "Commission rates are viewable by authenticated users"
  on "public"."commission_rates"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can manage their own device tokens"
  on "public"."device_tokens"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Authenticated users can read email analytics"
  on "public"."email_analytics_daily"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Service role can manage email analytics"
  on "public"."email_analytics_daily"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Service role can manage email delivery logs"
  on "public"."email_delivery_logs"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Service role can manage email performance metrics"
  on "public"."email_performance_metrics"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Service role can manage email suppressions"
  on "public"."email_suppressions"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Service role can manage webhook events"
  on "public"."email_webhook_events"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Users can access file encryption data for their messages"
  on "public"."file_encryption"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.conversation_messages cm
     JOIN public.conversation_participants cp ON ((cm.conversation_id = cp.conversation_id)))
  WHERE ((cm.id = file_encryption.message_id) AND (cp.user_id = auth.uid())))));



  create policy "Allow hosts and renters to create handover sessions"
  on "public"."handover_sessions"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = host_id) OR (auth.uid() = renter_id)));



  create policy "Hosts can update their own wallet"
  on "public"."host_wallets"
  as permissive
  for update
  to public
using ((host_id = auth.uid()));



  create policy "Hosts can view their own wallet"
  on "public"."host_wallets"
  as permissive
  for select
  to public
using ((host_id = auth.uid()));



  create policy "Users can create their own wallet"
  on "public"."host_wallets"
  as permissive
  for insert
  to public
with check ((auth.uid() = host_id));



  create policy "Users can manage their own identity keys"
  on "public"."identity_keys"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Users can read all identity keys"
  on "public"."identity_keys"
  as permissive
  for select
  to public
using (true);



  create policy "Users can manage their own location data"
  on "public"."locations"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Enable read access for all users"
  on "public"."notifications"
  as permissive
  for select
  to public
using (true);



  create policy "Hosts can view host-only notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (role_target = 'host_only'::public.notification_role) AND (((related_car_id IS NOT NULL) AND (auth.uid() = ( SELECT cars.owner_id
   FROM public.cars
  WHERE (cars.id = notifications.related_car_id)))) OR ((related_booking_id IS NOT NULL) AND (auth.uid() = ( SELECT c.owner_id
   FROM (public.cars c
     JOIN public.bookings b ON ((c.id = b.car_id)))
  WHERE (b.id = notifications.related_booking_id)))) OR ((related_car_id IS NULL) AND (related_booking_id IS NULL)))));



  create policy "Renters can view renter-only notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (role_target = 'renter_only'::public.notification_role) AND (((related_booking_id IS NOT NULL) AND (auth.uid() = ( SELECT bookings.renter_id
   FROM public.bookings
  WHERE (bookings.id = notifications.related_booking_id)))) OR (related_booking_id IS NULL))));



  create policy "Service role can create notifications"
  on "public"."notifications"
  as permissive
  for insert
  to service_role
with check (true);



  create policy "Service role can manage all notifications"
  on "public"."notifications"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "System can insert notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can delete own notifications"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can mark own notifications as read"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((is_read = true));



  create policy "Users can update their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view system-wide notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (role_target = 'system_wide'::public.notification_role)));



  create policy "Users can view their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can manage their own pre-keys"
  on "public"."pre_keys"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Users can read unused pre-keys"
  on "public"."pre_keys"
  as permissive
  for select
  to public
using ((is_used = false));



  create policy "Service role can manage all profiles"
  on "public"."profiles"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "profiles_own_read"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((id = auth.uid()));



  create policy "profiles_read_all"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Authenticated users can read provider health"
  on "public"."provider_health_metrics"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Service role can manage provider health metrics"
  on "public"."provider_health_metrics"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Service role can manage rate limits"
  on "public"."rate_limits"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Booking participants can view locations"
  on "public"."real_time_locations"
  as permissive
  for select
  to public
using (((host_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.cars c ON ((c.id = b.car_id)))
  WHERE ((b.status = 'confirmed'::public.booking_status) AND (((b.renter_id = auth.uid()) AND (c.owner_id = real_time_locations.host_id)) OR ((c.owner_id = auth.uid()) AND (real_time_locations.host_id = auth.uid()))))))));



  create policy "Reviews are viewable by everyone"
  on "public"."reviews"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create reviews"
  on "public"."reviews"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.bookings
  WHERE ((bookings.id = reviews.booking_id) AND (bookings.status = 'completed'::public.booking_status) AND (((bookings.renter_id = auth.uid()) AND (reviews.reviewer_id = auth.uid())) OR (EXISTS ( SELECT 1
           FROM public.cars
          WHERE ((cars.id = bookings.car_id) AND (cars.owner_id = auth.uid()) AND (reviews.reviewer_id = auth.uid())))))))));



  create policy "Users can delete their own reviews"
  on "public"."reviews"
  as permissive
  for delete
  to public
using ((reviewer_id = auth.uid()));



  create policy "Users can update their own reviews"
  on "public"."reviews"
  as permissive
  for update
  to public
using ((reviewer_id = auth.uid()));



  create policy "Users can save cars"
  on "public"."saved_cars"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can unsave cars"
  on "public"."saved_cars"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can manage their own sessions"
  on "public"."signal_sessions"
  as permissive
  for all
  to public
using (((user_id = auth.uid()) OR (contact_user_id = auth.uid())));



  create policy "Users can manage their own public key"
  on "public"."user_public_keys"
  as permissive
  for all
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can read all public keys"
  on "public"."user_public_keys"
  as permissive
  for select
  to authenticated
using (true);



  create policy "System can insert bypass logs"
  on "public"."verification_bypass_logs"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view own bypass logs"
  on "public"."verification_bypass_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can create bypass sessions"
  on "public"."verification_bypass_sessions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own bypass sessions"
  on "public"."verification_bypass_sessions"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own bypass sessions"
  on "public"."verification_bypass_sessions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Hosts can view their own transactions"
  on "public"."wallet_transactions"
  as permissive
  for select
  to public
using ((wallet_id IN ( SELECT host_wallets.id
   FROM public.host_wallets
  WHERE (host_wallets.host_id = auth.uid()))));



  create policy "Users can create wallet transactions"
  on "public"."wallet_transactions"
  as permissive
  for insert
  to public
with check ((wallet_id IN ( SELECT host_wallets.id
   FROM public.host_wallets
  WHERE (host_wallets.host_id = auth.uid()))));



  create policy "Users can view their wallet transactions"
  on "public"."wallet_transactions"
  as permissive
  for select
  to public
using ((wallet_id IN ( SELECT host_wallets.id
   FROM public.host_wallets
  WHERE (host_wallets.host_id = auth.uid()))));



  create policy "Admins can view their own activity logs"
  on "public"."admin_activity_logs"
  as permissive
  for select
  to public
using ((admin_id = auth.uid()));



  create policy "Super admins can view all activity logs"
  on "public"."admin_activity_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE ((admins.id = auth.uid()) AND (admins.is_super_admin = true)))));



  create policy "Super admins can manage all capabilities"
  on "public"."admin_capabilities"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE ((admins.id = auth.uid()) AND (admins.is_super_admin = true)))));



  create policy "Super admins manage capabilities"
  on "public"."admin_capabilities"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins a
  WHERE ((a.id = auth.uid()) AND (a.is_super_admin = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.admins a
  WHERE ((a.id = auth.uid()) AND (a.is_super_admin = true)))));



  create policy "Admins can update their own sessions"
  on "public"."admin_sessions"
  as permissive
  for update
  to public
using ((admin_id = auth.uid()));



  create policy "Admins can view their own sessions"
  on "public"."admin_sessions"
  as permissive
  for select
  to public
using ((admin_id = auth.uid()));



  create policy "Super admins can view all sessions"
  on "public"."admin_sessions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE ((admins.id = auth.uid()) AND (admins.is_super_admin = true)))));



  create policy "Hosts can update bookings for their cars"
  on "public"."bookings"
  as permissive
  for update
  to public
using ((auth.uid() = ( SELECT cars.owner_id
   FROM public.cars
  WHERE (cars.id = bookings.car_id))));



  create policy "Hosts can view bookings for their cars"
  on "public"."bookings"
  as permissive
  for select
  to public
using ((auth.uid() = ( SELECT cars.owner_id
   FROM public.cars
  WHERE (cars.id = bookings.car_id))));



  create policy "campaign_delivery_logs_admin_all"
  on "public"."campaign_delivery_logs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));



  create policy "Owners can manage blocked dates"
  on "public"."car_blocked_dates"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = car_blocked_dates.car_id) AND (cars.owner_id = auth.uid())))));



  create policy "Admins can view all car images"
  on "public"."car_images"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Car images are viewable by everyone"
  on "public"."car_images"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Car owners or admins can delete their car images"
  on "public"."car_images"
  as permissive
  for delete
  to public
using ((public.is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = car_images.car_id) AND (cars.owner_id = auth.uid()))))));



  create policy "Car owners or admins can insert their car images"
  on "public"."car_images"
  as permissive
  for insert
  to public
with check ((public.is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = car_images.car_id) AND (cars.owner_id = auth.uid()))))));



  create policy "Car owners or admins can update their car images"
  on "public"."car_images"
  as permissive
  for update
  to public
using ((public.is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = car_images.car_id) AND (cars.owner_id = auth.uid()))))));



  create policy "Admins can update all cars"
  on "public"."cars"
  as permissive
  for update
  to public
using (public.is_admin(auth.uid()));



  create policy "Only admins can insert commission rates"
  on "public"."commission_rates"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Only admins can update commission rates"
  on "public"."commission_rates"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Users can insert messages in their conversations"
  on "public"."conversation_messages"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = conversation_messages.conversation_id) AND (conversation_participants.user_id = auth.uid())))));



  create policy "Users can view messages in their conversations"
  on "public"."conversation_messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = conversation_messages.conversation_id) AND (conversation_participants.user_id = auth.uid())))));



  create policy "conversation_messages_insert_policy"
  on "public"."conversation_messages"
  as permissive
  for insert
  to public
with check (((sender_id = auth.uid()) AND public.is_conversation_participant(conversation_id)));



  create policy "conversation_messages_select_policy"
  on "public"."conversation_messages"
  as permissive
  for select
  to public
using (((sender_id = auth.uid()) OR public.is_conversation_participant(conversation_id) OR public.is_admin(auth.uid())));



  create policy "conversation_participants_select_policy"
  on "public"."conversation_participants"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR public.is_conversation_participant(conversation_id) OR public.is_admin(auth.uid())));



  create policy "conversation_participants_update_policy"
  on "public"."conversation_participants"
  as permissive
  for update
  to public
using (((user_id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "view_conversation_peers"
  on "public"."conversation_participants"
  as permissive
  for select
  to authenticated
using (public.is_participant(conversation_id));



  create policy "conversations_select_policy"
  on "public"."conversations"
  as permissive
  for select
  to public
using (((created_by = auth.uid()) OR public.is_conversation_participant(id) OR public.is_admin(auth.uid())));



  create policy "view_conversations_as_participant"
  on "public"."conversations"
  as permissive
  for select
  to authenticated
using (public.is_participant(id));



  create policy "Users can create handover sessions for their bookings"
  on "public"."handover_sessions"
  as permissive
  for insert
  to public
with check ((auth.uid() IN ( SELECT bookings.renter_id
   FROM public.bookings
  WHERE (bookings.id = handover_sessions.booking_id)
UNION
 SELECT profiles.id
   FROM ((public.profiles
     JOIN public.cars ON ((profiles.id = cars.owner_id)))
     JOIN public.bookings ON ((cars.id = bookings.car_id)))
  WHERE (bookings.id = handover_sessions.booking_id))));



  create policy "Users can update their own handover sessions"
  on "public"."handover_sessions"
  as permissive
  for update
  to public
using ((auth.uid() IN ( SELECT bookings.renter_id
   FROM public.bookings
  WHERE (bookings.id = handover_sessions.booking_id)
UNION
 SELECT profiles.id
   FROM ((public.profiles
     JOIN public.cars ON ((profiles.id = cars.owner_id)))
     JOIN public.bookings ON ((cars.id = bookings.car_id)))
  WHERE (bookings.id = handover_sessions.booking_id))));



  create policy "Users can view their own handover sessions"
  on "public"."handover_sessions"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT bookings.renter_id
   FROM public.bookings
  WHERE (bookings.id = handover_sessions.booking_id)
UNION
 SELECT profiles.id
   FROM ((public.profiles
     JOIN public.cars ON ((profiles.id = cars.owner_id)))
     JOIN public.bookings ON ((cars.id = bookings.car_id)))
  WHERE (bookings.id = handover_sessions.booking_id))));



  create policy "Users can create handover steps for their sessions"
  on "public"."handover_step_completion"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.handover_sessions
  WHERE ((handover_sessions.id = handover_step_completion.handover_session_id) AND (auth.uid() IN ( SELECT bookings.renter_id
           FROM public.bookings
          WHERE (bookings.id = handover_sessions.booking_id)
        UNION
         SELECT profiles.id
           FROM ((public.profiles
             JOIN public.cars ON ((profiles.id = cars.owner_id)))
             JOIN public.bookings ON ((cars.id = bookings.car_id)))
          WHERE (bookings.id = handover_sessions.booking_id)))))));



  create policy "Users can manage handover steps for their sessions"
  on "public"."handover_step_completion"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.handover_sessions hs
  WHERE ((hs.id = handover_step_completion.handover_session_id) AND ((hs.host_id = auth.uid()) OR (hs.renter_id = auth.uid()))))));



  create policy "Users can update handover steps for their sessions"
  on "public"."handover_step_completion"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.handover_sessions
  WHERE ((handover_sessions.id = handover_step_completion.handover_session_id) AND (auth.uid() IN ( SELECT bookings.renter_id
           FROM public.bookings
          WHERE (bookings.id = handover_sessions.booking_id)
        UNION
         SELECT profiles.id
           FROM ((public.profiles
             JOIN public.cars ON ((profiles.id = cars.owner_id)))
             JOIN public.bookings ON ((cars.id = bookings.car_id)))
          WHERE (bookings.id = handover_sessions.booking_id)))))));



  create policy "Users can view handover steps for their sessions"
  on "public"."handover_step_completion"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.handover_sessions
  WHERE ((handover_sessions.id = handover_step_completion.handover_session_id) AND (auth.uid() IN ( SELECT bookings.renter_id
           FROM public.bookings
          WHERE (bookings.id = handover_sessions.booking_id)
        UNION
         SELECT profiles.id
           FROM ((public.profiles
             JOIN public.cars ON ((profiles.id = cars.owner_id)))
             JOIN public.bookings ON ((cars.id = bookings.car_id)))
          WHERE (bookings.id = handover_sessions.booking_id)))))));



  create policy "Users can create identity checks for their handovers"
  on "public"."identity_verification_checks"
  as permissive
  for insert
  to public
with check (((EXISTS ( SELECT 1
   FROM public.handover_sessions hs
  WHERE ((hs.id = identity_verification_checks.handover_session_id) AND ((hs.host_id = auth.uid()) OR (hs.renter_id = auth.uid()))))) AND (verifier_id = auth.uid())));



  create policy "Users can create identity verification checks for their handove"
  on "public"."identity_verification_checks"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.handover_sessions
  WHERE ((handover_sessions.id = identity_verification_checks.handover_session_id) AND (auth.uid() IN ( SELECT bookings.renter_id
           FROM public.bookings
          WHERE (bookings.id = handover_sessions.booking_id)
        UNION
         SELECT profiles.id
           FROM ((public.profiles
             JOIN public.cars ON ((profiles.id = cars.owner_id)))
             JOIN public.bookings ON ((cars.id = bookings.car_id)))
          WHERE (bookings.id = handover_sessions.booking_id)))))));



  create policy "Users can update identity verification checks for their handove"
  on "public"."identity_verification_checks"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.handover_sessions
  WHERE ((handover_sessions.id = identity_verification_checks.handover_session_id) AND (auth.uid() IN ( SELECT bookings.renter_id
           FROM public.bookings
          WHERE (bookings.id = handover_sessions.booking_id)
        UNION
         SELECT profiles.id
           FROM ((public.profiles
             JOIN public.cars ON ((profiles.id = cars.owner_id)))
             JOIN public.bookings ON ((cars.id = bookings.car_id)))
          WHERE (bookings.id = handover_sessions.booking_id)))))));



  create policy "Users can view identity checks for their handovers"
  on "public"."identity_verification_checks"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.handover_sessions hs
  WHERE ((hs.id = identity_verification_checks.handover_session_id) AND ((hs.host_id = auth.uid()) OR (hs.renter_id = auth.uid()))))));



  create policy "Users can view identity verification checks for their handover "
  on "public"."identity_verification_checks"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.handover_sessions
  WHERE ((handover_sessions.id = identity_verification_checks.handover_session_id) AND (auth.uid() IN ( SELECT bookings.renter_id
           FROM public.bookings
          WHERE (bookings.id = handover_sessions.booking_id)
        UNION
         SELECT profiles.id
           FROM ((public.profiles
             JOIN public.cars ON ((profiles.id = cars.owner_id)))
             JOIN public.bookings ON ((cars.id = bookings.car_id)))
          WHERE (bookings.id = handover_sessions.booking_id)))))));



  create policy "Admins can view all claim activities"
  on "public"."insurance_claim_activities"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Users can view activities for their claims"
  on "public"."insurance_claim_activities"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.insurance_claims
  WHERE ((insurance_claims.id = insurance_claim_activities.claim_id) AND (insurance_claims.renter_id = auth.uid())))));



  create policy "Admins can manage all claims"
  on "public"."insurance_claims"
  as permissive
  for all
  to public
using (public.is_admin(auth.uid()));



  create policy "Admins can view all claims"
  on "public"."insurance_claims"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Car owners can view claims for their cars"
  on "public"."insurance_claims"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.cars c ON ((c.id = b.car_id)))
  WHERE ((b.id = insurance_claims.booking_id) AND (c.owner_id = auth.uid())))));



  create policy "Users can submit claims for their active policies"
  on "public"."insurance_claims"
  as permissive
  for insert
  to public
with check (((renter_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.insurance_policies
  WHERE ((insurance_policies.id = insurance_claims.policy_id) AND (insurance_policies.renter_id = auth.uid()) AND (insurance_policies.status = ANY (ARRAY['active'::text, 'expired'::text])))))));



  create policy "Only admins can manage insurance packages"
  on "public"."insurance_packages"
  as permissive
  for all
  to public
using (public.is_admin(auth.uid()));



  create policy "Admins can view all insurance policies"
  on "public"."insurance_policies"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Car owners can view policies for their cars"
  on "public"."insurance_policies"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.id = insurance_policies.car_id) AND (cars.owner_id = auth.uid())))));



  create policy "System can update policy status"
  on "public"."insurance_policies"
  as permissive
  for update
  to public
using (((renter_id = auth.uid()) OR public.is_admin(auth.uid())));



  create policy "Admins can update all license verifications"
  on "public"."license_verifications"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Admins can view all license verifications"
  on "public"."license_verifications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Users can insert their own license verification"
  on "public"."license_verifications"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Users can update their own license verification"
  on "public"."license_verifications"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can view their own license verification"
  on "public"."license_verifications"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can add reactions to messages they can see"
  on "public"."message_reactions"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM (public.conversation_messages cm
     JOIN public.conversation_participants cp ON ((cm.conversation_id = cp.conversation_id)))
  WHERE ((cm.id = message_reactions.message_id) AND (cp.user_id = auth.uid())))));



  create policy "Users can view reactions for messages they can see"
  on "public"."message_reactions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.conversation_messages cm
     JOIN public.conversation_participants cp ON ((cm.conversation_id = cp.conversation_id)))
  WHERE ((cm.id = message_reactions.message_id) AND (cp.user_id = auth.uid())))));



  create policy "Admins can manage campaigns"
  on "public"."notification_campaigns"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE ((admins.id = auth.uid()) AND ((admins.is_super_admin = true) OR (admins.id = notification_campaigns.created_by))))));



  create policy "admin_read_cleanup_log"
  on "public"."notification_cleanup_log"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));



  create policy "admin_manage_expiration_policies"
  on "public"."notification_expiration_policies"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));



  create policy "hosts_view_host_only_notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (role_target = 'host_only'::public.notification_role) AND (((related_car_id IS NOT NULL) AND (auth.uid() = ( SELECT cars.owner_id
   FROM public.cars
  WHERE (cars.id = notifications.related_car_id)))) OR ((related_booking_id IS NOT NULL) AND (auth.uid() = ( SELECT c.owner_id
   FROM (public.cars c
     JOIN public.bookings b ON ((c.id = b.car_id)))
  WHERE (b.id = notifications.related_booking_id)))) OR ((related_car_id IS NULL) AND (related_booking_id IS NULL)))));



  create policy "renters_view_renter_only_notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (role_target = 'renter_only'::public.notification_role) AND (((related_booking_id IS NOT NULL) AND (auth.uid() = ( SELECT bookings.renter_id
   FROM public.bookings
  WHERE (bookings.id = notifications.related_booking_id)))) OR (related_booking_id IS NULL))));



  create policy "users_view_system_wide_notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (role_target = 'system_wide'::public.notification_role)));



  create policy "Admins can manage payment config"
  on "public"."payment_config"
  as permissive
  for all
  to public
using (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))) OR (EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid())))));



  create policy "Admins can view all payment transactions"
  on "public"."payment_transactions"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))) OR (EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid())))));



  create policy "Admins can manage all phone verifications"
  on "public"."phone_verifications"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text])))));



  create policy "Admins can view all phone verifications"
  on "public"."phone_verifications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Admins can view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "profiles_own_delete"
  on "public"."profiles"
  as permissive
  for delete
  to public
using ((id = auth.uid()));



  create policy "profiles_own_insert"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((id = auth.uid()));



  create policy "profiles_own_update"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "profiles_public_car_owner_read"
  on "public"."profiles"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.owner_id = profiles.id) AND (cars.is_available = true)))));



  create policy "Admins can view all promo usage"
  on "public"."promo_code_usage"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::public.user_role) OR (profiles.role = 'super_admin'::public.user_role)))))));



  create policy "Admins can manage promo codes"
  on "public"."promo_codes"
  as permissive
  for all
  to public
using (((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::public.user_role) OR (profiles.role = 'super_admin'::public.user_role)))))));



  create policy "Public can view published car reviews"
  on "public"."reviews"
  as permissive
  for select
  to public
using ((((status IS NULL) OR (status = 'published'::text)) AND (review_type = 'car'::public.review_type)));



  create policy "Users can insert reviews for their bookings"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = reviews.booking_id) AND (b.renter_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.cars c ON ((b.car_id = c.id)))
  WHERE ((b.id = reviews.booking_id) AND (c.owner_id = auth.uid())))))));



  create policy "Users can view their own reviews and booking reviews"
  on "public"."reviews"
  as permissive
  for select
  to authenticated
using (((auth.uid() IS NOT NULL) AND ((reviewer_id = auth.uid()) OR (reviewee_id = auth.uid()) OR ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = reviews.booking_id) AND (b.renter_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.cars c ON ((b.car_id = c.id)))
  WHERE ((b.id = reviews.booking_id) AND (c.owner_id = auth.uid()))))))));



  create policy "Admins and super admins can create restrictions"
  on "public"."user_restrictions"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))) OR (EXISTS ( SELECT 1
   FROM public.admins a
  WHERE ((a.id = auth.uid()) AND (a.is_super_admin = true))))));



  create policy "Admins and super admins can update restrictions"
  on "public"."user_restrictions"
  as permissive
  for update
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))) OR (EXISTS ( SELECT 1
   FROM public.admins a
  WHERE ((a.id = auth.uid()) AND (a.is_super_admin = true))))));



  create policy "Admins and super admins can view all restrictions"
  on "public"."user_restrictions"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))) OR (EXISTS ( SELECT 1
   FROM public.admins a
  WHERE ((a.id = auth.uid()) AND (a.is_super_admin = true))))));



  create policy "Admins can manage all verifications"
  on "public"."user_verifications"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text])))));



  create policy "Admins can update all verifications"
  on "public"."user_verifications"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Admins can view all verifications"
  on "public"."user_verifications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Users can create condition reports for their handovers"
  on "public"."vehicle_condition_reports"
  as permissive
  for insert
  to public
with check (((EXISTS ( SELECT 1
   FROM public.handover_sessions hs
  WHERE ((hs.id = vehicle_condition_reports.handover_session_id) AND ((hs.host_id = auth.uid()) OR (hs.renter_id = auth.uid()))))) AND (reporter_id = auth.uid())));



  create policy "Users can create vehicle condition reports for their bookings"
  on "public"."vehicle_condition_reports"
  as permissive
  for insert
  to public
with check (((EXISTS ( SELECT 1
   FROM (public.bookings b
     LEFT JOIN public.cars c ON ((b.car_id = c.id)))
  WHERE ((b.id = vehicle_condition_reports.booking_id) AND ((b.renter_id = auth.uid()) OR (c.owner_id = auth.uid()))))) AND (reporter_id = auth.uid())));



  create policy "Users can update their own condition reports"
  on "public"."vehicle_condition_reports"
  as permissive
  for update
  to public
using ((reporter_id = auth.uid()));



  create policy "Users can view condition reports for their handovers"
  on "public"."vehicle_condition_reports"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.handover_sessions hs
  WHERE ((hs.id = vehicle_condition_reports.handover_session_id) AND ((hs.host_id = auth.uid()) OR (hs.renter_id = auth.uid()))))));



  create policy "Users can view vehicle condition reports for their bookings"
  on "public"."vehicle_condition_reports"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.bookings b
     LEFT JOIN public.cars c ON ((b.car_id = c.id)))
  WHERE ((b.id = vehicle_condition_reports.booking_id) AND ((b.renter_id = auth.uid()) OR (c.owner_id = auth.uid()))))));



  create policy "Admins can insert vehicle transfers"
  on "public"."vehicle_transfers"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));



  create policy "Admins can view vehicle transfers"
  on "public"."vehicle_transfers"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));



  create policy "Admins can manage all address verifications"
  on "public"."verification_address"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text])))));



  create policy "Admins can view all address verifications"
  on "public"."verification_address"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Users can create own address verification"
  on "public"."verification_address"
  as permissive
  for insert
  to public
with check ((auth.uid() IN ( SELECT uv.user_id
   FROM public.user_verifications uv
  WHERE (uv.id = verification_address.verification_id))));



  create policy "Users can delete own address verification"
  on "public"."verification_address"
  as permissive
  for delete
  to public
using ((auth.uid() IN ( SELECT uv.user_id
   FROM public.user_verifications uv
  WHERE (uv.id = verification_address.verification_id))));



  create policy "Users can update own address verification"
  on "public"."verification_address"
  as permissive
  for update
  to public
using ((auth.uid() IN ( SELECT uv.user_id
   FROM public.user_verifications uv
  WHERE (uv.id = verification_address.verification_id))))
with check ((auth.uid() IN ( SELECT uv.user_id
   FROM public.user_verifications uv
  WHERE (uv.id = verification_address.verification_id))));



  create policy "Users can view own address verification"
  on "public"."verification_address"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT uv.user_id
   FROM public.user_verifications uv
  WHERE (uv.id = verification_address.verification_id))));



  create policy "Admins can manage all documents"
  on "public"."verification_documents"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text])))));



  create policy "Admins can update all documents"
  on "public"."verification_documents"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));



  create policy "Admins can view all documents"
  on "public"."verification_documents"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid()))));


CREATE TRIGGER trigger_check_circular_reply BEFORE INSERT OR UPDATE ON archive.messages FOR EACH ROW EXECUTE FUNCTION public.check_circular_reply();

CREATE TRIGGER log_notification_trigger AFTER INSERT ON archive.notifications_backup FOR EACH ROW EXECUTE FUNCTION public.log_notification_creation();

CREATE TRIGGER update_auth_tokens_updated_at BEFORE UPDATE ON public.auth_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_check_circular_reply_conversation BEFORE INSERT OR UPDATE ON public.conversation_messages FOR EACH ROW EXECUTE FUNCTION public.check_circular_reply_conversation();

CREATE TRIGGER trigger_update_message_delivery_status BEFORE UPDATE ON public.conversation_messages FOR EACH ROW EXECUTE FUNCTION public.update_message_delivery_status();

CREATE TRIGGER update_conversation_timestamp_trigger AFTER INSERT ON public.conversation_messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

CREATE TRIGGER on_conversation_created AFTER INSERT ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.add_conversation_creator_as_participant();

CREATE TRIGGER update_email_analytics_daily_updated_at BEFORE UPDATE ON public.email_analytics_daily FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_delivery_logs_updated_at BEFORE UPDATE ON public.email_delivery_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_identity_keys_updated_at BEFORE UPDATE ON public.identity_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_cleanup_expired_notifications AFTER INSERT OR UPDATE ON public.notifications FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_expired_notifications();

CREATE TRIGGER update_provider_health_metrics_updated_at BEFORE UPDATE ON public.provider_health_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signal_sessions_updated_at BEFORE UPDATE ON public.signal_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_user_public_keys_updated_at BEFORE UPDATE ON public.user_public_keys FOR EACH ROW EXECUTE FUNCTION public.update_user_public_keys_updated_at();

CREATE TRIGGER trigger_log_bypass_session_creation AFTER INSERT ON public.verification_bypass_sessions FOR EACH ROW EXECUTE FUNCTION public.log_bypass_session_creation();

CREATE TRIGGER trigger_log_bypass_session_deactivation AFTER UPDATE ON public.verification_bypass_sessions FOR EACH ROW EXECUTE FUNCTION public.log_bypass_session_deactivation();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON archive.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER admin_changes_log AFTER INSERT OR DELETE OR UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.log_admin_changes();

CREATE TRIGGER audit_logs_immutable BEFORE DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

CREATE TRIGGER booking_status_change_trigger AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_booking_status_change();

CREATE TRIGGER trigger_handle_booking_status_change AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_booking_status_change();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_campaign_delivery_logs_updated_at BEFORE UPDATE ON public.campaign_delivery_logs FOR EACH ROW EXECUTE FUNCTION public.update_campaign_delivery_logs_updated_at();

CREATE TRIGGER update_car_images_updated_at BEFORE UPDATE ON public.car_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_validate_car_verification_status BEFORE INSERT OR UPDATE OF verification_status ON public.cars FOR EACH ROW EXECUTE FUNCTION public.validate_car_verification_status();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_rates_updated_at BEFORE UPDATE ON public.commission_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER message_notification_trigger AFTER INSERT ON public.conversation_messages FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();

CREATE TRIGGER ensure_conversation_integrity_trigger AFTER DELETE ON public.conversation_participants FOR EACH ROW EXECUTE FUNCTION public.ensure_conversation_integrity();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER validate_conversation_creation_trigger AFTER INSERT ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.validate_conversation_creation();

CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON public.device_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_handle_handover_completion AFTER UPDATE ON public.handover_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_handover_completion();

CREATE TRIGGER enforce_step_dependencies_trigger BEFORE UPDATE ON public.handover_step_completion FOR EACH ROW EXECUTE FUNCTION public.enforce_step_dependencies();

CREATE TRIGGER handover_step_completion_trigger AFTER UPDATE ON public.handover_step_completion FOR EACH ROW EXECUTE FUNCTION public.handle_handover_step_completion();

CREATE TRIGGER update_handover_session_trigger AFTER UPDATE ON public.handover_step_completion FOR EACH ROW EXECUTE FUNCTION public.update_handover_session_on_step_completion();

CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_insurance_updated_at();

CREATE TRIGGER update_insurance_packages_updated_at BEFORE UPDATE ON public.insurance_packages FOR EACH ROW EXECUTE FUNCTION public.update_insurance_updated_at();

CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON public.insurance_policies FOR EACH ROW EXECUTE FUNCTION public.update_insurance_updated_at();

CREATE TRIGGER update_license_verifications_updated_at BEFORE UPDATE ON public.license_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_notification_preferences_timestamp();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER cleanup_expired_confirmations_trigger AFTER INSERT ON public.pending_confirmations FOR EACH ROW EXECUTE FUNCTION public.trigger_cleanup_expired_confirmations();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_clean_expired_locations AFTER INSERT ON public.real_time_locations FOR EACH STATEMENT EXECUTE FUNCTION public.clean_expired_locations();

CREATE TRIGGER update_saved_cars_updated_at BEFORE UPDATE ON public.saved_cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_guide_progress_updated_at BEFORE UPDATE ON public.user_guide_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER handle_user_restrictions_updated_at BEFORE UPDATE ON public.user_restrictions FOR EACH ROW EXECUTE FUNCTION public.handle_user_restrictions_updated_at();

CREATE TRIGGER audit_user_roles_changes AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_user_role_changes();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_verification_status_change AFTER INSERT OR UPDATE OF overall_status ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification_status();

CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.update_verification_columns();

CREATE TRIGGER verification_completion_trigger BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.check_verification_completion();

CREATE TRIGGER verification_insert_trigger BEFORE INSERT ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.check_verification_completion();

CREATE TRIGGER update_verification_address_updated_at BEFORE UPDATE ON public.verification_address FOR EACH ROW EXECUTE FUNCTION public.update_verification_columns();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

drop policy "Avatar images are publicly accessible" on "storage"."objects";

drop policy "Car owners can manage car images" on "storage"."objects";

drop policy "Users can update their own avatar" on "storage"."objects";

drop policy "Users can upload their own avatar" on "storage"."objects";

drop policy "storage_user_insert" on "storage"."objects";

drop policy "storage_user_select" on "storage"."objects";

drop policy "storage_user_update" on "storage"."objects";

drop policy "Admins can access all insurance documents" on "storage"."objects";

drop policy "storage_admin_read_final" on "storage"."objects";


  create policy "Anyone can upload an avatar"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'avatars'::text));



  create policy "Anyone can view avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Anyone can view car images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'car-images'::text));



  create policy "Anyone can view profile images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profile-images'::text));



  create policy "Authenticated admins can upload blog images"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((((bucket_id = 'blog-images'::text) AND ((auth.jwt() ->> 'email'::text) ~~ '%@mobirides.com'::text)) OR ((auth.jwt() ->> 'email'::text) = 'admin@mobirides.com'::text)));



  create policy "Car owners can delete their car images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'car-images'::text) AND (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.owner_id = auth.uid()) AND ((cars.id)::text = (storage.foldername(objects.name))[1]))))));



  create policy "Car owners can update their car images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'car-images'::text) AND (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.owner_id = auth.uid()) AND ((cars.id)::text = (storage.foldername(objects.name))[1]))))))
with check (((bucket_id = 'car-images'::text) AND (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.owner_id = auth.uid()) AND ((cars.id)::text = (storage.foldername(objects.name))[1]))))));



  create policy "Car owners can upload car images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'car-images'::text) AND (EXISTS ( SELECT 1
   FROM public.cars
  WHERE ((cars.owner_id = auth.uid()) AND ((cars.id)::text = (storage.foldername(objects.name))[1]))))));



  create policy "Public can read blog images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'blog-images'::text));



  create policy "Users can delete their car images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'car-images'::text));



  create policy "Users can delete their handover photos"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'handover-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete their own license verification documents"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'license_verifications'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can delete their own message attachments"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'message-attachments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete their own profile images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'profile-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can manage their verification files"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = ANY (ARRAY['verification-documents'::text, 'verification-selfies'::text, 'verification-temp'::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = ANY (ARRAY['verification-documents'::text, 'verification-selfies'::text, 'verification-temp'::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their car images"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'car-images'::text));



  create policy "Users can update their handover photos"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'handover-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their own license verification documents"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'license_verifications'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own profile images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'profile-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])))
with check (((bucket_id = 'profile-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their verification files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = ANY (ARRAY['verification-documents'::text, 'verification-selfies'::text, 'verification-temp'::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload car images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'car-images'::text));



  create policy "Users can upload handover photos"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'handover-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own license verification documents"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'license_verifications'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload their own message attachments"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'message-attachments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own profile images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their verification files"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = ANY (ARRAY['verification-documents'::text, 'verification-selfies'::text, 'verification-temp'::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can view handover photos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'handover-photos'::text));



  create policy "Users can view message attachments they have access to"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'message-attachments'::text) AND (((auth.uid())::text = (storage.foldername(name))[1]) OR (EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE (cp.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM archive.messages m
  WHERE ((m.sender_id = auth.uid()) OR (m.receiver_id = auth.uid())))))));



  create policy "Users can view their own license verification documents"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'license_verifications'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "blog_images_authenticated_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'blog-images'::text));



  create policy "blog_images_authenticated_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'blog-images'::text));



  create policy "blog_images_authenticated_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'blog-images'::text))
with check ((bucket_id = 'blog-images'::text));



  create policy "blog_images_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'blog-images'::text));



  create policy "verification-documents_users_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'verification-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-documents_users_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'verification-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-documents_users_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'verification-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])))
with check (((bucket_id = 'verification-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-selfies_users_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'verification-selfies'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-selfies_users_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'verification-selfies'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-selfies_users_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'verification-selfies'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])))
with check (((bucket_id = 'verification-selfies'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-temp_users_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'verification-temp'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-temp_users_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'verification-temp'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "verification-temp_users_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'verification-temp'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])))
with check (((bucket_id = 'verification-temp'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Admins can access all insurance documents"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((((bucket_id = 'insurance-policies'::text) OR (bucket_id = 'insurance-claims'::text)) AND public.is_admin(auth.uid())));



  create policy "storage_admin_read_final"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = ANY (ARRAY['verification-documents'::text, 'verification-selfies'::text, 'verification-temp'::text])) AND (EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = auth.uid())))));



