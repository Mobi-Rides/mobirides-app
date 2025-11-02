-- Migration: Add 'ADDRESS_CONFIRMATION' to verification_step enum if missing
-- Date: 2025-10-24

ALTER TYPE verification_step ADD VALUE IF NOT EXISTS 'ADDRESS_CONFIRMATION';
