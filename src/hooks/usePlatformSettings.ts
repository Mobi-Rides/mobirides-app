import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase.rpc('get_platform_settings');
      
      if (fetchError) throw fetchError;
      
      const settingsMap: Record<string, any> = {};
      if (data) {
        data.forEach((item: any) => {
          settingsMap[item.setting_key] = item.setting_value;
        });
      }
      setSettings(settingsMap);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getSetting = <T>(key: string, defaultValue: T): T => {
    if (settings[key] !== undefined) {
      return settings[key] as T;
    }
    return defaultValue;
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error: updateError } = await supabase.rpc('update_platform_setting', {
        p_key: key,
        p_value: value
      });
      if (updateError) throw updateError;
      await fetchSettings();
      return { success: true };
    } catch (err) {
      console.error("Failed to update setting:", err);
      return { success: false, error: err };
    }
  };

  return { settings, getSetting, updateSetting, loading, error, refresh: fetchSettings };
};
