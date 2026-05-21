import React from "react";
import { ArrowLeft, Users, Heart, Shield, MessageSquare, Star, Ban, Flag, Info, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const CommunityGuidelines = () => {
  const navigate = useNavigate();

  const guidelines = [
    {
      title: "Respect and Inclusivity",
      icon: <Users className="h-5 w-5 text-blue-500" />,
      content: "MobiRides is an inclusive community with zero tolerance for discrimination based on race, ethnicity, religion, gender, or disability."
    },
    {
      title: "Safety and Trust",
      icon: <Shield className="h-5 w-5 text-green-500" />,
      content: "Always provide accurate information. Misrepresenting yourself or your vehicle's condition undermines the safety of our community."
    },
    {
      title: "Review Integrity",
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      content: "Reviews are the lifeblood of trust. Provide fair, honest, and objective feedback based on your actual experience."
    },
    {
      title: "Prohibited Behavior",
      icon: <Ban className="h-5 w-5 text-red-500" />,
      content: "Fraud, reckless driving, and off-platform transactions are strictly prohibited and will lead to account termination."
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
            <Heart className="h-5 w-5 text-red-500" />
            <span className="font-bold text-slate-900">Community Standards</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Community Guidelines
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg leading-relaxed px-2">
            Building a community based on trust, safety, and mutual respect. These guidelines outline the standards of behavior expected from everyone on our platform.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm font-medium text-slate-400">
            <span className="flex items-center gap-1"><Info className="h-4 w-4" /> Updated: May 8, 2026</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Version 1.1</span>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 md:mb-16">
          {guidelines.map((item, idx) => (
            <Card key={idx} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 text-sm md:text-base">{item.title}</h3>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{item.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-12 opacity-50" />

        {/* Detailed Guidelines */}
        <div className="prose prose-slate max-w-none bg-white rounded-2xl p-6 md:p-12 shadow-sm border border-slate-100 space-y-12">
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Users className="h-6 w-6 text-primary shrink-0" />
              1. Respect and Inclusivity
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">1.1 Zero Tolerance for Discrimination</h3>
                <p className="text-slate-600 leading-relaxed">MobiRides is an inclusive community. We have zero tolerance for discrimination based on race, ethnicity, religion, gender, age, disability, or sexual orientation.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">1.2 Professional Communication</h3>
                <p className="text-slate-600 leading-relaxed">Maintain a polite and professional tone. Harassment, threats, or abusive language will result in immediate and permanent removal from the Platform.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Shield className="h-6 w-6 text-primary" />
              2. Safety and Trust
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">2.1 Truthfulness</h3>
                <p className="text-slate-600 leading-relaxed">Always provide accurate and complete information. Misrepresenting yourself or your vehicle's condition undermines the safety of our entire community.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">2.2 Off-Platform Transactions</h3>
                <p className="text-slate-600 leading-relaxed text-orange-600 font-medium">To protect your security and insurance, all bookings and payments MUST stay on the MobiRides Platform. Soliciting payments outside the app is a serious violation.</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              3. The Codes of Conduct
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-primary mb-3">The Renter Code</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>• Treat every car as your own.</li>
                  <li>• Respect the Host's schedule.</li>
                  <li>• Communicate early and often.</li>
                  <li>• Return the vehicle clean.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-orange-600 mb-3">The Host Code</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>• Safety first—never list a faulty car.</li>
                  <li>• Keep your calendar updated.</li>
                  <li>• Provide a welcoming experience.</li>
                  <li>• Honor your confirmed bookings.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-2">
              <Flag className="h-6 w-6 text-primary" />
              4. Enforcement and Reporting
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              We use a combination of automated systems and manual reviews to identify and address violations. 
              Depending on severity, enforcement may range from warnings to permanent bans.
            </p>
            <div className="bg-red-50 border border-red-100 p-6 rounded-xl text-center">
              <h3 className="text-red-900 font-bold mb-2">Report a Violation</h3>
              <p className="text-red-800 text-sm mb-4">If you witness or experience a violation, report it immediately via the app or email.</p>
              <a href="mailto:community@mobirides.com" className="text-red-600 font-bold underline hover:text-red-700 transition-colors">
                community@mobirides.com
              </a>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center text-slate-400 text-xs italic">
          Thank you for helping us make MobiRides the most trusted car-sharing community in Botswana.
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
