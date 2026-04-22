# Mobirides Database Schema Overview

This document provides an overview of the Mobirides database schema.

## Core Tables

### Users & Authentication
| Table | Description |
|-------|-------------|
| `auth.users` | Supabase auth users |
| `profiles` | Extended user profiles |
| `user_roles` | Role assignments |

### Vehicles
| Table | Description |
|-------|-------------|
| `cars` | Vehicle listings |
| `car_images` | Vehicle photos |
| `car_availability` | Availability schedules |

### Bookings
| Table | Description |
|-------|-------------|
| `bookings` | Rental bookings |
| `booking_extensions` | Rental extensions |
| `booking_history` | Booking audit log |

### Financial
| Table | Description |
|-------|-------------|
| `wallets` | User wallets |
| `wallet_transactions` | Transaction records |
| `withdrawals` | Withdrawal requests |
| `promo_codes` | Promo code definitions |

### Handover System
| Table | Description |
|-------|-------------|
| `handover_sessions` | Handover sessions |
| `vehicle_condition_reports` | Condition reports |
| `handover_step_completion` | Step tracking |
| `handover_photos` | Handover photos |

### Insurance
| Table | Description |
|-------|-------------|
| `insurance_policies` | Insurance policies |
| `insurance_claims` | Insurance claims |

### Communication
| Table | Description |
|-------|-------------|
| `conversations` | Chat threads |
| `conversation_messages` | Messages |
| `notifications` | Push notifications |

### Platform
| Table | Description |
|------|------------|
| `reviews` | User reviews |
| `platform_settings` | System config |
| `admin_activity_logs` | Audit logs |

## Key Relationships

```
users -> profiles (1:1)
users -> user_roles (1:many)
users -> wallets (1:1)
cars -> bookings (1:many)
bookings -> handover_sessions (1:many)
bookings -> insurance_claims (1:many)
conversations -> conversation_messages (1:many)
```

## RLS Policies

All tables have Row Level Security enabled:
- Public read for active listings
- Owner write for personal data
- Admin full access

## Last Updated

Schema version: April 2026