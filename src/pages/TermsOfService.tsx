import { ArrowLeft, Shield, Scale, FileText, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-accent transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm hidden sm:inline-block tracking-tight">Legal Documentation</span>
          </div>
          <div className="w-20" /> {/* Spacer for balance */}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <FileText className="h-3 w-3" /> Version 1.1 (Production)
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-foreground">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Please read these terms carefully. They constitute a legally binding agreement between you and MobiRides governing your use of our car-sharing platform in Botswana.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg border border-border/50">
            <Info className="h-4 w-4 text-primary flex-shrink-0" />
            <p>Last updated: <span className="font-medium text-foreground">May 8, 2026</span></p>
          </div>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed mb-8">
            Welcome to MobiRides. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and MobiRides ("MobiRides", "we", "us", or "our"), governing your access to and use of the MobiRides website, mobile application, and all related services (collectively, the "Platform").
          </p>

          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 mb-12">
            <h2 className="text-destructive font-bold text-lg mb-2 mt-0 flex items-center gap-2">
              <Shield className="h-5 w-5" /> Important Notice
            </h2>
            <p className="text-destructive/90 font-medium m-0">
              PLEASE READ THESE TERMS CAREFULLY. BY ACCESSING OR USING THE PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE PLATFORM.
            </p>
          </div>

          <Separator className="my-12" />

          <section id="scope" className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">1. Scope of Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              MobiRides provides an online marketplace that enables registered users ("Hosts") to list vehicles for sharing and other registered users ("Renters") to book such vehicles.
            </p>
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-5 italic text-sm text-primary/80">
              MobiRides is not a rental car company. We do not own, provide, manage, or control the vehicles listed on the Platform. Our responsibility is limited to facilitating the availability of the Platform and related services.
            </div>
          </section>

          <Separator className="my-12" />

          <section id="definitions" className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">2. Definitions</h2>
            <ul className="grid gap-3 list-none pl-0">
              {[
                { term: "Platform", desc: "The website, mobile apps, and services provided by MobiRides." },
                { term: "User", desc: "Any individual who registers for an account on the Platform." },
                { term: "Host", desc: "A User who lists a vehicle on the Platform for sharing." },
                { term: "Renter", desc: "A User who books a vehicle through the Platform." },
                { term: "Booking", desc: "A confirmed arrangement for the use of a Vehicle during a specific period." },
                { term: "Total Price", desc: "The sum of the daily rate, service fees, insurance costs, and any applicable taxes." },
              ].map((item) => (
                <li key={item.term} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-bold text-foreground min-w-[100px] inline-block">{item.term}:</span>
                  <span className="text-muted-foreground">{item.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <Separator className="my-12" />

          <section id="eligibility" className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">3. Eligibility and Verification</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3.1 Eligibility</h3>
              <p className="text-muted-foreground">To use the Platform, you must be at least 18 years old and possess the legal capacity to enter into a binding contract.</p>
              
              <h3 className="text-lg font-semibold">3.2 Verification</h3>
              <p className="text-muted-foreground">Users must provide accurate and complete information during registration.</p>
              <ul className="space-y-2 text-muted-foreground ml-6 list-disc">
                <li><span className="text-foreground font-medium">Renters</span> must provide a valid driver's license recognized in Botswana and complete identity verification (KYC).</li>
                <li><span className="text-foreground font-medium">Hosts</span> must provide proof of ownership or authorization to list the vehicle and ensure the vehicle is registered and roadworthy according to Botswana laws.</li>
              </ul>
              <p className="text-sm italic text-muted-foreground/80 mt-4">
                MobiRides reserves the right to use third-party services to verify User identity and background.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          <section id="financial" className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">5. Financial Terms</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground/90">5.2 Fees & Commissions</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Service Fees", detail: "Host commission (15%) + Renter service fee." },
                  { title: "Insurance", detail: "Variable based on protection plan selected." },
                  { title: "Admin Fees", detail: "Flat P150 fee for claims processing actions." }
                ].map((fee) => (
                  <div key={fee.title} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                    <p className="text-sm font-bold mb-1">{fee.title}</p>
                    <p className="text-xs text-muted-foreground">{fee.detail}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                All payments must be processed through the Platform's designated payment gateway.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          <section id="liability" className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">8. Insurance and Liability</h2>
            <div className="bg-secondary/30 rounded-2xl p-8 border border-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> 8.2 Limitation of Liability
              </h3>
              <p className="text-sm uppercase font-black leading-relaxed tracking-wide text-foreground/80">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, MOBIRIDES SHALL NOT BE LIABLE FOR ANY INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, OR COST OF SUBSTITUTE SERVICES, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE USE OF THE PLATFORM.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          <footer className="pt-8 pb-16 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">12. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions or concerns regarding these Terms, please contact us at:
              </p>
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-foreground font-medium">
                  <span className="text-primary font-bold">Email:</span>
                  <a href="mailto:legal@app.mobirides.com" className="underline hover:text-primary transition-colors">legal@app.mobirides.com</a>
                </p>
                <p className="flex items-center gap-2 text-foreground font-medium">
                  <span className="text-primary font-bold">Address:</span>
                  <span>Gaborone, Botswana</span>
                </p>
              </div>
            </div>
            
            <div className="pt-12 text-center">
              <Separator className="mb-8" />
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary mb-2">MobiRides</p>
              <p className="text-xs text-muted-foreground italic">Connecting Botswana, One Ride at a Time.</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;

