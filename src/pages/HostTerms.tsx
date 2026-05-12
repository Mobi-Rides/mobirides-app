import React from "react";
import { ArrowLeft, LayoutDashboard, Key, Shield, Calendar, Banknote, AlertCircle, Info, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const HostTerms = () => {
  const navigate = useNavigate();

  const coreTerms = [
    {
      title: "Ownership & Authority",
      icon: <Key className="h-5 w-5 text-orange-500" />,
      content: "You must be the legal owner or have written authority to list the vehicle. Vehicles must be registered and roadworthy per the Road Traffic Act of Botswana."
    },
    {
      title: "Maintenance Standards",
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      content: "Hosts are responsible for regular servicing, tire health, and ensuring all safety features (brakes, lights, belts) are fully functional."
    },
    {
      title: "Payout Schedule",
      icon: <Banknote className="h-5 w-5 text-green-500" />,
      content: "Earnings are processed on a T+2 business day cycle after successful completion and return of the vehicle."
    },
    {
      title: "Damage Reporting",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      content: "Inspect your vehicle immediately upon return. Damages must be reported within 24 hours to be eligible for insurance coverage."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="gap-2 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-orange-600" />
            <span className="font-bold text-slate-900">Host Protection & Terms</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Host Terms of Service
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed px-2">
            Empowering Hosts to move Botswana. These terms govern your use of the platform to list and rent out your vehicles.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Info className="h-4 w-4" /> Updated: May 8, 2026</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Version 1.2</span>
          </div>
        </div>

        {/* Core Terms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {coreTerms.map((term, idx) => (
            <Card key={idx} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-slate-100">
                    {term.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{term.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{term.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-12 opacity-50" />

        {/* Detailed Sections */}
        <div className="prose prose-slate max-w-none bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Key className="h-6 w-6 text-primary" />
              1. Host Eligibility
            </h2>
            <p className="text-slate-700 leading-relaxed">
              To list a vehicle, you must be the legal owner or have express written authority. All vehicles must be registered, licensed, and roadworthy according to the <strong>Road Traffic Act of Botswana</strong>. MobiRides reserves the right to request proof of ownership and maintenance records at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Shield className="h-6 w-6 text-primary" />
              2. Insurance and Liability
            </h2>
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl space-y-4">
              <p className="text-blue-900 text-sm leading-relaxed">
                All vehicles listed must be covered by a valid comprehensive insurance policy. While MobiRides facilitates supplemental protection, the primary responsibility for legal insurance rests with the Host.
              </p>
              <div className="flex items-center gap-3 text-sm text-blue-800 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Supplemental protection active during booking period.
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Banknote className="h-6 w-6 text-primary" />
              3. Financial Terms
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Earnings</h3>
                <p className="text-sm text-slate-600">Calculated based on your set daily rate, minus the Platform fee. Transparent pricing with no hidden costs.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Payouts</h3>
                <p className="text-sm text-slate-600">Processed on a T+2 business day cycle. Funds are transferred directly to your registered bank account.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Calendar className="h-6 w-6 text-primary" />
              4. Booking Management
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>• <strong>Cancellations:</strong> Frequent cancellations disrupt renter plans and may result in penalties or account suspension.</p>
              <p>• <strong>Handover:</strong> Hosts must verify the Renter's ID and License at the start of every trip.</p>
              <p>• <strong>Reliability:</strong> Maintain an accurate availability calendar to ensure a seamless experience for the community.</p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-xs italic mb-4">
            MobiRides: Empowering Hosts, Moving Botswana.
          </p>
          <div className="inline-flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-slate-600">Full General Terms available in the Help Center.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostTerms;
