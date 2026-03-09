import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ConsentState {
  ageConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  communityAccepted: boolean;
  marketingOptedIn: boolean;
}

interface SignUpConsentsProps {
  consents: ConsentState;
  onChange: (consents: ConsentState) => void;
}

const requiredConsents: { key: keyof ConsentState; label: React.ReactNode }[] = [
  {
    key: "ageConfirmed",
    label: "I confirm I am 18 years or older",
  },
  {
    key: "termsAccepted",
    label: (
      <>
        I agree to the{" "}
        <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
          Terms of Service
        </a>
      </>
    ),
  },
  {
    key: "privacyAccepted",
    label: (
      <>
        I agree to the{" "}
        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
          Privacy Policy
        </a>
      </>
    ),
  },
  {
    key: "communityAccepted",
    label: (
      <>
        I agree to the{" "}
        <a href="/community-guidelines" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
          Community Guidelines
        </a>
      </>
    ),
  },
];

export const allRequiredConsentsChecked = (consents: ConsentState): boolean =>
  consents.ageConfirmed && consents.termsAccepted && consents.privacyAccepted && consents.communityAccepted;

export const SignUpConsents: React.FC<SignUpConsentsProps> = ({ consents, onChange }) => {
  const toggle = (key: keyof ConsentState) => {
    onChange({ ...consents, [key]: !consents[key] });
  };

  return (
    <div className="space-y-3 pt-2">
      {requiredConsents.map(({ key, label }) => (
        <div key={key} className="flex items-start gap-2">
          <Checkbox
            id={`consent-${key}`}
            checked={consents[key]}
            onCheckedChange={() => toggle(key)}
          />
          <Label htmlFor={`consent-${key}`} className="text-sm leading-tight cursor-pointer">
            {label}
          </Label>
        </div>
      ))}

      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="consent-marketing"
          checked={consents.marketingOptedIn}
          onCheckedChange={() => toggle("marketingOptedIn")}
        />
        <Label htmlFor="consent-marketing" className="text-sm leading-tight text-muted-foreground cursor-pointer">
          Send me updates and promotions (optional)
        </Label>
      </div>
    </div>
  );
};
