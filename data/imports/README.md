# Data Imports

This folder contains staged data import files awaiting processing.

## Import Types

| Type | Description | Status |
|------|-------------|--------|
| Users | Bulk user imports | Pending |
| Cars | Vehicle imports | Pending |
| Promo codes | Promo code imports | Pending |

## Import Workflow

1. Stage file in this folder
2. Validate format
3. Review data
4. Process via admin panel/API
5. Archive processed files

## Validation Checkpoints

- [ ] File format correct
- [ ] Required fields present
- [ ] Data types valid
- [ ] References exist
- [ ] Duplicate check passed

## Pending Imports

| File | Records | Staged | Status |
|------|---------|--------|--------|
| - | - | - | - |

## Related Files

- [../templates/](../templates/) - Import templates
- [../exports/](../exports/) - Export results