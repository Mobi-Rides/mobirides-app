import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "mobirides_cookie_consent";

export const CookieConsentBanner: React.FC = () => {
  // Cookie consent is a web/browser concern — not required in native apps
  if (Capacitor.isNativePlatform()) return null;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = (type: "all" | "essential") => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ type, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-foreground">
          <p>
            We use cookies to enhance your experience. By continuing to use MobiRides, you agree to our use of cookies.{" "}
            <a href="/privacy-policy" className="text-primary underline hover:text-primary/80">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => accept("essential")}>
            Essential Only
          </Button>
          <Button size="sm" onClick={() => accept("all")}>
            Accept All
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => accept("essential")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
