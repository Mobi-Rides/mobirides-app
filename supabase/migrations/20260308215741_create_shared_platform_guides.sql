
-- MOB-309: Seed 4 shared platform guides
INSERT INTO public.guides (role, section, title, description, read_time, is_popular, sort_order, content)
VALUES
(
  'shared',
  'terms-of-service',
  'Platform Terms of Service',
  'Understand the terms and conditions governing your use of the MobiRides platform, including account responsibilities and liability.',
  '5 min read',
  false,
  10,
  '{"steps": [{"title": "Account Terms & Responsibilities", "content": "By creating a MobiRides account, you agree to provide accurate information and maintain account security. You are responsible for all activity under your account. Accounts must be registered by individuals aged 18 or older with a valid driver''s licence."}, {"title": "Liability & Indemnification", "content": "MobiRides acts as a platform connecting hosts and renters. While we facilitate bookings and payments, the rental agreement is between the host and renter. Each party is liable for their obligations. MobiRides is not liable for vehicle condition, accidents, or disputes beyond platform mediation."}, {"title": "Dispute Resolution Process", "content": "If a dispute arises, first attempt to resolve it directly with the other party via in-app messaging. If unresolved, submit a dispute through MobiRides support within 7 days. Our team will review evidence from both parties and issue a binding resolution within 14 business days."}, {"title": "Account Suspension & Termination", "content": "MobiRides may suspend or terminate accounts for violations including fraudulent activity, repeated cancellations, safety violations, or harassment. Users may appeal suspensions within 30 days. Voluntary account deletion can be requested through Profile settings."}, {"title": "Terms Updates & Notifications", "content": "MobiRides may update these terms periodically. Significant changes will be communicated via email and in-app notification at least 14 days before taking effect. Continued use of the platform after changes constitutes acceptance of updated terms."}]}'::jsonb
),
(
  'shared',
  'cancellation-policy',
  'Cancellation & Refund Policy',
  'Learn about cancellation windows, refund timelines, and policies for both renters and hosts on MobiRides.',
  '4 min read',
  true,
  11,
  '{"steps": [{"title": "Renter Cancellation Windows", "content": "Free cancellation is available up to 48 hours before the booking start time for a full refund. Cancellations between 24-48 hours receive a 75% refund. Cancellations within 24 hours receive a 50% refund. No refund is given for no-shows or cancellations after the booking start time."}, {"title": "Host Cancellation Rules", "content": "Hosts should avoid cancelling confirmed bookings. Host cancellations result in a full refund to the renter and may incur a cancellation fee. Repeated host cancellations affect listing visibility and may lead to account review. Emergency cancellations can be requested through support."}, {"title": "Refund Processing Timelines", "content": "Approved refunds are processed within 5-7 business days. Refunds are returned to the original payment method. Wallet credits are processed instantly. Bank transfer refunds may take an additional 3-5 business days depending on your financial institution."}, {"title": "No-Show Policy", "content": "If a renter fails to collect the vehicle within 2 hours of the agreed pickup time without communication, it is considered a no-show. The host may cancel the booking and the renter forfeits the full rental amount. Hosts must attempt to contact the renter before marking a no-show."}, {"title": "Exceptional Circumstances", "content": "Force majeure events (natural disasters, government restrictions, etc.) may qualify for full refunds outside normal policy. Medical emergencies with documentation may also qualify. Contact MobiRides support with evidence for case-by-case review."}]}'::jsonb
),
(
  'shared',
  'community-guidelines',
  'Community Guidelines',
  'Our community standards for respectful interactions, vehicle care, honest listings, and responsible platform use.',
  '4 min read',
  false,
  12,
  '{"steps": [{"title": "Respectful Communication", "content": "Treat all community members with respect and professionalism. Discriminatory language, harassment, threats, or abusive behaviour will not be tolerated. Use in-app messaging for all booking-related communication to maintain a record and ensure safety."}, {"title": "Vehicle Care Standards", "content": "Renters must treat vehicles with care, return them in the same condition, and report any damage immediately. Smoking, pets, and off-road driving are prohibited unless explicitly allowed by the host. Excessive dirt or odour may result in cleaning fees."}, {"title": "Honest Listings & Accurate Profiles", "content": "Hosts must provide accurate vehicle descriptions, photos, and availability. Misleading listings will be removed. All users must maintain truthful profiles with valid identification. Fake reviews or manipulated ratings result in immediate suspension."}, {"title": "Review Etiquette", "content": "Leave honest, constructive reviews after each rental. Reviews should focus on the rental experience, vehicle condition, and communication. Personal attacks, discriminatory comments, or irrelevant content will be removed. Both parties have 14 days to submit a review."}, {"title": "Reporting Violations", "content": "Report safety concerns, policy violations, or suspicious activity through the in-app reporting feature or by contacting support. Reports are investigated confidentially. False or malicious reports may result in account action against the reporter."}]}'::jsonb
),
(
  'shared',
  'data-privacy',
  'Data Privacy & Security',
  'How MobiRides collects, uses, and protects your personal data, and your rights regarding your information.',
  '5 min read',
  false,
  13,
  '{"steps": [{"title": "Data We Collect", "content": "MobiRides collects information you provide (name, email, phone, driver''s licence, payment details) and usage data (booking history, location during active rentals, device information). We collect only what is necessary to provide and improve our services."}, {"title": "How We Use Your Data", "content": "Your data is used to facilitate bookings, verify identity, process payments, provide customer support, and improve platform safety. We use anonymised usage data for analytics and service improvements. We never sell your personal data to third parties."}, {"title": "Data Sharing & Third Parties", "content": "We share necessary information with booking counterparts (host/renter name and contact for active bookings), payment processors, insurance providers, and law enforcement when legally required. All third-party partners are contractually bound to protect your data."}, {"title": "Your Data Rights", "content": "You have the right to access, correct, or delete your personal data. You can download your data through Profile settings. You can opt out of marketing communications at any time. Data retention follows the Protection of Personal Information Act (POPIA) requirements."}, {"title": "Account Deletion & Data Removal", "content": "You can request complete account deletion through Profile > Settings > Delete Account. This removes your personal data within 30 days. Some data may be retained for legal compliance (transaction records for 5 years). Active bookings must be completed before deletion."}]}'::jsonb
);
