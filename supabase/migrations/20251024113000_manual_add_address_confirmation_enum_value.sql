-- Manual migration: Add 'ADDRESS_CONFIRMATION' to verification_step enum
-- Only run this if the value does NOT already exist!

ALTER TYPE verification_step ADD VALUE 'ADDRESS_CONFIRMATION';
