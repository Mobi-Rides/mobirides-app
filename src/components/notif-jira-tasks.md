
"NOTIF-302: Implement Message Notification System, NOTIF-501: Data Migration and Validation, ### NOTIF-502: Comprehensive Testing Suite" drop these 


# Notification System Implementation - JIRA Task Breakdown
## Epic: Notification System Overhaul
Epic Key: NOTIF-001 Priority: Critical Story Points: 89 Duration: 8-10 sprints

## Phase 1: Critical Database Schema Alignment (Sprint 1-2)
Priority: Blocker | Story Points: 21

### NOTIF-101: Add Missing Foreign Key Constraints
Type: Task | Priority: Blocker | Story Points: 8

Description: Implement foreign key constraints to ensure data integrity

Acceptance Criteria:

- Add FK constraint: notifications.related_booking_id → bookings.id
- Add FK constraint: notifications.related_car_id → cars.id
- Add FK constraint: notifications.user_id → profiles.id
- Update RLS policies to leverage FK relationships
- Test constraint enforcement with invalid data
Technical Tasks:

- Create migration script for FK constraints
- Update Supabase schema definitions
- Modify RLS policies for performance optimization
- Add constraint validation tests
### NOTIF-102: Standardize Content Fields Strategy
Type: Task | Priority: Blocker | Story Points: 5

Description: Resolve content/description field confusion

Acceptance Criteria:

- Define single content field strategy (description as primary)
- Create database trigger for backward compatibility
- Update all notification creation functions
- Ensure consistent field population
Technical Tasks:

- Create content field standardization trigger
- Update create_booking_notification function
- Modify frontend normalization logic
- Add field validation rules
### NOTIF-103: Extend Notification Type Enum
Type: Story | Priority: High | Story Points: 8

Description: Add missing notification types from old enum

Acceptance Criteria:

- Add wallet_topup , wallet_deduction to enum
- Add message_received type
- Add payment_received , payment_failed types
- Add handover_ready type
- Create dedicated creation functions for each type
Technical Tasks:

- Extend notification_type enum in database
- Create type-specific notification functions
- Update TypeScript type definitions
- Add enum validation in frontend
## Phase 2: Frontend Type Safety and Routing (Sprint 3-4)
Priority: High | Story Points: 26

### NOTIF-201: Fix ID Type Handling Mismatch
Type: Bug | Priority: High | Story Points: 8

Description: Resolve database number vs frontend string ID conflicts

Acceptance Criteria:

- Update useNotifications.ts for numeric ID handling
- Create type-safe ID conversion utilities
- Fix markAsRead and deleteNotification functions
- Update NormalizedNotification interface
- Add runtime type validation
Technical Tasks:

- Create NotificationIdConverter utility
- Update hook functions with proper type casting
- Add ID validation middleware
- Implement error handling for type mismatches
### NOTIF-202: Resolve Routing Conflicts
Type: Bug | Priority: High | Story Points: 13

Description: Fix notification routing 404 errors and implement smart routing

Acceptance Criteria:

- Fix /bookings/:id vs /booking-requests/:id conflict
- Implement smart routing based on booking status
- Add proper error handling for missing routes
- Create fallback routing logic
- Test all notification click scenarios
Technical Tasks:

- Update NotificationCard routing logic
- Create NotificationRouter utility
- Add booking status-based routing
- Implement route validation
- Add 404 fallback handling
Sub-tasks:

- NOTIF-202a: Update booking notification routing (5 SP)
- NOTIF-202b: Implement handover notification routing (3 SP)
- NOTIF-202c: Add payment notification routing (2 SP)
- NOTIF-202d: Create message notification routing (3 SP)
### NOTIF-203: Content Field Frontend Standardization
Type: Task | Priority: Medium | Story Points: 5

Description: Standardize content display across components

Acceptance Criteria:

- Update frontend to prioritize description over content
- Ensure consistent display in all notification components
- Add fallback logic for missing content
- Update NotificationCard display logic
Technical Tasks:

- Update normalizeNotification function
- Modify NotificationCard content rendering
- Update NotificationDetails component
- Add content validation helpers
## Phase 3: Feature Completion and Integration (Sprint 5-6)
Priority: Medium | Story Points: 21

