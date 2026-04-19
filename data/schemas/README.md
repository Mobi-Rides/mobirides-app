# Database Schemas

This folder contains database schema definitions and documentation.

## Files

| File | Description |
|------|-------------|
| [schema.sql](schema.sql) | Main schema definition |
| [tables/](tables/) | Individual table definitions |
| [relationships.md](relationships.md) | ER diagram documentation |

## Schema Reference

### Core Tables
- `profiles` - User profiles
- `users` - User accounts
- `cars` - Vehicle listings
- `bookings` - Rental bookings
- `conversations` - Chat messages

### Financial Tables
- `wallets` - User wallets
- `transactions` - Financial transactions
- `withdrawals` - Withdrawal requests

### Handover Tables
- `handover_sessions` - Vehicle handover records
- `vehicle_condition_reports` - Condition reports
- `handover_step_completion` - Step tracking

### Insurance Tables
- `insurance_policies` - Insurance cover
- `insurance_claims` - Claims records

## Usage

Reference these schemas when:
- Writing database queries
- Creating migrations
- Understanding data relationships
- Debugging data issues

## Related Files

- [../supabase/migrations/](../supabase/migrations/) - Database migrations
- [../src/types/](../src/types/) - TypeScript type definitions