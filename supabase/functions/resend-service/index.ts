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
  'insurance-policy-confirmation': {
    subject: '✅ Your MobiRides Insurance Policy is Active',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc}.container{max-width:600px;margin:0 auto;background:white}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 20px;text-align:center}.header h1{color:white;margin:0;font-size:26px}.header p{color:#e2e8f0;margin:8px 0 0}.content{padding:40px 30px}.policy-box{background:linear-gradient(135deg,#f0f4ff 0%,#e8eeff 100%);padding:25px;border-radius:12px;margin:25px 0;border-left:4px solid #667eea}.row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px}.label{font-weight:600;color:#2d3748}.value{color:#4a5568}.btn{display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px}.footer{background:#2d3748;color:#a0aec0;padding:25px;text-align:center;font-size:13px}.footer a{color:#63b3ed;text-decoration:none}</style>
</head><body><div class="container">
<div class="header"><h1>🛡️ Insurance Policy Active</h1><p>Your vehicle is protected for this rental</p></div>
<div class="content">
<p style="font-size:17px;color:#2d3748">Hi ${data.name || 'there'},</p>
<p style="color:#4a5568;line-height:1.6">Your MobiRides Damage Protection policy is now active. Keep this for your records.</p>
<div class="policy-box">
<h3 style="color:#2d3748;margin:0 0 18px">📋 Policy Details</h3>
<div class="row"><span class="label">Policy Number:</span><span class="value">${data.policyNumber}</span></div>
<div class="row"><span class="label">Plan:</span><span class="value">${data.planName}</span></div>
<div class="row"><span class="label">Coverage Period:</span><span class="value">${data.startDate} – ${data.endDate}</span></div>
<div class="row"><span class="label">Total Premium:</span><span class="value">BWP ${data.premiumAmount}</span></div>
</div>
${data.downloadLink ? `<div style="text-align:center;margin:30px 0"><a href="${data.downloadLink}" class="btn">📄 Download Policy PDF</a></div>` : ''}
<div style="background:#fef5e7;padding:18px;border-radius:10px;border-left:4px solid #ed8936;margin-top:25px">
<p style="color:#744210;margin:0;font-size:14px">To file a claim: MobiRides app → My Bookings → Insurance → File a Claim.</p>
</div>
</div>
<div class="footer"><p>MobiRides Damage Protection | <a href="mailto:support@mobirides.com">support@mobirides.com</a></p></div>
</div></body></html>`
  },

  'insurance-claim-received': {
    subject: '📋 Claim Received – We\'re On It',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc}.container{max-width:600px;margin:0 auto;background:white}.header{background:linear-gradient(135deg,#3182ce 0%,#2c5282 100%);padding:40px 20px;text-align:center}.header h1{color:white;margin:0;font-size:26px}.header p{color:#bee3f8;margin:8px 0 0}.content{padding:40px 30px}.claim-box{background:linear-gradient(135deg,#ebf8ff 0%,#bee3f8 100%);padding:25px;border-radius:12px;margin:25px 0;border-left:4px solid #3182ce}.row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px}.label{font-weight:600;color:#2d3748}.value{color:#4a5568}.badge{display:inline-block;background:#3182ce;color:white;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600}.footer{background:#2d3748;color:#a0aec0;padding:25px;text-align:center;font-size:13px}.footer a{color:#63b3ed;text-decoration:none}</style>
</head><body><div class="container">
<div class="header"><h1>📋 Claim Received</h1><p>We've received your insurance claim</p></div>
<div class="content">
<p style="font-size:17px;color:#2d3748">Hi ${data.name || 'there'},</p>
<p style="color:#4a5568;line-height:1.6">We've received your claim and our team will review it within 2–3 business days.</p>
<div class="claim-box">
<h3 style="color:#2d3748;margin:0 0 18px">📄 Claim Summary</h3>
<div class="row"><span class="label">Claim Number:</span><span class="value">${data.claimNumber}</span></div>
<div class="row"><span class="label">Incident Date:</span><span class="value">${data.incidentDate}</span></div>
<div class="row"><span class="label">Status:</span><span class="value"><span class="badge">${data.status || 'Submitted'}</span></span></div>
</div>
<div style="background:#f0fff4;padding:18px;border-radius:10px;border-left:4px solid #38a169;margin-top:20px">
<p style="color:#2d3748;font-weight:600;margin:0 0 8px">What happens next?</p>
<ul style="color:#4a5568;margin:0;padding-left:18px;font-size:14px;line-height:1.8"><li>Our team will review your submission</li><li>We may contact you for additional information</li><li>You'll receive an email when a decision is made</li></ul>
</div>
</div>
<div class="footer"><p>Questions? <a href="mailto:claims@mobirides.com">claims@mobirides.com</a></p></div>
</div></body></html>`
  },

  'insurance-claim-update': {
    subject: '🔔 Claim Status Update',
    html: (data: any) => {
      const statusColors: Record<string, string> = {
        approved: '#38a169', rejected: '#e53e3e', under_review: '#3182ce',
        more_info_needed: '#ed8936', paid: '#38a169', closed: '#718096'
      };
      const color = statusColors[data.newStatus] || '#3182ce';
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc}.container{max-width:600px;margin:0 auto;background:white}.header{background:linear-gradient(135deg,${color} 0%,${color}cc 100%);padding:40px 20px;text-align:center}.header h1{color:white;margin:0;font-size:26px}.header p{color:rgba(255,255,255,0.85);margin:8px 0 0}.content{padding:40px 30px}.status-box{background:#f7fafc;padding:25px;border-radius:12px;margin:25px 0;border-left:4px solid ${color}}.badge{display:inline-block;background:${color};color:white;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;text-transform:capitalize}.footer{background:#2d3748;color:#a0aec0;padding:25px;text-align:center;font-size:13px}.footer a{color:#63b3ed;text-decoration:none}</style>
</head><body><div class="container">
<div class="header"><h1>🔔 Claim Update</h1><p>Your claim status has changed</p></div>
<div class="content">
<p style="font-size:17px;color:#2d3748">Hi ${data.name || 'there'},</p>
<p style="color:#4a5568;line-height:1.6">There's an update on your insurance claim.</p>
<div class="status-box">
<div style="margin-bottom:14px;font-size:14px"><span style="font-weight:600;color:#2d3748">Claim Number: </span><span style="color:#4a5568">${data.claimNumber}</span></div>
<div style="margin-bottom:14px"><span style="font-weight:600;color:#2d3748;font-size:14px">New Status: </span><span class="badge">${(data.newStatus || '').replace(/_/g, ' ')}</span></div>
<div style="font-size:14px"><span style="font-weight:600;color:#2d3748">Updated: </span><span style="color:#4a5568">${data.updatedAt}</span></div>
</div>
${data.notes ? `<div style="background:#fef5e7;padding:18px;border-radius:10px;border-left:4px solid #ed8936"><p style="color:#744210;font-weight:600;margin:0 0 6px">Notes from our team:</p><p style="color:#975a16;margin:0;font-size:14px">${data.notes}</p></div>` : ''}
</div>
<div class="footer"><p>Questions? <a href="mailto:claims@mobirides.com">claims@mobirides.com</a></p></div>
</div></body></html>`;
    }
  },

  'insurance-host-claim-notification': {
    subject: '⚠️ Insurance Claim Filed for Your Vehicle',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc}.container{max-width:600px;margin:0 auto;background:white}.header{background:linear-gradient(135deg,#ed8936 0%,#c05621 100%);padding:40px 20px;text-align:center}.header h1{color:white;margin:0;font-size:26px}.header p{color:#feebc8;margin:8px 0 0}.content{padding:40px 30px}.claim-box{background:linear-gradient(135deg,#fffaf0 0%,#feebc8 100%);padding:25px;border-radius:12px;margin:25px 0;border-left:4px solid #ed8936}.row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px}.label{font-weight:600;color:#2d3748}.value{color:#4a5568;text-transform:capitalize}.footer{background:#2d3748;color:#a0aec0;padding:25px;text-align:center;font-size:13px}.footer a{color:#63b3ed;text-decoration:none}</style>
</head><body><div class="container">
<div class="header"><h1>⚠️ Claim Filed on Your Vehicle</h1><p>An insurance claim has been submitted</p></div>
<div class="content">
<p style="font-size:17px;color:#2d3748">Hi ${data.name || 'there'},</p>
<p style="color:#4a5568;line-height:1.6">A renter has filed an insurance claim for an incident involving your <strong>${data.carName}</strong>. Our claims team is reviewing the submission.</p>
<div class="claim-box">
<h3 style="color:#2d3748;margin:0 0 18px">📄 Claim Details</h3>
<div class="row"><span class="label">Claim Number:</span><span class="value">${data.claimNumber}</span></div>
<div class="row"><span class="label">Vehicle:</span><span class="value">${data.carName}</span></div>
<div class="row"><span class="label">Incident Date:</span><span class="value">${data.incidentDate}</span></div>
<div class="row"><span class="label">Incident Type:</span><span class="value">${(data.incidentType || '').replace(/_/g, ' ')}</span></div>
</div>
${data.description ? `<div style="background:#f7fafc;padding:18px;border-radius:10px;margin-top:20px"><p style="color:#2d3748;font-weight:600;margin:0 0 8px;font-size:14px">Incident Description:</p><p style="color:#4a5568;margin:0;font-size:14px">${data.description}</p></div>` : ''}
<div style="background:#f0fff4;padding:18px;border-radius:10px;border-left:4px solid #38a169;margin-top:20px">
<p style="color:#2d3748;margin:0;font-size:14px">Our claims team will handle this process. <strong>No action is required from you at this time.</strong></p>
</div>
</div>
<div class="footer"><p>Questions? <a href="mailto:claims@mobirides.com">claims@mobirides.com</a></p></div>
</div></body></html>`
  },

  'booking-request': {
    subject: '📋 New Booking Request - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Request - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #feebc8; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #dd6b20; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .renter-info { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .next-steps { background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .step-number { background: #38a169; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; }
        .step-text { color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 New Booking Request!</h1>
            <p>Someone wants to rent your vehicle</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.hostName || data.name || 'there'}!</p>
                <p>Great news! You have a new booking request for your vehicle <strong>${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}</strong>.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📅 Booking Details</h3>
                <div class="detail-row"><span class="detail-label">Booking Reference:</span><span class="detail-value">${data.bookingReference || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Rental Period:</span><span class="detail-value">${data.startDate || 'N/A'} to ${data.endDate || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Total Earnings:</span><span class="detail-value">P${data.earnings || 'N/A'}</span></div>
            </div>
            <div class="renter-info">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">👤 Renter Information</h3>
                <div class="detail-row"><span class="detail-label">Name:</span><span class="detail-value">${data.renterName || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Verification:</span><span class="detail-value">${data.verificationStatus || 'Verified'}</span></div>
            </div>
            <div class="next-steps">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">💡 Next Steps</h3>
                <div class="step"><div class="step-number">1</div><div class="step-text">Review the booking details and renter profile</div></div>
                <div class="step"><div class="step-number">2</div><div class="step-text">Accept or decline the request within 24 hours</div></div>
                <div class="step"><div class="step-number">3</div><div class="step-text">Prepare vehicle for handover if accepted</div></div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.manage_url || 'https://mobirides.com/host/dashboard'}" style="display: inline-block; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">✓ Review Booking Request</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions about hosting?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Host Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'system-notification': {
    subject: '🔔 System Notification - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Notification - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #718096 0%, #4a5568 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #cbd5e0; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .alert-box { background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #d69e2e; }
        .alert-title { font-weight: 600; color: #2d3748; margin-bottom: 10px; font-size: 16px; }
        .alert-content { color: #4a5568; line-height: 1.6; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 System Notification</h1>
            <p>Important update from MobiRides</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>${data.message || 'You have a new notification from MobiRides.'}</p>
            </div>
            <div class="alert-box">
                <div class="alert-title">${data.notificationTitle || 'Notification Details'}</div>
                <div class="alert-content">${data.notificationContent || ''}</div>
            </div>
            ${data.action_url ? `<div style="text-align: center; margin: 30px 0;">
                <a href="${data.action_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">${data.action_text || 'View Details'}</a>
            </div>` : ''}
            <p style="color: #718096; font-size: 14px; margin-top: 30px;">This is an automated notification. Please do not reply to this email.</p>
        </div>
        <div class="footer">
            <p>Need help?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'email-confirmation': {
    subject: '📧 Confirm Your Email - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Confirmation - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .button-container { text-align: center; margin: 40px 0; }
        .confirm-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .fallback { background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; }
        .fallback p { margin: 5px 0; color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Confirm Your Email</h1>
            <p>One last step to get started</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>Thank you for signing up for MobiRides. Please confirm your email address by clicking the button below:</p>
            </div>
            <div class="button-container">
                <a href="${data.confirmation_url || 'https://mobirides.com/confirm-email?token=' + (data.token || '')}" class="confirm-button">✓ Confirm Email</a>
            </div>
            <div class="fallback">
                <p>Button not working? Copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 14px;">${data.confirmation_url || 'https://mobirides.com/confirm-email?token=' + (data.token || 'YOUR_TOKEN')}</p>
            </div>
            <p style="color: #718096; font-size: 14px; margin-top: 30px;">If you didn't create an account with MobiRides, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Questions?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'verification-complete': {
    subject: '✅ Account Verification Complete - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Complete - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #38a169; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .features { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .feature-item { display: flex; align-items: center; margin-bottom: 12px; }
        .feature-icon { color: #38a169; font-size: 20px; margin-right: 12px; }
        .feature-text { color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Verification Complete!</h1>
            <p>Welcome to full MobiRides access</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>Great news! Your account verification is now complete. You now have full access to all MobiRides features.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📋 Verification Summary</h3>
                <div class="detail-row"><span class="detail-label">Verified On:</span><span class="detail-value">${data.verificationDate || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Verification Type:</span><span class="detail-value">${data.verificationType || 'Identity & License'}</span></div>
            </div>
            <div class="features">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">✨ What's Now Available</h3>
                <div class="feature-item"><span class="feature-icon">✓</span><span class="feature-text">Browse and book vehicles</span></div>
                <div class="feature-item"><span class="feature-icon">✓</span><span class="feature-text">List your own vehicle as a host</span></div>
                <div class="feature-item"><span class="feature-icon">✓</span><span class="feature-text">Access all payment methods</span></div>
                <div class="feature-item"><span class="feature-icon">✓</span><span class="feature-text">Full insurance coverage</span></div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboard_url || 'https://mobirides.com/dashboard'}" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">🚀 Go to Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions about your account?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'return-reminder': {
    subject: '🔄 Return Reminder - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Return Reminder - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #bee3f8; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #3182ce; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .next-steps { background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .step-number { background: #38a169; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; }
        .step-text { color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Return Reminder</h1>
            <p>Your rental period ends soon</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>This is a friendly reminder that your rental period ends <strong>${data.returnDate || 'soon'}</strong>. Please ensure timely return to avoid any late fees.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📅 Return Details</h3>
                <div class="detail-row"><span class="detail-label">Booking Reference:</span><span class="detail-value">${data.bookingReference || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Vehicle:</span><span class="detail-value">${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Return Date:</span><span class="detail-value">${data.returnDate || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Return Location:</span><span class="detail-value">${data.returnLocation || 'N/A'}</span></div>
            </div>
            <div class="next-steps">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">💡 Before Returning</h3>
                <div class="step"><div class="step-number">1</div><div class="step-text">Return vehicle to the designated location</div></div>
                <div class="step"><div class="step-number">2</div><div class="step-text">Ensure fuel level matches pickup level</div></div>
                <div class="step"><div class="step-number">3</div><div class="step-text">Remove personal belongings and check for items</div></div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.booking_url || 'https://mobirides.com/dashboard/bookings'}" style="display: inline-block; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 View Booking Details</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions about returning your vehicle?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'rental-reminder': {
    subject: '⏰ Rental Starts Tomorrow - MobiRides Reminder',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rental Reminder - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #feebc8; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #dd6b20; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .next-steps { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .step-number { background: #3182ce; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; }
        .step-text { color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Rental Starts Tomorrow!</h1>
            <p>Your adventure awaits</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>This is a friendly reminder that your rental period begins <strong>tomorrow</strong>. We're excited to have you!</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📅 Rental Details</h3>
                <div class="detail-row"><span class="detail-label">Booking Reference:</span><span class="detail-value">${data.bookingReference || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Vehicle:</span><span class="detail-value">${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Pickup Date:</span><span class="detail-value">${data.pickupDate || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Pickup Location:</span><span class="detail-value">${data.pickupLocation || 'N/A'}</span></div>
            </div>
            <div class="next-steps">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">💡 Reminder Checklist</h3>
                <div class="step"><div class="step-number">1</div><div class="step-text">Bring your valid driver's license</div></div>
                <div class="step"><div class="step-number">2</div><div class="step-text">Bring proof of identity</div></div>
                <div class="step"><div class="step-number">3</div><div class="step-text">Review the vehicle condition report</div></div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.booking_url || 'https://mobirides.com/dashboard/bookings'}" style="display: inline-block; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 View Booking Details</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions before your trip?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'handover-ready': {
    subject: '🚗 Your Vehicle is Ready for Handover - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Handover Ready - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #805ad5; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .next-steps { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .step-number { background: #3182ce; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; }
        .step-text { color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Ready for Handover!</h1>
            <p>Your vehicle is waiting for you</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>Great news! Your vehicle is ready for handover. Please proceed to the pickup location at your scheduled time.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📅 Handover Details</h3>
                <div class="detail-row"><span class="detail-label">Booking Reference:</span><span class="detail-value">${data.bookingReference || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Vehicle:</span><span class="detail-value">${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Pickup Location:</span><span class="detail-value">${data.pickupLocation || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Scheduled Time:</span><span class="detail-value">${data.scheduledTime || 'N/A'}</span></div>
            </div>
            <div class="next-steps">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📋 What to Bring</h3>
                <div class="step"><div class="step-number">1</div><div class="step-text">Valid driver's license</div></div>
                <div class="step"><div class="step-number">2</div><div class="step-text">Proof of identity (ID/Passport)</div></div>
                <div class="step"><div class="step-number">3</div><div class="step-text">Payment method for security deposit</div></div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.booking_url || 'https://mobirides.com/dashboard/bookings'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 View Booking Details</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions about your handover?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'wallet-topup': {
    subject: '💳 Wallet Top-up Successful - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wallet Top-up - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #38a169; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Wallet Top-up Successful!</h1>
            <p>Your MobiRides wallet has been credited</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>Great news! Your MobiRides wallet has been successfully topped up.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">💰 Transaction Details</h3>
                <div class="detail-row"><span class="detail-label">Amount Added:</span><span class="detail-value">P${data.amount || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">New Balance:</span><span class="detail-value">P${data.newBalance || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Payment Method:</span><span class="detail-value">${data.paymentMethod || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Transaction ID:</span><span class="detail-value">${data.transactionId || 'N/A'}</span></div>
            </div>
            <p style="color: #4a5568;">You can now use your wallet balance for bookings, rentals, and other MobiRides services.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.wallet_url || 'https://mobirides.com/dashboard/wallet'}" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">💳 View Wallet</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions about your wallet?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'payment-failed': {
    subject: '⚠️ Payment Failed - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #fed7d7; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #e53e3e; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .next-steps { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .step-number { background: #3182ce; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; }
        .step-text { color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Payment Failed</h1>
            <p>Action required to complete your booking</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>We were unable to process your payment for booking <strong>${data.bookingReference || 'N/A'}</strong>.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📋 Payment Details</h3>
                <div class="detail-row"><span class="detail-label">Booking Reference:</span><span class="detail-value">${data.bookingReference || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Amount:</span><span class="detail-value">P${data.amount || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Failure Reason:</span><span class="detail-value">${data.failureReason || 'Payment declined'}</span></div>
            </div>
            <div class="next-steps">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">💡 What to Do Next</h3>
                <div class="step"><div class="step-number">1</div><div class="step-text">Check your card details and try again</div></div>
                <div class="step"><div class="step-number">2</div><div class="step-text">Use a different payment method</div></div>
                <div class="step"><div class="step-number">3</div><div class="step-text">Contact your bank if the issue persists</div></div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.retry_url || 'https://mobirides.com/dashboard/bookings'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">🔄 Retry Payment</a>
            </div>
        </div>
        <div class="footer">
            <p>Need help?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'booking-cancelled': {
    subject: '❌ Your MobiRides Booking Has Been Cancelled',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cancelled - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #fed7d7; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #e53e3e; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .next-steps { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); padding: 25px; border-radius: 12px; margin: 30px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .step-number { background: #3182ce; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; }
        .step-text { color: #2d3748; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Booking Cancelled</h1>
            <p>We're sorry this didn't work out</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>We regret to inform you that your booking with reference <strong>${data.bookingReference || 'N/A'}</strong> has been cancelled.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📅 Booking Details</h3>
                <div class="detail-row"><span class="detail-label">Booking Reference:</span><span class="detail-value">${data.bookingReference || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Vehicle:</span><span class="detail-value">${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Cancelled Date:</span><span class="detail-value">${data.cancelledDate || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Reason:</span><span class="detail-value">${data.cancellationReason || 'Host cancellation'}</span></div>
            </div>
            <div class="next-steps">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">💡 What's Next?</h3>
                <div class="step"><div class="step-number">1</div><div class="step-text">Your payment will be refunded within 3-5 business days</div></div>
                <div class="step"><div class="step-number">2</div><div class="step-text">Browse other available vehicles in your area</div></div>
                <div class="step"><div class="step-number">3</div><div class="step-text">Contact support if you need assistance</div></div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.browse_cars_url || 'https://mobirides.com/cars'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">🔍 Browse Available Cars</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions about your refund?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
  },

  'payment-received': {
    subject: '💰 Payment Received - MobiRides',
    html: (data: any) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Received - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .message { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
        .details-box { background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #38a169; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #2d3748; }
        .detail-value { color: #4a5568; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Payment Received!</h1>
            <p>Your payment has been successfully processed</p>
        </div>
        <div class="content">
            <div class="message">
                <p>Hi ${data.customerName || data.name || 'there'}!</p>
                <p>Great news! Your payment for booking <strong>${data.bookingReference || 'N/A'}</strong> has been successfully processed.</p>
            </div>
            <div class="details-box">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">📅 Payment Details</h3>
                <div class="detail-row"><span class="detail-label">Booking Reference:</span><span class="detail-value">${data.bookingReference || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Amount Paid:</span><span class="detail-value">P${data.amount || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Payment Method:</span><span class="detail-value">${data.paymentMethod || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Transaction ID:</span><span class="detail-value">${data.transactionId || 'N/A'}</span></div>
            </div>
            <p style="color: #4a5568;">Your booking is now confirmed. You'll receive a reminder email 24 hours before your pickup time.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.booking_url || 'https://mobirides.com/dashboard/bookings'}" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 View Booking Details</a>
            </div>
        </div>
        <div class="footer">
            <p>Questions about your payment?</p>
            <p>📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Payment Support</a></p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">MobiRides, Gaborone, Botswana</p>
        </div>
    </div>
</body>
</html>`
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
        JSON.stringify({ error: `Template error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
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

Deno.serve(handler);