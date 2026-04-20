# Data Import/Export Templates

This folder contains templates for data import and export operations.

## Import Templates

| Template | Format | Description |
|----------|--------|-------------|
| [users.csv](users.csv) | CSV | Bulk user import |
| [cars.csv](cars.csv) | CSV | Vehicle import |
| [promo-codes.json](promo-codes.json) | JSON | Promo code import |

## Export Templates

| Template | Format | Description |
|----------|--------|-------------|
| [booking-export.json](booking-export.json) | JSON | Booking data export |
| [user-export.json](user-export.json) | JSON | User data export |

## Usage

### CSV Imports
1. Download template
2. Fill in data
3. Validate format
4. Upload via admin panel or API

### JSON Imports
1. Download template
2. Modify data
3. Ensure valid JSON
4. Import via API

## Data Types

### User Fields
```
email, first_name, last_name, phone, role
```

### Car Fields
```
make, model, year, license_plate, daily_rate, location
```

### Booking Fields
```
car_id, renter_id, start_date, end_date, status
```

## Validation

All imports require:
- Valid data types
- Required fields present
- Reference integrity
- UTF-8 encoding

## Related Files

- [../imports/](../imports/) - Staged imports
- [../exports/](../exports/) - Export results