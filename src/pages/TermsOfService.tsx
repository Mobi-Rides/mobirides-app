import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 9, 2026 · Version 1.0</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">By accessing or using MobiRides ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Eligibility</h2>
            <p className="text-muted-foreground">You must be at least 18 years old with a valid driver's license to use the Platform as a renter. Hosts must be the legal owner or authorized user of any listed vehicle.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Account Responsibilities</h2>
            <p className="text-muted-foreground">You are responsible for maintaining the security of your account credentials. You must provide accurate and complete information during registration and keep your profile up to date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Booking & Payments</h2>
            <p className="text-muted-foreground">All bookings are subject to host approval. Pricing is set by hosts and may include platform commission fees. Cancellation policies apply as stated at the time of booking.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Vehicle Use</h2>
            <p className="text-muted-foreground">Renters agree to use vehicles responsibly, obey all traffic laws, and return vehicles in the same condition received. Any damage must be reported immediately through the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Liability</h2>
            <p className="text-muted-foreground">MobiRides acts as a marketplace connecting hosts and renters. We are not responsible for the condition of vehicles or the conduct of users. Insurance coverage details are provided separately per booking.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Prohibited Activities</h2>
            <p className="text-muted-foreground">Users may not use the Platform for illegal purposes, misrepresent vehicle condition, engage in fraud, or harass other users. Violations may result in immediate account suspension.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Termination</h2>
            <p className="text-muted-foreground">We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their account at any time through their profile settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
            <p className="text-muted-foreground">We may update these terms periodically. Continued use of the Platform after changes constitutes acceptance. Material changes will be communicated via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">For questions about these Terms, contact us at <a href="mailto:legal@app.mobirides.com" className="text-primary underline">legal@app.mobirides.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
