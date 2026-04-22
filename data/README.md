# Mobirides Data Room

This folder contains data assets for the Mobirides application organized by category.

## Folder Structure

```
data/
├── README.md         # This file
├── schemas/         # Database schemas and ER diagrams
├── templates/       # Data import/export templates
├── exports/        # Exported data dumps
├── imports/        # Data import files
├── backups/        # Database backups
└── reports/        # Data analysis and reports
```

## Categories

### Schemas (`schemas/`)
- Database table definitions
- Entity relationship diagrams
- Data dictionaries
- RLS policies

### Templates (`templates/`)
- CSV import templates
- JSON data formats
- Sample data files

### Exports (`exports/`)
- Data dumps
- Query results
- Generated reports

### Imports (`imports/`)
- Staged import files
- Data transformation scripts

### Backups (`backups/`)
- Database backups
- Schema snapshots
- Configuration backups

### Reports (`reports/`)
- Data analysis
- Usage reports
- Audit reports

## Usage

- Use `schemas/` for understanding data structure
- Use `templates/` for data imports
- Exports are auto-generated to this folder
- Backups follow naming: `backup-YYYYMMDD-description.sql`
- Reports are generated for analysis

## Related Paths

- [supabase/](../supabase/) - Database functions and migrations
- [src/types/](../src/types/) - TypeScript type definitions
- [docs/](../docs/) - Project documentation