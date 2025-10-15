// Enhanced email templates for MobiRides
// Rich HTML templates with personalized content and engaging design

const EMAIL_TEMPLATES = {
  'booking-confirmation': {
    subject: '🎉 Your MobiRides Booking is Confirmed!',
    html: (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .booking-details { background-color: #f7fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #667eea; }
        .booking-details h3 { color: #2d3748; margin: 0 0 20px 0; font-size: 18px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #4a5568; }
        .detail-value { color: #2d3748; }
        .car-info { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; color: white; }
        .car-info h2 { margin: 0 0 10px 0; font-size: 22px; }
        .car-info p { margin: 0; font-size: 16px; }
        .next-steps { background-color: #f0fff4; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #48bb78; }
        .next-steps h3 { color: #2d3748; margin: 0 0 20px 0; font-size: 18px; }
        .step { display: flex; align-items: center; margin-bottom: 15px; }
        .step-number { background: #48bb78; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 15px; }
        .step-text { color: #2d3748; }
        .cta-section { text-align: center; margin: 40px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
        .footer a { color: #63b3ed; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Your MobiRides adventure awaits</p>
        </div>

        <div class="content">
            <p style="font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6;">
                Hi ${data.customerName || data.name || 'there'}! 👋<br>
                Great news! Your booking has been confirmed and you're all set for an amazing trip.
            </p>

            <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Booking Reference:</span>
                    <span class="detail-value">${data.bookingReference || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup Date:</span>
                    <span class="detail-value">${data.pickupDate || 'N/A'}</span>
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
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value" style="font-weight: 700; color: #48bb78;">BWP ${data.totalAmount || 0}</span>
                </div>
            </div>

            <div class="car-info">
                <h2>🚗 Your Vehicle</h2>
                <p>${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}</p>
                ${data.carImage ? `<img src="${data.carImage}" alt="Car" style="max-width: 200px; margin-top: 15px; border-radius: 8px;">` : ''}
            </div>

            <div class="next-steps">
                <h3>🚀 What's Next?</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text">You'll receive a WhatsApp message with pickup instructions</div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text">Arrive at the pickup location at your scheduled time</div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text">Complete the handover process with the host</div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-text">Enjoy your trip and return the vehicle on time</div>
                </div>
            </div>

            <div style="text-align: center; margin: 40px 0; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 12px;">
                <p style="color: #4a5568; margin: 0 0 15px 0;">💡 <strong>Important:</strong> Please arrive 15 minutes early for pickup</p>
                <p style="color: #718096; font-size: 14px; margin: 0;">Bring your ID, driving license, and any agreed payment method</p>
            </div>

            <div class="cta-section">
                <a href="${data.app_url || '#'}" class="cta-button">📱 View Booking Details</a>
            </div>
        </div>

        <div class="footer">
            <p>Happy travels with MobiRides! 🛣️</p>
            <p>Need help? Contact us anytime.</p>
            <p>
                📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a> |
                🌐 <a href="${data.app_url || '#'}">Visit App</a>
            </p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
    `
  },

  'owner-booking-notification': {
    subject: '📋 New Booking Request - Action Required',
    html: (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Request - MobiRides</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .booking-details { background-color: #f7fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #48bb78; }
        .booking-details h3 { color: #2d3748; margin: 0 0 20px 0; font-size: 18px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .detail-label { font-weight: 600; color: #4a5568; }
        .detail-value { color: #2d3748; }
        .customer-info { background: linear-gradient(135deg, #bee3f8 0%, #4299e1 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; color: white; }
        .customer-info h2 { margin: 0 0 10px 0; font-size: 22px; }
        .customer-info p { margin: 0; font-size: 16px; }
        .action-required { background-color: #fff5f5; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #e53e3e; }
        .action-required h3 { color: #c53030; margin: 0 0 15px 0; font-size: 18px; }
        .action-required p { color: #742a2a; margin: 0 0 15px 0; }
        .action-required ul { color: #742a2a; margin: 0; padding-left: 20px; }
        .action-required li { margin-bottom: 8px; }
        .cta-section { text-align: center; margin: 40px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
        .secondary-button { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); }
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
            <p style="font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6;">
                Hi ${data.hostName || data.name || 'there'}! 👋<br>
                Great news! Someone wants to rent your ${data.carBrand || 'N/A'} ${data.carModel || 'N/A'}.
            </p>

            <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Booking Reference:</span>
                    <span class="detail-value">${data.bookingReference || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup Date:</span>
                    <span class="detail-value">${data.pickupDate || 'N/A'}</span>
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
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value" style="font-weight: 700; color: #48bb78;">BWP ${data.totalAmount || 0}</span>
                </div>
            </div>

            <div class="customer-info">
                <h2>👤 Customer Information</h2>
                <p>${data.customerName || 'Customer'}</p>
            </div>

            <div class="action-required">
                <h3>⚡ Action Required</h3>
                <p>You have 24 hours to respond to this booking request. Here's what you need to do:</p>
                <ul>
                    <li>Review the customer's profile and booking details</li>
                    <li>Confirm vehicle availability for the requested dates</li>
                    <li>Accept or decline the booking request</li>
                    <li>If accepted, prepare for the handover process</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 40px 0; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 12px;">
                <p style="color: #4a5568; margin: 0 0 15px 0;">⏰ <strong>Response Time:</strong> 24 hours</p>
                <p style="color: #718096; font-size: 14px; margin: 0;">Bookings not responded to within 24 hours will be automatically cancelled</p>
            </div>

            <div class="cta-section">
                <a href="${data.app_url || '#'}" class="cta-button">✅ Review Booking Request</a>
                <a href="${data.app_url || '#'}" class="cta-button secondary-button">📱 View in App</a>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for being part of MobiRides! 🚗</p>
            <p>Need help? Contact our support team.</p>
            <p>
                📧 <a href="mailto:${data.support_email || 'support@mobirides.com'}">Contact Support</a> |
                🌐 <a href="${data.app_url || '#'}">Visit App</a>
            </p>
            <p style="font-size: 12px; color: #718096; margin-top: 20px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
    `
  },

  'welcome-renter': {
    subject: '🚗 Welcome to MobiRides - Your car-sharing adventure begins!',
    html: (data) => `
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
                <a href="${data.browse_cars_url || '#'}" class="cta-button">🔍 Browse Available Cars</a>
                <a href="${data.profile_url || '#'}" class="cta-button secondary-button">✏️ Complete Your Profile</a>
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
                <a href="${data.community_url || '#'}" class="cta-button" style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);">Join Community</a>
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
                📚 <a href="${data.help_center_url || '#'}">Help Center</a> | 
                🌐 <a href="${data.app_url || '#'}">Visit Website</a>
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
    html: (data) => `
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
                <a href="${data.app_url || '#'}" class="cta-button">🚗 List Your Car Now</a>
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
  }
};

function getEmailTemplate(templateId, data) {
    const template = EMAIL_TEMPLATES[templateId];
    if (!template) {
        throw new Error(`Template ${templateId} not found`);
    }

    return {
        subject: template.subject,
        html: template.html(data)
    };
}

function getAvailableTemplates() {
    return Object.keys(EMAIL_TEMPLATES);
}

export { EMAIL_TEMPLATES, getEmailTemplate, getAvailableTemplates };
