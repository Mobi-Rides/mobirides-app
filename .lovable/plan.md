

# Fix: Insurance Package Pricing

## What's Wrong

The `insurance_packages` table has `premium_percentage` values that are far too high:
- Basic: 0.25 (25% of daily rental)
- Standard: 0.50 (50% of daily rental)
- Premium: 1.00 (100% of daily rental)

For a car at P500/day for 5 days (P2,500 rental), the "Premium" package would cost P2,500 -- equal to the entire rental. These should be calibrated to the Botswana market at 5%, 8%, and 12%.

## Fix

### Database migration to update premium percentages

Run a SQL migration to update the three insurance packages:

```sql
UPDATE insurance_packages SET premium_percentage = 0.05 WHERE slug = 'basic';
UPDATE insurance_packages SET premium_percentage = 0.08 WHERE slug = 'standard';
UPDATE insurance_packages SET premium_percentage = 0.12 WHERE slug = 'premium';
```

This aligns with the platform's documented insurance model (5% Basic, 8% Standard, 12% Premium) and requires no frontend code changes since the UI already reads `premium_percentage` from the database.

### Summary

| Change | Detail |
|--------|--------|
| Database migration | Update 3 rows in `insurance_packages` to correct percentages |
| Frontend changes | None needed |

