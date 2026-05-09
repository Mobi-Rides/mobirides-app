import React from "react";
import { ArrowLeft, UserCheck, Car, CreditCard, AlertTriangle, HelpCircle, Info, FileText, CheckCircle2, Ban, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const RenterTerms = () => {
  const navigate = useNavigate();

  const eligibilityItems = [
    {
      title: "Minimum Age",
      icon: <UserCheck className="h-5 w-5 text-blue-500" />,
      content: "Must be at least 21 years of age."
    },
    {
      title: "Experience",
      icon: <Car className="h-5 w-5 text-green-500" />,
      content: "Valid driver's license for at least 2 years."
    },
    {
      title: "Verification",
      icon: <ShieldAlert className="h-5 w-5 text-purple-500" />,
      content: "Complete identity verification (KYC) with biometric matching."
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
            <UserCheck className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-900">Renter Protection & Terms</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Renter Terms of Service
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed px-2">
            Your journey, our commitment. These terms outline your responsibilities and the standards we expect when you book a vehicle.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Info className="h-4 w-4" /> Updated: May 8, 2026</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Version 1.2</span>
          </div>
        </div>

        {/* Eligibility Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {eligibilityItems.map((item, idx) => (
            <Card key={idx} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-slate-100">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-12 opacity-50" />

        {/* Detailed Guidelines */}
        <div className="prose prose-slate max-w-none bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Ban className="h-6 w-6 text-red-500" />
              1. Prohibited Uses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Off-roading on unpaved tracks",
                "Commercial use or ride-hailing",
                "Racing, speed testing, or stunts",
                "Sub-leasing to third parties",
                "Transporting hazardous materials",
                "Illegal activities or criminal use"
              ].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm text-slate-600 bg-red-50/30 p-3 rounded-lg border border-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  {text}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <ShieldAlert className="h-6 w-6 text-orange-500" />
              2. Your Responsibilities
            </h2>
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Fuel and Cleanliness</h3>
                <p className="text-sm text-slate-600">Return the vehicle with the same fuel level as received. Excessive dirt, odors, or pet hair will result in a cleaning fee. <strong>Smoking is strictly prohibited.</strong></p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Traffic Violations</h3>
                <p className="text-sm text-slate-600">You are solely responsible for all fines, tickets, and impound fees incurred during your rental. MobiRides will process these with an administrative fee.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              3. Accidents and Damage
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <p className="text-sm text-slate-700"><strong>Call the Police immediately</strong> to obtain a mandatory police report for all claims.</p>
              </div>
              <div className="flex gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <p className="text-sm text-slate-700"><strong>Notify MobiRides within 2 hours</strong> of the incident via the app or support line.</p>
              </div>
              <div className="flex gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <p className="text-sm text-slate-700"><strong>Financial Responsibility:</strong> You are liable for the Insurance Excess amount if at fault or if no third party is identified.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-xs italic mb-4">
            MobiRides: Your Journey, Our Commitment.
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

export default RenterTerms;
