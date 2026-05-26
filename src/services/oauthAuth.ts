import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import type { Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SocialOAuthProvider = Extract<Provider, "google" | "facebook">;

const NATIVE_REDIRECT_URL = "com.mobirides.app://auth/callback";

export const getOAuthRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return NATIVE_REDIRECT_URL;
  }

  return `${window.location.origin}/auth/callback`;
};

export const signInWithSocialProvider = async (provider: SocialOAuthProvider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthRedirectUrl(),
      skipBrowserRedirect: Capacitor.isNativePlatform(),
    },
  });

  if (error) {
    throw error;
  }

  if (Capacitor.isNativePlatform()) {
    if (!data.url) {
      throw new Error("Unable to start social sign-in. Please try again.");
    }

    await Browser.open({ url: data.url });
  }
};
