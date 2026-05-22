import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Car, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";

interface AuthLandingShellProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  mode: "signin" | "signup";
  footerText: string;
  footerActionLabel: string;
  footerActionTo: string;
}

const highlights = [
  { icon: ShieldCheck, label: "Verified members", value: "Secure trips" },
  { icon: MapPin, label: "Local pickup", value: "Across Botswana" },
  { icon: Star, label: "Premium hosts", value: "Rated experiences" },
];

export const AuthLandingShell: React.FC<AuthLandingShellProps> = ({
  children,
  eyebrow,
  title,
  description,
  mode,
  footerText,
  footerActionLabel,
  footerActionTo,
}) => {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen w-screen bg-[#f7f8fb] text-neutral-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[42vh] flex-col overflow-hidden bg-[#151515] px-5 py-6 text-white sm:px-8 lg:min-h-screen lg:px-12 lg:py-10">
          <img
            src="/lovable-uploads/MOBI_LOGO.png"
            alt="MobiRides"
            className="h-14 w-14 rounded-lg bg-white object-contain p-1.5 sm:h-16 sm:w-16"
          />

          <div className="relative z-10 mt-10 max-w-2xl sm:mt-14 lg:mt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              Premium car sharing
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Cars for You, By You.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-300 sm:text-lg">
              Book trusted local cars or turn your vehicle into income with a smoother MobiRides account experience.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3 lg:mt-auto">
            {highlights.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <Icon className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-white">{value}</p>
                <p className="mt-1 text-xs text-neutral-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute right-8 top-28 hidden w-[28rem] rotate-[-8deg] rounded-lg border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Featured ride</p>
                <p className="mt-1 text-xl font-semibold">City SUV</p>
              </div>
              <div className="rounded-full bg-amber-300 px-3 py-1 text-sm font-semibold text-neutral-950">
                P650/day
              </div>
            </div>
            <div className="mt-6 flex h-44 items-center justify-center rounded-lg bg-[#202624]">
              <Car className="h-24 w-24 text-white/80" strokeWidth={1.3} aria-hidden="true" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-md bg-white/10 px-3 py-2">Auto</div>
              <div className="rounded-md bg-white/10 px-3 py-2">Insured</div>
              <div className="rounded-md bg-white/10 px-3 py-2">4.9 rating</div>
            </div>
          </div>
        </section>

        <main className="flex items-start justify-center px-5 py-8 sm:px-8 lg:min-h-screen lg:items-center lg:px-12">
          <div className="w-full max-w-[31rem]">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-xl shadow-neutral-200/70 sm:p-8">
              <div className="mb-7">
                <p className="text-sm font-semibold text-emerald-700">{eyebrow}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950 sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
              </div>

              {children}

              <div className="mt-6 border-t border-neutral-200 pt-5 text-center text-sm text-neutral-600">
                {footerText}{" "}
                <Link
                  to={footerActionTo}
                  className="inline-flex items-center gap-1 font-semibold text-neutral-950 transition-colors hover:text-emerald-700"
                >
                  {footerActionLabel}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-neutral-500">
              {mode === "signin"
                ? "Protected sign in for renters and hosts."
                : "One account for renting, hosting, verification, and payments."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLandingShell;