### NOTIF-301: Restore Wallet Notification System
Type: Feature | Priority: Medium | Story Points: 8

Description: Implement complete wallet notification functionality

Acceptance Criteria:

- Create wallet notification creation functions
- Implement routing to /wallet page
- Add wallet-specific notification templates
- Test topup/deduction notification flows
Technical Tasks:

- Create create_wallet_notification function
- Update NotificationClassifier for wallet types
- Add wallet notification routing
- Create wallet notification templates
### NOTIF-302: Implement Message Notification System
Type: Feature | Priority: Medium | Story Points: 8

Description: Add message notification handling and routing

Acceptance Criteria:

- Create message notification functions
- Implement routing to /messages page
- Add message notification templates
- Test message notification delivery
Technical Tasks:

- Create create_message_notification function
- Add message notification routing logic
- Update message notification classification
- Implement message notification templates
### NOTIF-303: Enhanced Handover Notification System
Type: Feature | Priority: Medium | Story Points: 5

Description: Improve handover notifications with map integration

Acceptance Criteria:

- Create handover notification functions
- Implement map routing with booking context
- Add handover-specific templates
- Test handover notification flows
Technical Tasks:

- Create create_handover_notification function
- Update map routing with booking parameters
- Add handover notification classification
- Implement handover notification templates
## Phase 4: Backend Function Consolidation (Sprint 7)
Priority: Medium | Story Points: 13

### NOTIF-401: Consolidate Notification Creation Functions
Type: Refactor | Priority: Medium | Story Points: 8

Description: Merge duplicate functions and add comprehensive error handling

Acceptance Criteria:

- Merge duplicate create_booking_notification functions
- Add comprehensive error handling and logging
- Implement notification preference checking
- Create unified notification creation interface
Technical Tasks:

- Audit existing notification functions
- Create unified NotificationService class
- Add error handling and retry logic
- Implement preference validation
### NOTIF-402: RLS Policy Cleanup and Optimization
Type: Task | Priority: Medium | Story Points: 5

Description: Consolidate and optimize RLS policies

Acceptance Criteria:

- Remove duplicate RLS policies
- Implement proper role-based access control
- Add audit logging for notification operations
- Optimize policy performance
Technical Tasks:

- Audit existing RLS policies
- Consolidate similar policies
- Add performance indexes
- Implement audit logging
## Phase 5: Data Migration and Testing (Sprint 8)
Priority: Low | Story Points: 8

### NOTIF-501: Data Migration and Validation
Type: Task | Priority: Low | Story Points: 5

Description: Migrate existing data and ensure compatibility

Acceptance Criteria:

- Create migration scripts for existing notifications
- Validate data integrity after migration
- Test backward compatibility
- Create rollback procedures
Technical Tasks:

- Create data migration scripts
- Add data validation checks
- Implement rollback procedures
- Test migration on staging environment
### NOTIF-502: Comprehensive Testing Suite
Type: Task | Priority: Low | Story Points: 3

Description: Implement end-to-end testing for notification flows

Acceptance Criteria:

- Create unit tests for all notification functions
- Add integration tests for notification flows
- Implement E2E tests for user scenarios
- Add performance testing
Technical Tasks:

- Create Jest unit test suite
- Add Cypress E2E tests
- Implement performance benchmarks
- Add monitoring and alerting
## Dependencies and Blockers
Critical Path: NOTIF-101 → NOTIF-102 → NOTIF-103 → NOTIF-201 → NOTIF-202

Blockers:

- NOTIF-201 blocks NOTIF-202 (ID handling must be fixed before routing)
- NOTIF-103 blocks NOTIF-301, NOTIF-302, NOTIF-303 (enum extension required)
- NOTIF-401 depends on completion of Phase 3 features
Risk Mitigation:

- Maintain backward compatibility throughout migration
- Implement feature flags for gradual rollout
- Create comprehensive rollback procedures
- Add monitoring for notification delivery rates
Success Metrics:

- Zero notification delivery failures
- 100% routing success rate
- Sub-100ms notification query performance
- Complete feature parity with old system