# Authentication Trigger System

## Overview

The authentication trigger system in Mobirides provides a seamless user experience by intercepting actions that require authentication and guiding users through the sign-in process while preserving their intended actions.

## Features

### [A3.1] Booking Authentication Triggers
- **Trigger Point**: When users attempt to book a vehicle without being authenticated
- **Action**: Opens authentication modal and stores booking intent
- **Post-Authentication**: Automatically navigates to car details page for booking

### [A3.2] Save to Favorites Authentication Triggers
- **Trigger Point**: When users attempt to save a vehicle to favorites without being authenticated
- **Action**: Opens authentication modal and stores save intent
- **Post-Authentication**: Automatically saves the vehicle to user's favorites

### [A3.3] Contact Host Authentication Triggers
- **Trigger Point**: When users attempt to contact a vehicle host without being authenticated
- **Action**: Opens authentication modal and stores contact intent
- **Post-Authentication**: Automatically opens chat with the host

### [A3.4] Message Owner Authentication Triggers
- **Trigger Point**: When users attempt to send a message without being authenticated
- **Action**: Opens authentication modal and stores message intent
- **Post-Authentication**: Automatically sends the stored message

## Implementation

### Core Service: `AuthTriggerService`

Located at `src/services/authTriggerService.ts`

```typescript
export interface PostAuthIntent {
  action: 'book' | 'save' | 'contact' | 'message';
  carId: string;
  timestamp: number;
  ownerId?: string;
  receiverId?: string;
  message?: string;
}

export class AuthTriggerService {
  static storeIntent(intent: PostAuthIntent): void
  static getStoredIntent(): PostAuthIntent | null
  static clearStoredIntent(): void
  static executeStoredIntent(): Promise<boolean>
  static isAuthenticated(): Promise<boolean>
  static getCurrentUserId(): Promise<string | null>
}
```

### Hook: `useAuthTrigger`

Located at `src/hooks/useAuthTrigger.ts`

```typescript
export const useAuthTrigger = () => {
  return {
    isAuthenticated,
    isAuthModalOpen,
    triggerAuth,
    triggerBookingAuth,
    triggerSaveAuth,
    triggerContactAuth,
    triggerMessageAuth,
    closeAuthModal
  };
};
```

## Usage Examples

### Basic Authentication Trigger

```typescript
import { useAuthTrigger } from '@/hooks/useAuthTrigger';

const MyComponent = () => {
  const { isAuthenticated, triggerBookingAuth, isAuthModalOpen, closeAuthModal } = useAuthTrigger();

  const handleBookNow = () => {
    if (!isAuthenticated) {
      triggerBookingAuth(carId);
      return;
    }
    // Proceed with booking
  };

  return (
    <>
      <button onClick={handleBookNow}>Book Now</button>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </>
  );
};
```

### Direct Service Usage

```typescript
import { AuthTriggerService } from '@/services/authTriggerService';

const handleSaveCar = async () => {
  if (!await AuthTriggerService.isAuthenticated()) {
    AuthTriggerService.storeIntent({
      action: 'save',
      carId: 'car-123',
      timestamp: Date.now()
    });
    // Show auth modal
    return;
  }
  // Proceed with saving
};
```

## Components with Authentication Triggers

### 1. CarActions Component
- **File**: `src/components/car-details/CarActions.tsx`
- **Triggers**: Booking, Save to Favorites
- **Implementation**: Uses `AuthTriggerService` directly

### 2. CarOwner Component
- **File**: `src/components/car-details/CarOwner.tsx`
- **Triggers**: Contact Host
- **Implementation**: Uses `AuthTriggerService` directly

### 3. ChatDrawer Component
- **File**: `src/components/chat/ChatDrawer.tsx`
- **Triggers**: Message Owner
- **Implementation**: Uses `AuthTriggerService` directly

### 4. CarCard Component
- **File**: `src/components/CarCard.tsx`
- **Triggers**: Booking, Save to Favorites
- **Implementation**: Uses `AuthTriggerService` directly

## Post-Authentication Flow

1. **Intent Storage**: User action is intercepted and intent is stored in localStorage
2. **Authentication**: AuthModal opens for user to sign in/sign up
3. **Intent Execution**: After successful authentication, stored intent is automatically executed
4. **Cleanup**: Stored intent is cleared from localStorage

## Intent Expiration

Stored intents automatically expire after 24 hours to prevent stale actions from being executed.

## Error Handling

- Invalid or expired intents are automatically cleared
- Failed post-authentication actions show user-friendly error messages
- Network errors during intent execution are handled gracefully

## Security Considerations

- Intents are stored locally and don't contain sensitive information
- Authentication state is verified before executing any actions
- All database operations require valid authentication tokens

## Testing

To test the authentication trigger system:

1. **Clear Authentication**: Sign out of the application
2. **Trigger Action**: Attempt to book, save, contact, or message
3. **Verify Modal**: Authentication modal should appear
4. **Sign In**: Complete authentication process
5. **Verify Execution**: Intended action should execute automatically

## Future Enhancements

- Add analytics tracking for authentication triggers
- Implement A/B testing for different trigger flows
- Add support for more complex multi-step intents
- Consider server-side intent storage for cross-device support 