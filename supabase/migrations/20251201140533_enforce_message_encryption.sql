-- MOBI-502-4: Enforce message encryption foundation (functions and extension)

-- Enable pgcrypto for encryption primitives
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper to retrieve symmetric encryption key from GUC (set externally)
CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  k text;
BEGIN
  k := current_setting('app.encryption_key', true);
  IF k IS NULL OR k = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key.';
  END IF;
  RETURN k;
END;
$$;

-- Encrypt plain text to bytea using pgp_sym_encrypt
CREATE OR REPLACE FUNCTION public.encrypt_message_content(p_text text)
RETURNS bytea
LANGUAGE sql
STABLE
AS $$
SELECT pgp_sym_encrypt(p_text, public.get_encryption_key())
$$;

-- Decrypt bytea to text
CREATE OR REPLACE FUNCTION public.decrypt_message_content(p_cipher bytea)
RETURNS text
LANGUAGE sql
STABLE
AS $$
SELECT pgp_sym_decrypt(p_cipher, public.get_encryption_key())
$$;

-- Note: Application paths should migrate to RPC that stores encrypted content.
-- Schema changes to add encrypted columns will be introduced in a follow-up controlled rollout.

