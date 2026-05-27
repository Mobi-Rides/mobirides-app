import React from "react";
import { ArrowLeft, Lock, ShieldCheck, Eye, Database, Info, FileText, Globe, Bell, UserCheck, Scale, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Data Protection Act Compliance",
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      content: "MobiRides is fully aligned with the Botswana Data Protection Act [Cap 08:05] (Act No. 32 of 2018). We prioritize your privacy through strict adherence to statutory requirements for data processing and security."
    },
    {
      title: "Your Statutory Rights",
      icon: <UserCheck className="h-5 w-5 text-green-500" />,
      content: "Under Part VI of the Act, you have the right to access, rectify, or erase your data, and object to processing. You also have the right to lodge a complaint with the Botswana Data Protection Commissioner."
    },
    {
      title: "Sensitive Biometric Data",
      icon: <Lock className="h-5 w-5 text-orange-500" />,
      content: "We process biometric data (selfies and ID documents) only with your explicit consent to ensure platform safety and verify identity against official records."
    },
    {
      title: "International Transfers",
      icon: <Globe className="h-5 w-5 text-blue-500" />,
      content: "International transfers are protected by Standard Contractual Clauses (SCCs) to ensure your data remains secure even when processed outside Botswana borders."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header */}
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
            <Lock className="h-5 w-5 text-primary" />
            <span className="font-bold text-slate-900">Privacy Center</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            How we protect your personal information in accordance with Botswana's Data Protection Act.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Updated: May 8, 2026</span>
            <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> Version 1.2</span>
          </div>
        </div>

        {/* At a Glance Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {sections.map((section, idx) => (
            <Card key={idx} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-slate-100">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{section.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-12 opacity-50" />

        {/* Detailed Legal Text */}
        <div className="prose prose-slate max-w-none bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100">
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                1. Data Controller and Registration
              </h2>
              <p className="text-slate-700 leading-relaxed">
                MobiRides operates as the <strong>Data Controller</strong> for the personal information collected through our website, mobile application, and services. We are committed to maintaining the principles of accountability, lawfulness, and transparency as mandated by the <strong>Data Protection Act [Cap 08:05] (Act No. 32 of 2018)</strong>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                2. Information We Collect
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">2.1 Personal Data</h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    <li><strong>Account Details:</strong> Name, email address, phone number, and password.</li>
                    <li><strong>Identity Information:</strong> National ID/Passport number, Driver's License details.</li>
                    <li><strong>Financial Data:</strong> Bank account details for Hosts; payment tokenization for Renters.</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                  <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-orange-600" />
                    2.2 Sensitive Personal Data (Biometrics)
                  </h3>
                  <p className="text-sm text-orange-800 leading-relaxed mb-2">
                    To ensure the safety of our community, we process biometric data for facial matching and identity verification against official records.
                  </p>
                  <p className="text-xs text-orange-700 font-medium italic">
                    * By using our identity verification services, you provide explicit consent for the processing of this sensitive data (Section 24 of the Act).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                3. International Data Transfers
              </h2>
              <p className="text-slate-700 leading-relaxed">
                MobiRides utilizes global infrastructure providers. In accordance with <strong>Section 48</strong> of the Data Protection Act, we ensure that any transfer of personal data outside Botswana is protected by Standard Contractual Clauses (SCCs) or occurs to jurisdictions providing an adequate level of protection as recognized by the Commissioner.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                4. Data Security and Breach Notification
              </h2>
              <p className="text-slate-700 leading-relaxed">
                In the event of a data breach that poses a high risk to your rights and freedoms, MobiRides will notify the <strong>Information and Data Protection Commissioner</strong> and affected data subjects within <strong>72 hours</strong> of discovery, as per Section 34 of the Act.
              </p>
            </div>

            <Separator className="my-8" />

            <div className="bg-slate-900 text-white rounded-xl p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Contact Our Data Protection Officer
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                If you have any questions about this Privacy Policy or wish to exercise your statutory rights (Access, Rectification, Erasure, Objection, Restriction), please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-400">Email:</span> compliance@mobirides.africa</p>
                <p><span className="text-slate-400">Authority:</span> The Information and Data Protection Commissioner, Gaborone, Botswana.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center text-slate-400 text-xs italic">
          MobiRides: Moving Botswana Safely and Securely.
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
