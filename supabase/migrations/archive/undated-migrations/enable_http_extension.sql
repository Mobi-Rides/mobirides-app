-- Enable http extension for making HTTP requests from database functions
-- This is required for sending emails from database triggers

CREATE EXTENSION IF NOT EXISTS http;

-- Grant usage permissions
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT USAGE ON SCHEMA extensions TO authenticated;

-- Add comment
COMMENT ON EXTENSION http IS 'HTTP client extension for making HTTP requests from database functions';