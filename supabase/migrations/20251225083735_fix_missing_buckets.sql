-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
(
  'insurance-policies',
  'insurance-policies',
  true, -- Public (for direct downloads)
  5242880, -- 5MB max
  ARRAY['application/pdf']
),
(
  'insurance-claims',
  'insurance-claims',
  false, -- Private
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
