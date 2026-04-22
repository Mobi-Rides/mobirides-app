# Data Exports

This folder contains exported data files and dumps.

## Export Types

| Type | Description | Format |
|------|-------------|--------|
| Daily dumps | Daily data snapshots | SQL |
| Query results | Custom query results | CSV, JSON |
| User data | User data exports | JSON |
| Bookings | Booking reports | CSV |

## Naming Convention

```
export-YYYYMMDD-type-description.ext
```

Examples:
- `export-20260419-users-active.json`
- `export-20260419-bookings-monthly.csv`
- `export-20260419-schema-full.sql`

## Export Frequency

| Data Type | Frequency |
|-----------|-----------|
| Full schema | Weekly |
| User data | Daily |
| Bookings | Daily |
| Transactions | Weekly |

## Usage

1. Exports are generated via admin panel or API
2. Files are timestamped
3. Compress large files before storage
4. Delete exports older than 30 days

## Related Files

- [../templates/](../templates/) - Export templates
- [../backups/](../backups/) - Database backups