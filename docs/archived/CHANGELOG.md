# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial authentication system with Supabase integration
- Login page with email/password authentication
- Protected route implementation for secure access
- Mobirides branding and logo on login page
- Basic error handling and loading states for authentication
- Toast notifications for authentication events
- Comprehensive handover notification system
- Database migration files with proper timestamp naming conventions

### Changed
- Standardized migration file naming to follow timestamp conventions
- Improved handover function signatures for better type safety

### Deprecated
- N/A

### Removed
- Temporary test files and scripts
- Duplicate migration files
- Redundant handover function definitions
- Empty seed files

### Fixed
- Handover step notification function signature mismatch
- Full name column reference errors in notification functions
- Pickup location column references (make → brand, pickup_location → latitude/longitude)
- Message column references in notifications table
- Progress percentage decimal to integer casting issues
- Database function parameter type mismatches

### Security
- Implemented secure session management with Supabase