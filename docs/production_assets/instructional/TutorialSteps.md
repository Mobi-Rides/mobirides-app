# Mobi Tutorial Steps (Mobi AI Assistant)
**Last updated:** March 9, 2026  
**Version:** 1.0 (TUTORIAL_VERSION 1)

## 1. Universal Steps (Both Roles)
These steps are shown to all users regardless of their role (Renter or Host).

| Key | Route | Title | Content | Position |
|-----|-------|-------|---------|----------|
| `welcome` | `/` | Hey there! I'm Mobi 👋 | Welcome to MobiRides! I'm your personal guide and I'll walk you through everything you need to know. Let's get started! | Center |
| `home-search` | `/` | Find your perfect ride 🔍 | Use the search bar to find cars by location, date, or type. You can filter results to match exactly what you need. | Bottom |
| `home-featured` | `/` | Check out these beauties 🚗 | Here are some of our most popular cars. Tap any card to see full details, photos, and reviews. | Top |
| `profile` | `/profile` | Your profile 👤 | Keep your profile up to date — a complete profile builds trust with other users. | Center |
| `notifications` | `/notifications` | Stay in the loop 🔔 | You'll get notifications for bookings, messages, and important updates. Never miss a thing! | Center |
| `messages` | `/messages` | Chat with hosts & renters 💬 | Have a question? Message the other party directly. Quick communication makes for smooth rentals. | Center |
| `tutorial-complete` | `/` | You're all set! 🎉 | That's the basics! You can restart this tutorial anytime from the menu. Happy riding! | Center |

## 2. Renter-Specific Steps
These steps are only visible to users in the Renter role.

| Key | Route | Title | Content | Position |
|-----|-------|-------|---------|----------|
| `renter-car-details` | `/cars/` | Car details & booking 📋 | This is where the magic happens! Check out photos, features, reviews, and the host's profile. When you're ready, hit Book to reserve it. | Center |
| `renter-bookings` | `/bookings` | Your bookings hub 📅 | All your reservations live here. Track status, manage upcoming trips, and view past rentals. | Center |
| `renter-verification` | `/verification` | Get verified ✅ | Verify your identity and driver's license to unlock booking. It's quick and keeps everyone safe! | Center |
| `renter-map` | `/map` | Explore nearby cars 🗺️ | Use the map to discover cars near you. Tap markers for quick details and directions. | Center |

## 3. Host-Specific Steps
These steps are only visible to users in the Host role.

| Key | Route | Title | Content | Position |
|-----|-------|-------|---------|----------|
| `host-dashboard` | `/dashboard` | Your host command centre 📊 | Welcome to your dashboard! See earnings, active bookings, and how your cars are performing — all at a glance. | Center |
| `host-add-car` | `/add-car` | List your first car 🚘 | Ready to earn? Fill in the details, upload great photos, and set a competitive price. I'll guide you through each step. | Center |
| `host-bookings` | `/host-bookings` | Manage booking requests 📩 | Approve or decline requests here. Quick responses mean happier renters and better reviews! | Center |
| `host-wallet` | `/wallet` | Your earnings 💰 | Track your balance, view transaction history, and manage payouts. MobiRides handles the commission automatically. | Center |

## 4. Technical Implementation Notes
- **Triggering**: Tutorials auto-load on first login or when the `TUTORIAL_VERSION` is bumped.
- **Progress Tracking**: Completion of each step is tracked in the `user_tutorial_progress` database table.
- **Customization**: The `data-tutorial-target` attribute is used in the UI to anchor bubbles to specific elements.
