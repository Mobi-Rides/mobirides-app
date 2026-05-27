import React from "react";
import { ArrowLeft, Shield, CheckCircle2, AlertCircle, Info, Table as TableIcon, HelpCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const InsuranceTerms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Sticky Header */}
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
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-slate-900 tracking-tight">Insurance & Protection</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-8 md:mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold mb-4">
            <Shield className="h-3 w-3" /> Protection Policy v1.2
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Insurance Terms
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto px-2">
            Verified protection for every booking. Understand your coverage tiers, excess responsibilities, and the claims process in Botswana.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Info className="h-4 w-4" /> Updated: May 8, 2026</span>
            <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Version 1.2</span>
          </div>
        </header>

        <div className="space-y-12">
          {/* Overview Section */}
          <section id="overview" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">1. Overview of Coverage</h2>
            <p className="text-slate-600 leading-relaxed">
              Every confirmed booking on MobiRides includes a mandatory insurance protection plan. Coverage is active only during the official booking period, starting from the documented handover and ending at the documented return.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                "Third-Party Liability",
                "Own Damage Coverage",
                "Medical Expenses"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Protection Tiers */}
          <section id="tiers" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TableIcon className="h-6 w-6 text-primary" /> 2. Protection Plans (Tiers)
            </h2>
            <p className="text-sm text-slate-500 italic">All amounts are in Botswana Pula (BWP).</p>
            
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-bold text-slate-900 whitespace-nowrap">Plan Tier</TableHead>
                      <TableHead className="font-bold text-slate-900 text-right whitespace-nowrap">Premium Cap</TableHead>
                      <TableHead className="font-bold text-slate-900 text-right whitespace-nowrap">Excess Fee</TableHead>
                      <TableHead className="font-bold text-slate-900 whitespace-nowrap">Best For</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-slate-50/50 text-slate-500">
                      <TableCell className="font-bold">No Coverage</TableCell>
                      <TableCell className="text-right">None</TableCell>
                      <TableCell className="text-right">Full Liability</TableCell>
                      <TableCell className="text-xs">Budget / risk-tolerant renters</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Basic</TableCell>
                      <TableCell className="text-right">P8,000</TableCell>
                      <TableCell className="text-right">20% of claim</TableCell>
                      <TableCell className="text-slate-500 text-xs">Short-term city rentals</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Standard</TableCell>
                      <TableCell className="text-right">P20,000</TableCell>
                      <TableCell className="text-right">15% of claim</TableCell>
                      <TableCell className="text-slate-500 text-xs">Multi-day / intercity trips</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-bold text-primary">Premium</TableCell>
                      <TableCell className="text-right text-primary font-bold">P50,000</TableCell>
                      <TableCell className="text-right text-primary font-bold">10% of claim</TableCell>
                      <TableCell className="text-primary font-medium text-xs">Maximum peace of mind</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="p-4 bg-slate-50/50 border-t">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  * A fixed P150 admin fee is deducted from all approved claim payouts.
                </p>
              </div>
            </div>
          </section>

          {/* Inclusion/Exclusion Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-100 bg-green-50/30 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  What's Covered (Varies by Tier)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 text-green-800/80">
                <p>• Windscreen and window damage (Basic+)</p>
                <p>• Tyre protection: punctures, blowouts (Basic+)</p>
                <p>• Accidental collision damage (Standard+)</p>
                <p>• Theft and vandalism (Standard+)</p>
                <p>• Fire and weather-related damage (Standard+)</p>
              </CardContent>
            </Card>

            <Card className="border-red-100 bg-red-50/30 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  General Exclusions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 text-red-800/80">
                <p>• Missing police report for major incidents</p>
                <p>• Driving under the influence</p>
                <p>• Unlicensed or unauthorized drivers</p>
                <p>• Intentional or reckless damage</p>
                <p>• Mechanical wear and tear not due to collision</p>
              </CardContent>
            </Card>
          </div>

          {/* Claims Process Section */}
          <section className="bg-primary/5 p-8 rounded-2xl border border-primary/10 shadow-inner">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-primary">
              <HelpCircle className="h-6 w-6" />
              3. Claims Process
            </h2>
            <div className="space-y-6">
              {[
                { step: 1, title: "Report within 24 hours", desc: "Notify us immediately via the app dashboard or support chat." },
                { step: 2, title: "Gather Evidence", desc: "Take clear photos of the damage. A police report is mandatory for all major incidents." },
                { step: 3, title: "Adjudication", desc: "Our partners will review your claim within 5 business days of complete submission." }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-none w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-lg">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Need Help?</h2>
            <p className="text-slate-500 mb-6">Our dedicated insurance team is here to help with your coverage or active claims.</p>
            <a 
              href="mailto:compliance@mobirides.africa" 
              className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
            >
              compliance@mobirides.africa
            </a>
          </section>
        </div>
      </main>
    </div>
  );
};

export default InsuranceTerms;
