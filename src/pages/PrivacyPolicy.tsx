import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 9, 2026 · Version 1.0</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground">MobiRides ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our car-sharing platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="text-muted-foreground">We collect personal information (name, email, phone number, profile picture), identity verification documents, payment information, location data, communication data (messages, timestamps), and usage analytics.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">Your information is used to provide and improve the Platform, process bookings and payments, verify identities, communicate with you, ensure safety and security, and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Messaging Privacy</h2>
            <p className="text-muted-foreground">Messages are only visible to conversation participants. We do not scan message content for advertising. Administrative access to messages is limited to safety investigations, legal compliance, and customer support when explicitly requested.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Protection</h2>
            <p className="text-muted-foreground">We implement encryption in transit and at rest, role-based access controls, regular security audits, and multi-factor authentication for administrative access.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p className="text-muted-foreground">You may access, correct, or delete your personal data, export your data, object to certain processing activities, and manage notification and privacy preferences through your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Sharing</h2>
            <p className="text-muted-foreground">We do not sell your data. Information may be shared with trusted service providers, in response to legal requirements, for safety and security purposes, or in connection with business transfers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Data Retention</h2>
            <p className="text-muted-foreground">Active account data is retained while your account is active. Deleted messages are permanently removed within 30 days. Account deletion triggers complete data removal within 90 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Children's Privacy</h2>
            <p className="text-muted-foreground">Our services are not intended for users under 18. We do not knowingly collect information from minors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">For privacy questions, contact us at <a href="mailto:privacy@app.mobirides.com" className="text-primary underline">privacy@app.mobirides.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
