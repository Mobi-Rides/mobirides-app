import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

// Enhanced email templates with rich HTML content
const EMAIL_TEMPLATES = {
  'welcome-renter': {
    subject: '🚗 Welcome to MobiRides - Your car-sharing adventure begins!',
    html: (data: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .welcome-message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .highlight-box { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
        .highlight-box h2 { color: white; margin: 0 0 15px 0; font-size: 22px; }
        .highlight-box p { color: #fef5e7; margin: 0; font-size: 16px; }
        .benefits { margin: 30px 0; }
        .benefit-item { display: flex; align-items: flex-start; margin-bottom: 20px; }
        .benefit-icon { width: 24px; height: 24px; margin-right: 15px; margin-top: 2px; }
        .benefit-text { flex: 1; }
        .benefit-title { font-weight: 600; color: #2d3748; margin-bottom: 5px; }
        .benefit-desc { color: #4a5568; font-size: 14px; line-height: 1.5; }
        .cta-section { text-align: center; margin: 40px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .secondary-button { background: linear-gradient(135deg, #38b2ac 0%, #319795 100%); }
        .next-steps { background-color: #f7fafc; padding: 25px; border-radius: 12px; margin: 30px 0; }
        .next-steps h3 { color: #2d3748; margin: 0 0 20px 0; font-size: 18px; }
        .step { display: flex; align-items: center; margin-bottom: 15px; }
        .step-number { background: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 15px; }
        .step-text { color: #4a5568; }
        .community-section { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
        .community-section h3 { color: #744210; margin: 0 0 15px 0; }
        .community-section p { color: #975a16; margin: 0 0 20px 0; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
        .social-links { margin: 20px 0; }
        .social-links a { margin: 0 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Welcome to MobiRides!</h1>
            <p>Your car-sharing journey starts here</p>
        </div>
        
        <div class="content">
            <div class="welcome-message">
                <p>Hi ${data.user_name || data.first_name || 'there'}! 👋</p>
                <p>We're absolutely thrilled to welcome you to the MobiRides community! You've just joined Botswana's most trusted car-sharing platform, where convenience meets community.</p>
            </div>
            
            <div class="highlight-box">
                <h2>🎉 You're all set to explore!</h2>
                <p>Your account is ready, and thousands of vehicles are waiting for you across Botswana</p>
            </div>
            
            <div class="benefits">
                <h3 style="color: #2d3748; margin-bottom: 20px;">Why you'll love MobiRides:</h3>
                
                <div class="benefit-item">
                    <div class="benefit-icon">🚗</div>
                    <div class="benefit-text">
                        <div class="benefit-title">Diverse Fleet</div>
                        <div class="benefit-desc">From compact cars for city trips to SUVs for weekend adventures - find the perfect vehicle for every occasion</div>
                    </div>
                </div>
                
                <div class="benefit-item">
                    <div class="benefit-icon">💰</div>
                    <div class="benefit-text">
                        <div class="benefit-title">Affordable Rates</div>
                        <div class="benefit-desc">Save money with competitive hourly and daily rates, plus no hidden fees or surprise charges</div>
                    </div>
                </div>
                
                <div class="benefit-item">
                    <div class="benefit-icon">📱</div>
                    <div class="benefit-text">
                        <div class="benefit-title">Easy Booking</div>
                        <div class="benefit-desc">Book instantly through our app, unlock with your phone, and hit the road in minutes</div>
                    </div>
                </div>
                
                <div class="benefit-item">
                    <div class="benefit-icon">🛡️</div>
                    <div class="benefit-text">
                        <div class="benefit-title">Fully Insured</div>
                        <div class="benefit-desc">Drive with confidence knowing every trip is covered by comprehensive insurance</div>
                    </div>
                </div>
                
                <div class="benefit-item">
                    <div class="benefit-icon">🤝</div>
                    <div class="benefit-text">
                        <div class="benefit-title">Community Driven</div>
                        <div class="benefit-desc">Connect with local car owners and fellow travelers in our growing Botswana community</div>
                    </div>
                </div>
            </div>
            
            <div class="cta-section">
                <a href="${data.browse_cars_url || 'https://mobirides.com/cars'}" class="cta-button">🔍 Browse Available Cars</a>
                <a href="${data.profile_url || 'https://mobirides.com/profile'}" class="cta-button secondary-button">✏️ Complete Your Profile</a>
            </div>
            
            <div class="next-steps">
                <h3>🚀 Your next steps:</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text">Complete your profile with a photo and verify your driving license</div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text">Browse cars in your area and read reviews from other renters</div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text">Book your first car and experience the freedom of car-sharing!</div>
                </div>
            </div>
            
            <div class="community-section">
                <h3>🌟 Join Our Community</h3>
                <p>Connect with thousands of car-sharing enthusiasts across Botswana. Share tips, discover hidden gems, and make new friends!</p>
                <a href="${data.community_url || 'https://mobirides.com/community'}" class="cta-button" style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);">Join Community</a>
            </div>
            
            <div style="text-align: center; margin: 40px 0; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 12px;">
                <p style="color: #4a5568; margin: 0 0 15px 0;">💡 <strong>Pro Tip:</strong> Download our mobile app for the best experience!</p>
                <p style="color: #718096; font-size: 14px; margin: 0;">Get instant notifications, unlock cars with your phone, and manage bookings on the go.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Welcome to the MobiRides family! 🎉</p>
            <p>Need help getting started? We're here for you!</p>
            <p>
                📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a> | 
                📚 <a href="${data.help_center_url || 'https://mobirides.com/help'}">Help Center</a> | 
                🌐 <a href="${data.app_url || 'https://mobirides.com'}">Visit Website</a>
            </p>
            
            <div class="social-links">
                <a href="#">Facebook</a> | 
                <a href="#">Instagram</a> | 
                <a href="#">Twitter</a>
            </div>
            
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">
                You're receiving this email because you signed up for MobiRides.<br>
                MobiRides, Gaborone, Botswana
            </p>
        </div>
    </div>
</body>
</html>
    `
  },
  
  'welcome-host': {
    subject: '🏆 Welcome to MobiRides - Start earning with your car today!',
    html: (data: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Host - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .welcome-message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .earning-highlight { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; color: white; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 Welcome, Car Host!</h1>
            <p>Start earning with your vehicle today</p>
        </div>
        
        <div class="content">
            <div class="welcome-message">
                <p>Hi ${data.user_name || data.first_name || 'there'}! 👋</p>
                <p>Congratulations on joining MobiRides as a host! You're about to turn your car into a money-making asset while helping your community access affordable transportation.</p>
            </div>
            
            <div class="earning-highlight">
                <h2>💰 Start Earning Today!</h2>
                <p>List your car and start earning up to P2,000+ per month</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="${data.app_url || 'https://mobirides.com'}" class="cta-button">🚗 List Your Car Now</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Ready to become a successful host? Let's get started! 🚀</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}" style="color: #63b3ed;">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
    `
  },
  
  'password-reset': {
    subject: '🔐 Reset Your MobiRides Password',
    html: (data: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #fed7d7; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .security-notice { background: linear-gradient(135deg, #fef5e7 0%, #f7fafc 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #ed8936; }
        .security-notice h3 { color: #744210; margin: 0 0 10px 0; font-size: 16px; }
        .security-notice p { color: #975a16; margin: 0; font-size: 14px; }
        .reset-button { display: inline-block; background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .reset-button:hover { transform: translateY(-2px); }
        .expiry-notice { background-color: #f7fafc; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center; }
        .expiry-notice p { color: #4a5568; margin: 0; font-size: 14px; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Secure your MobiRides account</p>
        </div>

        <div class="content">
            <div class="message">
                <p>Hi there! 👋</p>
                <p>We received a request to reset your MobiRides password. If you made this request, click the button below to create a new password.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.reset_url || data.confirmation_url}" class="reset-button">🔑 Reset My Password</a>
            </div>

            <div class="security-notice">
                <h3>🛡️ Security Notice</h3>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged, and your account is still secure.</p>
            </div>

            <div class="expiry-notice">
                <p>⏰ This password reset link will expire in 1 hour for your security.</p>
            </div>

            <div style="margin: 30px 0; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 12px; text-align: center;">
                <p style="color: #4a5568; margin: 0 0 10px 0;">💡 <strong>Having trouble?</strong></p>
                <p style="color: #718096; font-size: 14px; margin: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #3182ce; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">${data.reset_url || data.confirmation_url}</p>
            </div>
        </div>

        <div class="footer">
            <p>Stay secure with MobiRides! 🔒</p>
            <p>Need help? We're here for you!</p>
            <p>
                📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a> |
                🌐 <a href="${data.app_url || 'https://mobirides.com'}">Visit Website</a>
            </p>

            <p style="font-size: 12px; color: #718096; margin-top: 20px;">
                You're receiving this email because a password reset was requested for your MobiRides account.<br>
                MobiRides, Gaborone, Botswana
            </p>
        </div>
    </div>
</body>
</html>
    `
  },

  'booking-confirmation': {
    subject: '🎉 Your MobiRides Booking is Confirmed!',
    html: (data: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .booking-details { background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #38a169; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .car-info { background-color: #f7fafc; padding: 20px; border-radius: 12px; margin: 30px 0; }
        .next-steps { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 15px; }
        .step-number { background: #3182ce; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 15px; margin-top: 2px; }
        .step-text { color: #2d3748; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Your adventure awaits</p>
        </div>

        <div class="content">
            <div style="font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6;">
                <p>Hi ${data.customerName || data.name || 'there'}! 🎊</p>
                <p>Great news! Your booking has been confirmed and you're all set for an amazing journey. Here are the details of your upcoming rental:</p>
            </div>

            <div class="booking-details">
                <h3 style="color: #2d3748; margin: 0 0 20px 0;">📅 Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Booking Reference:</span>
                    <span class="detail-value">${data.bookingReference || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup Date & Time:</span>
                    <span class="detail-value">${data.pickupDate || 'N/A'} at ${data.pickupTime || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup Location:</span>
                    <span class="detail-value">${data.pickupLocation || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Return Location:</span>
                    <span class="detail-value">${data.dropoffLocation || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value">P${data.totalAmount || 'N/A'}</span>
                </div>
            </div>

            <div class="car-info">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">🚗 Your Vehicle</h3>
                <div style="display: flex; align-items: center;">
                    ${data.carImage ? `<img src="${data.carImage}" alt="${data.carBrand} ${data.carModel}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">` : ''}
                    <div>
                        <div style="font-weight: 600; color: #2d3748; font-size: 18px;">${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}</div>
                        <div style="color: #4a5568;">Hosted by ${data.hostName || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="next-steps">
                <h3 style="color: #2d3748; margin: 0 0 20px 0;">🚀 What's Next?</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text">Download the MobiRides app for real-time updates and easy access</div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text">Arrive at the pickup location 15 minutes early with your ID</div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text">Complete a quick vehicle inspection with your host</div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-text">Enjoy your journey and drive safely!</div>
                </div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
                <a href="${data.app_url || 'https://mobirides.com/app'}" class="cta-button">📱 Download App</a>
                <a href="${data.support_url || 'https://mobirides.com/support'}" class="cta-button" style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);">📞 Contact Support</a>
            </div>

            <div style="background-color: #fef5e7; padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #ed8936;">
                <h4 style="color: #744210; margin: 0 0 10px 0;">💡 Important Reminders</h4>
                <ul style="color: #975a16; margin: 0; padding-left: 20px;">
                    <li>Valid driver's license required for pickup</li>
                    <li>Fuel policy: Return with same fuel level</li>
                    <li>Cleanliness: Please return the vehicle as received</li>
                    <li>Insurance: Your booking includes comprehensive coverage</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Safe travels with MobiRides! 🛣️</p>
            <p>Questions? We're here to help!</p>
            <p>
                📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a> |
                📱 <a href="${data.whatsapp_url || 'https://wa.me/2671234567'}">WhatsApp Support</a> |
                🌐 <a href="${data.app_url || 'https://mobirides.com'}">Visit Website</a>
            </p>

            <p style="font-size: 12px; color: #718096; margin-top: 20px;">
                You're receiving this email because you booked a vehicle on MobiRides.<br>
                MobiRides, Gaborone, Botswana
            </p>
        </div>
    </div>
</body>
</html>
    `
  },

  'owner-booking-notification': {
    subject: '📋 New Booking Request - Action Required',
    html: (data: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Request - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #bee3f8; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .booking-details { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #3182ce; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .renter-info { background-color: #f7fafc; padding: 20px; border-radius: 12px; margin: 30px 0; }
        .action-buttons { text-align: center; margin: 40px 0; }
        .approve-button { display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
        .decline-button { display: inline-block; background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
        .important-notice { background: linear-gradient(135deg, #fef5e7 0%, #f7fafc 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #ed8936; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 New Booking Request</h1>
            <p>Action required within 24 hours</p>
        </div>

        <div class="content">
            <div style="font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6;">
                <p>Hi ${data.hostName || data.name || 'there'}! 👋</p>
                <p>Great news! Someone is interested in renting your ${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}. Here's the booking request details:</p>
            </div>

            <div class="booking-details">
                <h3 style="color: #2d3748; margin: 0 0 20px 0;">📅 Booking Request Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Booking Reference:</span>
                    <span class="detail-value">${data.bookingReference || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Requested Dates:</span>
                    <span class="detail-value">${data.pickupDate || 'N/A'} to ${data.dropoffDate || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup Time:</span>
                    <span class="detail-value">${data.pickupTime || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup Location:</span>
                    <span class="detail-value">${data.pickupLocation || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Return Location:</span>
                    <span class="detail-value">${data.dropoffLocation || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Potential Earnings:</span>
                    <span class="detail-value">P${data.totalAmount || 'N/A'}</span>
                </div>
            </div>

            <div class="renter-info">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">👤 Renter Information</h3>
                <div style="display: flex; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #2d3748; font-size: 16px;">${data.customerName || 'N/A'}</div>
                        <div style="color: #4a5568;">Verified MobiRides member</div>
                    </div>
                </div>
            </div>

            <div class="important-notice">
                <h4 style="color: #744210; margin: 0 0 10px 0;">⚡ Action Required</h4>
                <p style="color: #975a16; margin: 0 0 10px 0;">You have 24 hours to respond to this booking request. If you don't respond within this timeframe, the request will automatically expire.</p>
                <ul style="color: #975a16; margin: 0; padding-left: 20px;">
                    <li>Review the dates and ensure your vehicle is available</li>
                    <li>Check that the pickup/return locations work for you</li>
                    <li>Verify the renter's profile if needed</li>
                    <li>Approve or decline the request</li>
                </ul>
            </div>

            <div class="action-buttons">
                <a href="${data.approve_url || 'https://mobirides.com/dashboard/bookings'}" class="approve-button">✅ Approve Request</a>
                <a href="${data.decline_url || 'https://mobirides.com/dashboard/bookings'}" class="decline-button">❌ Decline Request</a>
            </div>

            <div style="background-color: #f0fff4; padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #38a169;">
                <h4 style="color: #2d3748; margin: 0 0 10px 0;">💰 Earnings & Payments</h4>
                <p style="color: #4a5568; margin: 0 0 10px 0;">Once approved, you'll earn P${data.totalAmount || 'N/A'} for this rental (minus MobiRides service fee).</p>
                <p style="color: #4a5568; margin: 0;">Payment will be held in escrow until the rental is completed successfully.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #4a5568; margin: 0;">Need help or have questions?</p>
                <a href="${data.support_url || 'https://mobirides.com/support'}" style="color: #3182ce; text-decoration: none; font-weight: 600;">Contact our Host Support Team</a>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for being part of MobiRides! 🙏</p>
            <p>Questions about this booking request?</p>
            <p>
                📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Host Support</a> |
                📱 <a href="${data.whatsapp_url || 'https://wa.me/2671234567'}">WhatsApp Support</a> |
                🌐 <a href="${data.app_url || 'https://mobirides.com'}">Host Dashboard</a>
            </p>

            <p style="font-size: 12px; color: #718096; margin-top: 20px;">
                You're receiving this email because you have an active listing on MobiRides.<br>
                MobiRides, Gaborone, Botswana
            </p>
        </div>
    </div>
</body>
</html>
    `
  }
};

function getEmailTemplate(templateId: string, data: any) {
  const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  return {
    subject: template.subject,
    html: template.html(data)
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  templateId?: string;
  dynamicData?: Record<string, unknown>;
  type?: string;
  user_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, templateId, dynamicData, html } = await req.json() as EmailRequest;

    // Construct email payload
    const emailPayload: any = {
      from: "MobiRides <noreply@mobirides.com>",
      to: [to],
    };

    // Use rich HTML templates if templateId is provided
    if (templateId) {
      try {
        const template = getEmailTemplate(templateId, dynamicData || {});
        emailPayload.subject = template.subject;
        emailPayload.html = template.html;
      } catch (error) {
        return new Response(
          JSON.stringify({ error: `Template error: ${error.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (html) {
      // Fallback to custom HTML
      emailPayload.subject = subject || "Welcome to MobiRides";
      emailPayload.html = html;
    } else {
      return new Response(
        JSON.stringify({ error: "Either templateId with dynamicData or html content must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await resend.emails.send(emailPayload);

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in resend-service function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);