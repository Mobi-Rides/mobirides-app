-- MOB-307: Renter Safety Guidelines guide
INSERT INTO public.guides (role, section, title, description, read_time, is_popular, sort_order, content)
VALUES (
  'renter',
  'safety-guidelines',
  'Safety Guidelines',
  'Essential safety information for your rental experience, including emergency procedures, accident reporting, and vehicle safety checks.',
  '6 min read',
  true,
  5,
  '{
    "steps": [
      {
        "title": "Pre-Drive Vehicle Safety Check",
        "content": "Before driving, walk around the vehicle and check tyres, lights, mirrors, and fluid levels. Ensure the seatbelt, brakes, and indicators work properly. Report any issues to the host immediately.",
        "action": "Browse Cars"
      },
      {
        "title": "Understand Your Insurance Coverage",
        "content": "Review your insurance policy details before starting your trip. Know what is covered, your excess amount, and any exclusions. Keep your policy number accessible at all times.",
        "action": "View Bookings"
      },
      {
        "title": "Emergency Contacts & Procedures",
        "content": "Save emergency numbers: Police (10111), Ambulance (10177), and MobiRides support. In an emergency, ensure your safety first, then contact authorities and notify MobiRides through the app.",
        "action": null
      },
      {
        "title": "What To Do In An Accident",
        "content": "Stay calm and check for injuries. Move to a safe location if possible. Exchange details with other parties, take photos of damage, and file a police report within 24 hours. Do not admit fault.",
        "action": null
      },
      {
        "title": "Report An Accident On MobiRides",
        "content": "Open your active booking, tap Report Issue, and provide accident details with photos. MobiRides will guide you through the insurance claim process and connect you with support.",
        "action": "View Bookings"
      },
      {
        "title": "Vehicle Breakdown Procedures",
        "content": "If the car breaks down, pull over safely and turn on hazard lights. Contact the host first, then MobiRides support. Do not attempt repairs yourself. Roadside assistance details are in your booking confirmation.",
        "action": "Contact Support"
      }
    ]
  }'::jsonb
);

-- MOB-308: Host Handover Process guide
INSERT INTO public.guides (role, section, title, description, read_time, is_popular, sort_order, content)
VALUES (
  'host',
  'handover-process',
  'Handover Process',
  'Step-by-step guide for conducting smooth vehicle handovers with renters, including preparation, identity checks, and condition reports.',
  '7 min read',
  true,
  5,
  '{
    "steps": [
      {
        "title": "Prepare Your Vehicle Before Handover",
        "content": "Clean the interior and exterior. Check fuel level, tyre pressure, and fluid levels. Ensure all documents (registration, insurance) are in the vehicle. Remove personal belongings.",
        "action": "Manage Bookings"
      },
      {
        "title": "Verify Renter Identity",
        "content": "At handover, verify the renter''s identity matches their profile. Check their driver''s licence is valid and matches their MobiRides verification. Use the in-app identity check for a secure process.",
        "action": "Manage Bookings"
      },
      {
        "title": "Complete The Vehicle Condition Report",
        "content": "Walk around the vehicle with the renter. Photograph all sides, interior, dashboard (mileage), and any existing damage. Both parties must agree on the condition before handover.",
        "action": null
      },
      {
        "title": "Record Fuel Level & Mileage",
        "content": "Note the current fuel level and odometer reading in the handover session. Take a clear photo of the dashboard. This protects both you and the renter from disputes.",
        "action": null
      },
      {
        "title": "Key Exchange & Vehicle Walkthrough",
        "content": "Show the renter key vehicle features: lights, wipers, boot release, fuel cap, and any quirks. Explain parking preferences and return location. Hand over all keys.",
        "action": null
      },
      {
        "title": "Confirm Handover Digitally",
        "content": "Both parties sign the digital handover confirmation in the app. This timestamps the exchange and protects both sides. The booking status updates automatically once confirmed.",
        "action": "Manage Bookings"
      }
    ]
  }'::jsonb
);