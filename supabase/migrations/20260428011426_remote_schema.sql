alter table "public"."conversation_messages" drop constraint "conversation_messages_message_type_check";

alter table "public"."conversation_messages" add constraint "conversation_messages_message_type_check" CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'video'::character varying, 'audio'::character varying, 'file'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."conversation_messages" validate constraint "conversation_messages_message_type_check";


