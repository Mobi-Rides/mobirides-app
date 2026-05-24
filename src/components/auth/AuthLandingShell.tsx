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
  { icon: ShieldCheck, label: "Verified members", value: "Secure trips", color: "text-purple-600 bg-purple-50" },
  { icon: MapPin, label: "Local pickup", value: "Across Botswana", color: "text-emerald-600 bg-emerald-50" },
  { icon: Star, label: "Premium hosts", value: "Rated experiences", color: "text-amber-600 bg-amber-50" },
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
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen w-screen bg-[#F8F9FA] text-neutral-950 overflow-x-hidden">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Pane (Brand side) - Desktop Only */}
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-neutral-50 px-12 py-12 border-r border-neutral-100">
          {/* Subtle branding grid/pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-purple-200/20 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />

          {/* Logo Header */}
          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/lovable-uploads/MOBI_LOGO.png"
              alt="MobiRides"
              className="h-10 w-10 rounded-full bg-white object-contain p-1.5 shadow-md border border-neutral-100"
            />
            <span className="text-xl font-bold tracking-tight text-neutral-900">MobiRides</span>
          </div>

          {/* Centered Main Brand Content */}
          <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50/50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple-700 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" aria-hidden="true" />
              Botswana's Largest Marketplace
            </div>
            
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
              MobiRides: <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Cars for You, By You</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-neutral-600 max-w-md">
              Book trusted local cars or turn your vehicle into income with Botswana's largest premium car sharing platform.
            </p>

            {/* Premium Featured Ride Preview Card */}
            <div className="mt-10 w-full max-w-[22rem] rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Featured ride</p>
                  <p className="mt-0.5 text-lg font-bold text-neutral-800">Premium SUV</p>
                </div>
                <div className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-100">
                  P650 / day
                </div>
              </div>
              <div className="mt-4 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-100">
                <Car className="h-16 w-16 text-purple-600/80" strokeWidth={1.2} aria-hidden="true" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-medium text-neutral-600">
                <div className="rounded-lg bg-neutral-50 py-1.5 border border-neutral-100">Automatic</div>
                <div className="rounded-lg bg-neutral-50 py-1.5 border border-neutral-100">Full Insurance</div>
                <div className="rounded-lg bg-neutral-50 py-1.5 border border-neutral-100 font-semibold text-purple-700">★ 4.9</div>
              </div>
            </div>
          </div>

          {/* Highlights Footer */}
          <div className="relative z-10 grid gap-4 sm:grid-cols-3 w-full">
            {highlights.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl border border-neutral-200/50 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5">
                <div className={`inline-flex rounded-lg p-2 ${color}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="mt-3 text-xs font-bold text-neutral-800">{value}</p>
                <p className="mt-0.5 text-[10px] font-medium text-neutral-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right Pane (Form side) - Premium Brand Gradient Background */}
        <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] px-4 py-12 sm:px-6 lg:px-12 overflow-hidden">
          
          {/* Subtle decorative glowing background patterns */}
          <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-white/10 blur-[100px] pointer-events-none" />
          <div className="absolute -left-40 -bottom-40 h-[30rem] w-[30rem] rounded-full bg-black/20 blur-[100px] pointer-events-none" />

          {/* Mobile brand header (shown only on mobile) */}
          <div className="flex flex-col items-center mb-8 lg:hidden z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-2.5 shadow-xl border border-white/20">
              <img
                src="/lovable-uploads/MOBI_LOGO.png"
                alt="MobiRides"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white">
              MobiRides
            </h1>
            <p className="mt-2 text-center text-sm font-medium text-purple-100 max-w-xs">
              Cars for You, <span className="underline decoration-purple-300 decoration-2">By You</span>
            </p>
            <p className="mt-0.5 text-center text-xs text-purple-200/80">
              Botswana's Largest Rental Marketplace
            </p>
          </div>

          {/* Floating Auth Card with Premium Glassmorphism */}
          <div className="relative z-10 w-full max-w-[29rem]">
            <div className="rounded-3xl border border-white/25 bg-white/95 p-6 shadow-[0_20px_50px_rgba(76,29,149,0.3)] backdrop-blur-xl sm:p-9">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600 block mb-1">{eyebrow}</span>
                <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  {description}
                </p>
              </div>

              {children}

              <div className="mt-6 border-t border-neutral-200/80 pt-5 text-center text-xs font-medium text-neutral-500">
                {footerText}{" "}
                <Link
                  to={footerActionTo}
                  className="inline-flex items-center gap-0.5 font-bold text-purple-700 hover:text-purple-800 transition-colors"
                >
                  {footerActionLabel}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] font-medium leading-normal text-purple-200/80 max-w-xs mx-auto">
              {mode === "signin"
                ? "Protected secure sign in for verified renters and hosts."
                : "One premium account for renting, hosting, secure verification, and fast wallet payouts."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLandingShell;
