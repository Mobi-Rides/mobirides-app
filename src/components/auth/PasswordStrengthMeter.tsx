import React, { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

const requirements = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const passed = useMemo(() => requirements.filter((r) => r.test(password)).length, [password]);

  const strength = passed <= 1 ? "Weak" : passed <= 2 ? "Fair" : passed <= 3 ? "Medium" : "Strong";

  const barColor =
    passed <= 1
      ? "bg-destructive"
      : passed <= 2
        ? "bg-orange-500"
        : passed <= 3
          ? "bg-yellow-500"
          : "bg-green-500";

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barColor)}
            style={{ width: `${(passed / requirements.length) * 100}%` }}
          />
        </div>
        <span className={cn("text-xs font-medium", passed <= 1 ? "text-destructive" : passed <= 2 ? "text-orange-500" : passed <= 3 ? "text-yellow-600" : "text-green-600")}>
          {strength}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <div key={req.label} className="flex items-center gap-1 text-xs">
              {met ? (
                <Check className="h-3 w-3 text-green-500 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className={cn(met ? "text-green-600" : "text-muted-foreground")}>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
