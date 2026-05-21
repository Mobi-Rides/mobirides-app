-- Update the support email address in public.platform_settings to hello@mobirides.africa
UPDATE public.platform_settings
SET setting_value = 'hello@mobirides.africa'
WHERE setting_key = 'support_email';
