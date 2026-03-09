import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CommunityGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Community Guidelines</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 9, 2026 · Version 1.0</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Respect & Safety</h2>
            <p className="text-muted-foreground">Treat all community members with respect. Harassment, discrimination, threats, or abusive language will not be tolerated and may result in immediate account suspension.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Honest Listings</h2>
            <p className="text-muted-foreground">Hosts must accurately represent their vehicles including condition, features, and availability. Misleading photos or descriptions are prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Vehicle Care</h2>
            <p className="text-muted-foreground">Renters must treat vehicles with care, keep them clean, follow fuel policies, and report any issues immediately. Return vehicles on time and in the condition received.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Communication</h2>
            <p className="text-muted-foreground">Respond to messages promptly. Keep all booking-related communication on the Platform. Be clear and courteous about pickup/return arrangements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Reviews</h2>
            <p className="text-muted-foreground">Leave honest, constructive reviews. Do not use reviews to harass or retaliate. Reviews must reflect your genuine experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Legal Compliance</h2>
            <p className="text-muted-foreground">All users must comply with local traffic laws, insurance requirements, and licensing regulations. Vehicles must not be used for illegal activities.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Handover Process</h2>
            <p className="text-muted-foreground">Complete the vehicle handover process thoroughly. Document vehicle condition with photos, verify identities, and record mileage and fuel levels at both pickup and return.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Reporting</h2>
            <p className="text-muted-foreground">Report violations, safety concerns, or suspicious activity immediately through the Platform. We investigate all reports and take appropriate action.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Consequences</h2>
            <p className="text-muted-foreground">Violations may result in warnings, temporary suspension, permanent ban, or legal action depending on severity. Repeated minor violations are treated as major violations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">For questions about Community Guidelines, contact us at <a href="mailto:community@app.mobirides.com" className="text-primary underline">community@app.mobirides.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
