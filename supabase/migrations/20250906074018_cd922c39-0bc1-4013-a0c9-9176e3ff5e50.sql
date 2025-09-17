-- Create guides table for help center content
CREATE TABLE public.guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('renter', 'host', 'shared')),
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  read_time TEXT DEFAULT '5 min',
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on guides table
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read guides
CREATE POLICY "Authenticated users can read guides" 
ON public.guides 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert renter guide content
INSERT INTO public.guides (role, section, title, description, content, read_time, is_popular, sort_order) VALUES 
('renter', 'getting-started', 'Getting Started as a Renter', 'Complete guide to setting up your account and making your first booking', 
'{"steps": [
  {"title": "Create Your Account", "content": "Sign up with your email and create a secure password. You will receive a confirmation email to verify your account.", "action": "Go to Sign Up"},
  {"title": "Complete Your Profile", "content": "Add your personal information, profile photo, and contact details. This helps hosts trust you and improves your booking success rate.", "action": "Edit Profile"},
  {"title": "Verify Your Identity", "content": "Upload a government-issued ID and take a selfie for verification. This is required before you can make bookings.", "action": "Start Verification"},
  {"title": "Add Your Driver License", "content": "Upload photos of your valid driver license. Make sure it is not expired and clearly visible.", "action": "Upload License"},
  {"title": "Search for Cars", "content": "Use our search filters to find cars by location, dates, price range, and vehicle type. Save your favorites for later.", "action": "Browse Cars"}
]}', '15 min', true, 1),

('renter', 'verification', 'Account Verification', 'Step-by-step guide to complete identity and license verification', 
'{"steps": [
  {"title": "Identity Verification Process", "content": "We use secure verification to ensure safety for all users. The process typically takes 2-4 hours to review.", "action": null},
  {"title": "Required Documents", "content": "You will need: Government-issued photo ID (passport, national ID, or driver license) and a clear selfie photo.", "action": null},
  {"title": "Upload Your Documents", "content": "Take clear photos of your ID - ensure all text is readable and there is no glare. Your selfie should clearly show your face.", "action": "Start Upload"}
]}', '10 min', false, 2),

('renter', 'booking', 'Finding & Booking Cars', 'Learn how to search, filter, and successfully book vehicles', 
'{"steps": [
  {"title": "Using Search Filters", "content": "Filter by location, pickup/return dates, price range, transmission type, and special features like GPS or child seats.", "action": null},
  {"title": "Reading Car Listings", "content": "Check photos, description, host reviews, availability calendar, and included features. Pay attention to pickup location and house rules.", "action": null},
  {"title": "Making a Booking Request", "content": "Select your dates and times, review the total cost including insurance, and send a booking request with a personal message to the host.", "action": null},
  {"title": "Waiting for Approval", "content": "Hosts have 24 hours to respond. You will receive notifications via email and in-app when they accept or decline.", "action": null},
  {"title": "Payment and Confirmation", "content": "Once approved, complete payment securely. You will receive booking confirmation with pickup details and host contact information.", "action": null}
]}', '20 min', true, 3),

('renter', 'pickup-return', 'Pickup & Return Process', 'Complete guide to vehicle handover and return procedures', 
'{"steps": [
  {"title": "Before Pickup", "content": "Confirm pickup time and location with the host. Bring your driver license and be prepared for identity verification.", "action": null},
  {"title": "Vehicle Inspection", "content": "Thoroughly inspect the vehicle with the host. Document any existing damage with photos through the app.", "action": null},
  {"title": "Key Handover", "content": "Receive keys, registration documents, and any special instructions from the host. Complete the digital handover process.", "action": null},
  {"title": "During Your Rental", "content": "Follow all traffic laws, keep the vehicle clean, and contact the host immediately if any issues arise.", "action": null},
  {"title": "Return Process", "content": "Return the vehicle on time with the same fuel level. Complete the return inspection with the host.", "action": null}
]}', '12 min', false, 4);

-- Insert host guide content
INSERT INTO public.guides (role, section, title, description, content, read_time, is_popular, sort_order) VALUES 
('host', 'getting-started', 'Getting Started as a Host', 'Complete guide to listing your car and earning money', 
'{"steps": [
  {"title": "Complete Host Profile", "content": "Add a professional profile photo, bio, and contact information. This builds trust with potential renters.", "action": "Edit Profile"},
  {"title": "List Your First Car", "content": "Upload high-quality photos, write a detailed description, set your pricing, and specify pickup location.", "action": "Add Car"},
  {"title": "Set Availability & Rules", "content": "Configure your calendar, set house rules, minimum rental periods, and advance notice requirements.", "action": null},
  {"title": "Understand Pricing", "content": "Learn about MobiRides 15% commission, how to set competitive prices, and when you get paid.", "action": "View Earnings"}
]}', '20 min', true, 1),

('host', 'car-listing', 'Car Listing & Management', 'Create compelling listings and manage availability', 
'{"steps": [
  {"title": "Photography Tips", "content": "Take high-quality photos from multiple angles. Include interior, exterior, and key features. Good lighting is essential.", "action": null},
  {"title": "Writing Descriptions", "content": "Write detailed, honest descriptions. Include special features, recent maintenance, and any quirks renters should know.", "action": null},
  {"title": "Setting Competitive Prices", "content": "Research similar cars in your area. Consider your car age, condition, and local demand when setting prices.", "action": null},
  {"title": "Managing Availability", "content": "Keep your calendar updated. Block dates when your car is not available and respond quickly to booking requests.", "action": null}
]}', '25 min', true, 2),

('host', 'bookings', 'Managing Bookings', 'Handle requests, confirmations, and communications', 
'{"steps": [
  {"title": "Reviewing Booking Requests", "content": "Check the renter profile, reviews, and verification status. Respond within 24 hours to maintain good ratings.", "action": null},
  {"title": "Communicating with Renters", "content": "Send clear pickup instructions, parking details, and any special requirements. Be responsive to questions.", "action": null},
  {"title": "Preparing for Handover", "content": "Ensure your car is clean, fueled, and in good condition. Have all necessary documents ready.", "action": null},
  {"title": "Handling Issues", "content": "Address problems promptly and professionally. Use the in-app messaging for all communications.", "action": null}
]}', '15 min', false, 3),

('host', 'earnings', 'Earnings & Wallet', 'Understand pricing, commissions, and payouts', 
'{"steps": [
  {"title": "Commission Structure", "content": "MobiRides charges a 15% commission on each booking. This covers insurance, support, and platform costs.", "action": null},
  {"title": "Payment Schedule", "content": "Payments are processed 24 hours after successful rental completion. Funds appear in your wallet within 2-3 business days.", "action": null},
  {"title": "Managing Your Wallet", "content": "Monitor your balance, transaction history, and upcoming payments. Set up notifications for important events.", "action": "View Wallet"},
  {"title": "Maximizing Earnings", "content": "Maintain high ratings, keep competitive pricing, and ensure high availability to increase your bookings.", "action": null}
]}', '10 min', false, 4);