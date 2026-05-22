import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Use a ref so fetchSettings can always access the latest setter without
  // being listed as a dependency and causing infinite re-renders.
  const settingsRef = useRef<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase.rpc('get_platform_settings');

      if (fetchError) throw fetchError;

      const settingsMap: Record<string, string> = {};
      if (data && Array.isArray(data)) {
        data.forEach((item) => {
          settingsMap[item.setting_key] = item.setting_value;
        });
      }
      settingsRef.current = settingsMap;
      setSettings(settingsMap);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Stable reference — does not change between renders.
  const getSetting = useCallback(<T>(key: string, defaultValue: T): T => {
    const value = settingsRef.current[key];
    return value !== undefined ? (value as T) : defaultValue;
  }, []);

  const updateSetting = useCallback(async (key: string, value: any) => {
    try {
      const { error: updateError } = await supabase.rpc('update_platform_setting', {
        p_key: key,
        p_value: String(value),
      });
      if (updateError) throw updateError;
      await fetchSettings();
      return { success: true };
    } catch (err) {
      console.error('Failed to update setting:', err);
      return { success: false, error: err };
    }
  }, [fetchSettings]);

  return { settings, getSetting, updateSetting, loading, error, refresh: fetchSettings };
};
