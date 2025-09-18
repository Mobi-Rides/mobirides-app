# Backend Synchronization Plan for Notification Preferences

## Current State Analysis

### Existing Implementation:
- Two separate NotificationPreferences components exist
- Database table `notification_preferences` already exists with basic structure
- Advanced component in profile section uses localStorage with detailed granular controls
- System already has notification creation and delivery infrastructure

### Current Database Schema:
```sql
notification_preferences table:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- email_notifications (boolean, default: true)
- push_notifications (boolean, default: true) 
- sms_notifications (boolean, default: false)
- booking_notifications (boolean, default: true)
- payment_notifications (boolean, default: true)
- marketing_notifications (boolean, default: false)
- notification_frequency (text, default: 'instant')
- quiet_hours_start (time, default: '22:00:00')
- quiet_hours_end (time, default: '08:00:00')
- created_at, updated_at (timestamps)
```

## Phase 1: Database Schema Enhancement

### 1.1 Extend notification_preferences table
Add columns for granular notification control:
```sql
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS:
- detailed_preferences JSONB DEFAULT '{}'::jsonb
- notification_categories JSONB DEFAULT '{}'::jsonb  
- channel_preferences JSONB DEFAULT '{}'::jsonb
```

### 1.2 Create helper functions
```sql
-- Function to merge default preferences with user preferences
-- Function to validate preference structure
-- Function to migrate existing simple preferences to detailed format
```

### 1.3 Add RLS policies
Ensure proper Row Level Security for user-specific preference access.

## Phase 2: Service Layer Implementation

### 2.1 Create NotificationPreferencesService
- `loadUserPreferences(userId)` - Load preferences with defaults
- `saveUserPreferences(userId, preferences)` - Save/update preferences
- `resetToDefaults(userId)` - Reset to system defaults
- `validatePreferences(preferences)` - Validate preference structure
- `migrateFromLegacy(userId)` - Migrate from simple to detailed format

### 2.2 Create preference mapping utilities
- Map between detailed preference format and database storage
- Handle backward compatibility with existing simple preferences
- Create type-safe interfaces for preference structures

## Phase 3: Frontend Integration

### 3.1 Enhance the profile NotificationPreferences component
- Replace localStorage with API calls to NotificationPreferencesService
- Add loading states and error handling
- Implement optimistic updates for better UX
- Add real-time preference synchronization

### 3.2 Create custom hooks
- `useNotificationPreferences()` - Manage preference state with caching
- `usePreferenceSave()` - Handle saving with debouncing
- `usePreferenceSync()` - Sync preferences across sessions

### 3.3 Implement progressive enhancement
- Load preferences on component mount
- Cache preferences locally for offline access  
- Sync when connection is restored
- Handle conflicts between local and server state

## Phase 4: Integration with Notification System

### 4.1 Update notification creation logic
- Check user preferences before sending notifications
- Respect channel preferences (email, SMS, push, in-app)
- Honor quiet hours and frequency settings
- Implement notification filtering based on categories

### 4.2 Create preference-aware notification service
- `shouldSendNotification(userId, notificationType, channel)` - Check if notification should be sent
- `getActiveChannels(userId, notificationType)` - Get enabled channels for user/type
- `respectQuietHours(userId, timestamp)` - Check quiet hours
- `applyFrequencyRules(userId, notifications)` - Apply batching rules

## Phase 5: Data Migration & Backward Compatibility

### 5.1 Migration strategy
- Create migration script for existing users
- Set sensible defaults for new detailed preferences
- Maintain compatibility with existing simple preferences
- Gradual rollout with feature flags

### 5.2 Fallback mechanisms
- Default to system-wide preferences if user preferences unavailable
- Graceful degradation for unsupported preference types
- Error recovery for corrupted preference data

## Phase 6: Testing & Validation

### 6.1 Unit testing
- Test preference service methods
- Test preference validation logic
- Test migration scenarios
- Test fallback mechanisms

### 6.2 Integration testing
- Test full notification flow with preferences
- Test preference synchronization across devices
- Test offline/online scenarios
- Test performance with large preference datasets

### 6.3 User acceptance testing
- Test preference UI with real users
- Validate notification behavior matches expectations
- Test preference persistence across sessions

## Implementation Priority

**High Priority:**
1. Database schema extension
2. Basic service layer implementation
3. Frontend integration with API calls
4. Integration with existing notification system

**Medium Priority:**
1. Advanced caching and synchronization
2. Preference-aware notification filtering
3. Migration of existing users
4. Performance optimizations

**Low Priority:**
1. Advanced preference analytics
2. Preference recommendation system
3. Bulk preference management
4. Import/export functionality

## Success Metrics

- Notification preferences persist across sessions
- Users can granularly control notification types and channels
- Notification delivery respects user preferences
- System performance remains optimal
- Zero data loss during migration
- Improved user satisfaction with notification control

## Risk Mitigation

- Implement comprehensive backup before migration
- Use feature flags for gradual rollout
- Maintain backward compatibility during transition
- Monitor system performance during rollout
- Have rollback plan ready