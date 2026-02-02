# Interactive Back-and-Forth Handover System

**Created:** 2026-02-02  
**Status:** Planning  
**Priority:** P0 - Critical for Production Readiness

---

## Executive Summary

Transform the current single-party linear handover checklist into an interactive, real-time, turn-based process inspired by ride-hailing UX (InDrive, Uber). Both host and renter actively participate with alternating steps, automatic screen synchronization, and the ability to resume from where either party left off.

---

## Problem Statement

### Current Flow (Broken)
```
Host OR Renter initiates handover
    └─► Same user completes ALL 9 steps alone
        └─► Other party receives notifications but cannot interact
            └─► No back-and-forth coordination
                └─► No location coordination or selection
```

### Target Flow (Ride-Hailing UX)
```
Host initiates pickup
    ├─► Host selects handover location (renter's location OR search)
    ├─► Renter confirms location and marks en route
    ├─► Both arrive - both confirm arrival
    ├─► Host verifies renter ID
    ├─► Renter inspects vehicle
    ├─► Both document damage
    ├─► Key transfer with dual confirmation
    ├─► Both sign digital acknowledgment
    └─► Handover complete with real-time sync throughout
```

---

## Key Features

### 1. Handover Location Selection (New)

The host initiates handover and can:

| Option | Description |
|--------|-------------|
| **Renter's Location** | Select the renter's current/shared location as pickup point |
| **Search Location** | Search for landmarks, malls, or addresses via Mapbox |
| **Car's Location** | Default to the car's listed location |
| **Custom Pin** | Drop a pin on the map for precise location |

**UI Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  📍 Select Handover Location                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ Car's Location (Default)                                 │
│    Gaborone Main Mall, Plot 123                             │
│                                                             │
│  ○ Renter's Location                                        │
│    📍 John is at: Airport Junction (2.3km away)            │
│                                                             │
│  ○ Search for Location                                      │
│    ┌─────────────────────────────────────────┐              │
│    │ 🔍 Search malls, landmarks...          │              │
│    └─────────────────────────────────────────┘              │
│                                                             │
│  ○ Drop Pin on Map                                          │
│    [Open Map Picker]                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    [MAP PREVIEW]                     │    │
│  │                         📍                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Cancel]                              [Confirm Location]   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Turn-Based Step Progression

Each step has a designated owner:

| Step | Order | Owner | Description |
|------|-------|-------|-------------|
| `location_selection` | 1 | `host` | Host selects handover location |
| `location_confirmation` | 2 | `renter` | Renter confirms location is acceptable |
| `en_route_confirmation` | 3 | `renter` | Renter confirms heading to location |
| `host_en_route` | 4 | `host` | Host confirms heading to location |
| `arrival_confirmation` | 5 | `both` | Both confirm arrival at location |
| `identity_verification` | 6 | `host` | Host verifies renter's ID |
| `vehicle_inspection_exterior` | 7 | `renter` | Renter inspects and documents exterior |
| `vehicle_inspection_interior` | 8 | `renter` | Renter inspects and documents interior |
| `damage_documentation` | 9 | `both` | Both acknowledge damage state |
| `fuel_mileage_check` | 10 | `renter` | Renter records fuel and mileage |
| `key_transfer` | 11 | `host` | Host confirms key handover |
| `key_receipt` | 12 | `renter` | Renter confirms key receipt |
| `digital_signature` | 13 | `both` | Both sign acknowledgment |
| `completion` | 14 | `both` | Both confirm handover complete |

### 3. Real-Time Synchronization

- Supabase real-time subscriptions sync state between devices
- Automatic navigation to current step when other party completes theirs
- "Waiting for [Name]" state with animated indicator
- Push notifications when it becomes a party's turn

### 4. Resume Capability

- Session persistence allows closing and reopening app
- Both parties can resume at the current step
- No progress lost on network interruption

---

## Technical Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 INTERACTIVE HANDOVER FLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   HOST DEVICE                      RENTER DEVICE            │
│   ┌─────────────┐                  ┌─────────────┐          │
│   │ Active Step │                  │ Waiting UI  │          │
│   │ "Select     │                  │ "Waiting    │          │
│   │  Location"  │                  │  for host"  │          │
│   └──────┬──────┘                  └──────▲──────┘          │
│          │                                │                 │
│          │ completeStepForRole('host')    │                 │
│          ▼                                │                 │
│   ┌──────────────┐                        │                 │
│   │ Supabase     │────Real-time update────┘                 │
│   │ handover_    │                                          │
│   │ step_        │                                          │
│   │ completion   │────Real-time update────┐                 │
│   └──────────────┘                        │                 │
│          ▲                                ▼                 │
│          │                         ┌──────────────┐         │
│   ┌──────┴──────┐                  │ Active Step  │         │
│   │ Waiting UI  │                  │ "Confirm     │         │
│   │ "Waiting    │                  │  Location"   │         │
│   │  for renter"│                  └──────────────┘         │
│   └─────────────┘                                           │
│                                                             │
│   ═══════════════════════════════════════════════════════   │
│                                                             │
│   BOTH PARTIES STEP (e.g., Arrival Confirmation)            │
│                                                             │
│   HOST DEVICE                      RENTER DEVICE            │
│   ┌─────────────┐                  ┌─────────────┐          │
│   │ ✅ I arrived│                  │ ⏳ Confirm  │          │
│   │             │                  │    arrival  │          │
│   │ Waiting for │◄───────────────► │ Host done:  │          │
│   │ renter...   │  Real-time sync  │    ✅       │          │
│   └─────────────┘                  └─────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Location Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 LOCATION SELECTION FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   HOST initiates handover                                   │
│   ┌─────────────────────────────────────────┐               │
│   │ Location Options:                        │               │
│   │                                          │               │
│   │ 1. Car's registered location (default)  │               │
│   │    └─► Fetch from cars.latitude/longitude│               │
│   │                                          │               │
│   │ 2. Renter's current location            │               │
│   │    └─► Fetch from profiles.latitude/    │               │
│   │        longitude (if sharing enabled)    │               │
│   │                                          │               │
│   │ 3. Search location (Mapbox)             │               │
│   │    └─► mapboxSearchService.search()     │               │
│   │                                          │               │
│   │ 4. Custom pin drop                       │               │
│   │    └─► Interactive map with marker       │               │
│   └─────────────────────────────────────────┘               │
│                          │                                  │
│                          ▼                                  │
│   ┌─────────────────────────────────────────┐               │
│   │ Save to handover_sessions:              │               │
│   │   - handover_location_lat               │               │
│   │   - handover_location_lng               │               │
│   │   - handover_location_name              │               │
│   │   - handover_location_type              │               │
│   └─────────────────────────────────────────┘               │
│                          │                                  │
│                          ▼                                  │
│   RENTER receives notification                              │
│   ┌─────────────────────────────────────────┐               │
│   │ "Sarah has set the pickup location:     │               │
│   │  Airport Junction Mall"                 │               │
│   │                                          │               │
│   │ [View on Map] [Confirm] [Request Change]│               │
│   └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### 1. Modify `handover_step_completion` Table

```sql
-- Add step ownership and dual-party completion tracking
ALTER TABLE handover_step_completion 
ADD COLUMN IF NOT EXISTS step_owner TEXT 
  CHECK (step_owner IN ('host', 'renter', 'both')),
ADD COLUMN IF NOT EXISTS host_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS renter_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS host_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS renter_completed_at TIMESTAMPTZ;
```

### 2. Modify `handover_sessions` Table

```sql
-- Add coordination and location columns
ALTER TABLE handover_sessions
ADD COLUMN IF NOT EXISTS current_step_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS waiting_for TEXT 
  CHECK (waiting_for IN ('host', 'renter', 'both', 'none')),
ADD COLUMN IF NOT EXISTS handover_location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS handover_location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS handover_location_name TEXT,
ADD COLUMN IF NOT EXISTS handover_location_type TEXT 
  CHECK (handover_location_type IN ('car_location', 'renter_location', 'searched', 'custom_pin'));
```

### 3. Create Step Advancement Function

```sql
CREATE OR REPLACE FUNCTION advance_handover_step(
  session_id UUID,
  completed_step_name TEXT,
  completing_user_role TEXT
) RETURNS JSONB AS $$
DECLARE
  step_record RECORD;
  next_step RECORD;
  result JSONB;
BEGIN
  -- Get current step
  SELECT * INTO step_record 
  FROM handover_step_completion 
  WHERE handover_session_id = session_id 
    AND step_name = completed_step_name;
  
  -- Update completion based on role
  IF completing_user_role = 'host' THEN
    UPDATE handover_step_completion 
    SET host_completed = TRUE, host_completed_at = NOW()
    WHERE id = step_record.id;
  ELSIF completing_user_role = 'renter' THEN
    UPDATE handover_step_completion 
    SET renter_completed = TRUE, renter_completed_at = NOW()
    WHERE id = step_record.id;
  END IF;
  
  -- Check if step is fully complete
  SELECT * INTO step_record 
  FROM handover_step_completion 
  WHERE id = step_record.id;
  
  IF step_record.step_owner = 'both' THEN
    -- Both must complete
    IF step_record.host_completed AND step_record.renter_completed THEN
      UPDATE handover_step_completion 
      SET is_completed = TRUE, completed_at = NOW()
      WHERE id = step_record.id;
    END IF;
  ELSE
    -- Single owner step
    UPDATE handover_step_completion 
    SET is_completed = TRUE, completed_at = NOW()
    WHERE id = step_record.id;
  END IF;
  
  -- Get next step and update session
  SELECT * INTO next_step 
  FROM handover_step_completion 
  WHERE handover_session_id = session_id 
    AND step_order > step_record.step_order
    AND is_completed = FALSE
  ORDER BY step_order ASC
  LIMIT 1;
  
  IF next_step IS NOT NULL THEN
    UPDATE handover_sessions 
    SET current_step_order = next_step.step_order,
        waiting_for = next_step.step_owner
    WHERE id = session_id;
  ELSE
    -- All steps complete
    UPDATE handover_sessions 
    SET handover_completed = TRUE,
        waiting_for = 'none'
    WHERE id = session_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'next_step', next_step.step_name,
    'waiting_for', next_step.step_owner
  );
END;
$$ LANGUAGE plpgsql;
```

---

## UI Components

### New Components to Create

| Component | Purpose |
|-----------|---------|
| `HandoverLocationSelector.tsx` | Host selects handover location with search and map |
| `LocationConfirmationStep.tsx` | Renter confirms or requests location change |
| `WaitingForPartyCard.tsx` | Displays waiting state with animation |
| `DualPartyStepCard.tsx` | UI for steps requiring both parties |
| `HandoverProgressTimeline.tsx` | Visual timeline of all steps with status |
| `EnRouteConfirmationStep.tsx` | Renter confirms heading to location |
| `ArrivalConfirmationStep.tsx` | Dual-party arrival confirmation |
| `KeyReceiptStep.tsx` | Renter key receipt confirmation |

### Waiting State UI

```
┌─────────────────────────────────────────┐
│  ⏳ Waiting for Sarah                   │
│                                         │
│  Current Step: Identity Verification    │
│                                         │
│  [Host's avatar]                        │
│  "Sarah is verifying your identity..."  │
│                                         │
│  ● ● ● (animated waiting indicator)     │
│                                         │
│  [Contact Host] [Refresh Status]        │
└─────────────────────────────────────────┘
```

### Dual-Party Step UI

```
┌─────────────────────────────────────────┐
│  🤝 Both Parties Required               │
│                                         │
│  Step: Confirm Arrival                  │
│                                         │
│  Host (Sarah):     ✅ Confirmed         │
│  Renter (John):    ⏳ Pending           │
│                                         │
│  [I Have Arrived]                       │
└─────────────────────────────────────────┘
```

### Progress Timeline UI

```
┌─────────────────────────────────────────┐
│  Handover Progress                      │
│                                         │
│  ✅ Location Selected (Host)            │
│  │   📍 Airport Junction Mall           │
│  │                                      │
│  ✅ Location Confirmed (Renter)         │
│  │                                      │
│  ✅ En Route Confirmed (Renter)         │
│  │                                      │
│  ⏳ Awaiting Arrival (Both)  ◄── YOU    │
│  │   Host: ✅  Renter: ⏳               │
│  │                                      │
│  ○ Identity Verification (Host)         │
│  │                                      │
│  ○ Exterior Inspection (Renter)         │
│  │                                      │
│  ... (remaining steps)                  │
└─────────────────────────────────────────┘
```

---

## Service Layer

### New Hook: `useInteractiveHandover.ts`

```typescript
export const useInteractiveHandover = (
  sessionId: string, 
  userRole: 'host' | 'renter'
) => {
  return {
    // Current state
    currentStep: StepDefinition;
    isMyTurn: boolean;
    waitingFor: 'host' | 'renter' | 'both' | null;
    
    // Progress tracking
    myProgress: CompletedStep[];
    theirProgress: CompletedStep[];
    overallProgress: number; // 0-100
    
    // Actions
    completeStep: (stepName: string, data?: any) => Promise<void>;
    canCompleteStep: (stepName: string) => boolean;
    
    // Location (for pickup)
    handoverLocation: LocationData | null;
    setHandoverLocation: (location: LocationData) => Promise<void>;
    
    // Real-time
    isConnected: boolean;
    lastUpdate: Date;
  };
};
```

### Step Definitions with Ownership

```typescript
export const INTERACTIVE_HANDOVER_STEPS: StepDefinition[] = [
  { 
    name: "location_selection", 
    order: 1, 
    owner: "host", 
    title: "Select Location",
    description: "Choose where to meet for the handover"
  },
  { 
    name: "location_confirmation", 
    order: 2, 
    owner: "renter", 
    title: "Confirm Location",
    description: "Review and confirm the pickup location"
  },
  { 
    name: "en_route_confirmation", 
    order: 3, 
    owner: "renter", 
    title: "Confirm En Route",
    description: "Confirm you're heading to the location"
  },
  { 
    name: "host_en_route", 
    order: 4, 
    owner: "host", 
    title: "Host En Route",
    description: "Confirm you're heading to the location"
  },
  { 
    name: "arrival_confirmation", 
    order: 5, 
    owner: "both", 
    title: "Confirm Arrival",
    description: "Both parties confirm arrival at location"
  },
  { 
    name: "identity_verification", 
    order: 6, 
    owner: "host", 
    title: "Verify Identity",
    description: "Verify the renter's identity"
  },
  { 
    name: "vehicle_inspection_exterior", 
    order: 7, 
    owner: "renter", 
    title: "Exterior Inspection",
    description: "Inspect and document vehicle exterior"
  },
  { 
    name: "vehicle_inspection_interior", 
    order: 8, 
    owner: "renter", 
    title: "Interior Inspection",
    description: "Inspect and document vehicle interior"
  },
  { 
    name: "damage_documentation", 
    order: 9, 
    owner: "both", 
    title: "Damage Review",
    description: "Both acknowledge current damage state"
  },
  { 
    name: "fuel_mileage_check", 
    order: 10, 
    owner: "renter", 
    title: "Fuel & Mileage",
    description: "Record current fuel level and mileage"
  },
  { 
    name: "key_transfer", 
    order: 11, 
    owner: "host", 
    title: "Key Handover",
    description: "Confirm keys have been handed over"
  },
  { 
    name: "key_receipt", 
    order: 12, 
    owner: "renter", 
    title: "Confirm Receipt",
    description: "Confirm keys have been received"
  },
  { 
    name: "digital_signature", 
    order: 13, 
    owner: "both", 
    title: "Sign Agreement",
    description: "Both sign the handover agreement"
  },
  { 
    name: "completion", 
    order: 14, 
    owner: "both", 
    title: "Complete Handover",
    description: "Confirm handover is complete"
  }
];
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useInteractiveHandover.ts` | Main hook for interactive handover state |
| `src/services/interactiveHandoverService.ts` | Service functions for interactive handover |
| `src/components/handover/HandoverLocationSelector.tsx` | Location selection with Mapbox search |
| `src/components/handover/LocationConfirmationStep.tsx` | Renter confirms location |
| `src/components/handover/WaitingForPartyCard.tsx` | Waiting state UI |
| `src/components/handover/DualPartyStepCard.tsx` | Dual-party step UI |
| `src/components/handover/HandoverProgressTimeline.tsx` | Progress timeline |
| `src/components/handover/steps/EnRouteConfirmationStep.tsx` | En route confirmation |
| `src/components/handover/steps/ArrivalConfirmationStep.tsx` | Arrival confirmation |
| `src/components/handover/steps/KeyReceiptStep.tsx` | Key receipt confirmation |
| `src/types/interactiveHandover.ts` | TypeScript types |

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/enhancedHandoverService.ts` | Add step ownership definitions |
| `src/components/handover/EnhancedHandoverSheet.tsx` | Role-aware rendering, waiting states |
| `src/contexts/HandoverContext.tsx` | Add current step and waiting state |
| `src/hooks/useRealtimeHandover.ts` | Turn-based update handling |
| All existing step components | Add role-aware props |

---

## JIRA Tasks

| Task ID | Task | Points | Sprint | Priority |
|---------|------|--------|--------|----------|
| HAND-010 | Database migration for interactive handover | 3 | 3 | P0 |
| HAND-011 | Create useInteractiveHandover hook | 5 | 3 | P0 |
| HAND-012 | Create HandoverLocationSelector component | 5 | 3 | P0 |
| HAND-013 | Create WaitingForPartyCard component | 3 | 3 | P1 |
| HAND-014 | Create DualPartyStepCard component | 3 | 3 | P1 |
| HAND-015 | Create HandoverProgressTimeline component | 5 | 3 | P1 |
| HAND-016 | Refactor EnhancedHandoverSheet for role-awareness | 8 | 3 | P0 |
| HAND-017 | Create new step components (5 new steps) | 8 | 3 | P0 |
| HAND-018 | Update existing step components with role props | 5 | 3 | P1 |
| HAND-019 | Add turn-based notifications | 3 | 4 | P1 |
| HAND-020 | End-to-end testing of interactive flow | 5 | 4 | P0 |
| HAND-021 | Location change request feature | 3 | 4 | P2 |

**Total: 56 Story Points**

---

## Notification Types

| Type | Recipient | Trigger |
|------|-----------|---------|
| `handover_location_set` | Renter | Host selects location |
| `handover_location_confirmed` | Host | Renter confirms location |
| `handover_your_turn` | Next party | Previous step completed |
| `handover_waiting` | Acting party | Reminder after 5 min |
| `handover_both_required` | Both | Both-party step reached |
| `handover_completed` | Both | All steps complete |

---

## Success Criteria

- [ ] Host can select renter's location, search location, or car location
- [ ] Renter can confirm or request location change
- [ ] Host and renter see different UIs based on whose turn it is
- [ ] Steps owned by "both" require both parties to complete before advancing
- [ ] Real-time updates show when other party completes their step
- [ ] "Waiting for [Name]" state displays with animated indicator
- [ ] Either party can close and reopen to resume at current step
- [ ] Timeline shows progress for both parties
- [ ] Notifications sent when it becomes a party's turn
- [ ] Handover only completes when all steps marked complete by appropriate party
- [ ] Map displays selected handover location to both parties

---

## Risk Considerations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing handovers in progress | High | Migration converts existing sessions to new format |
| Complex state synchronization | Medium | Supabase real-time with optimistic updates |
| Network latency causing out-of-sync displays | Medium | Polling fallback and retry logic |
| Users closing app mid-handover | Low | Session persistence already exists; enhance resume logic |
| Renter location not shared | Medium | Fallback to car location if renter hasn't enabled sharing |

---

## Return Handover Flow

For return handovers, the step order is reversed:

| Step | Order | Owner | Description |
|------|-------|-------|-------------|
| `return_location_selection` | 1 | `renter` | Renter proposes return location |
| `return_location_confirmation` | 2 | `host` | Host confirms return location |
| `return_en_route` | 3 | `renter` | Renter confirms heading with car |
| `host_en_route_return` | 4 | `host` | Host confirms heading to location |
| `return_arrival_confirmation` | 5 | `both` | Both confirm arrival |
| `return_vehicle_inspection` | 6 | `host` | Host inspects returned vehicle |
| `return_damage_check` | 7 | `both` | Both acknowledge any new damage |
| `return_fuel_mileage_check` | 8 | `host` | Host records fuel and mileage |
| `key_return` | 9 | `renter` | Renter confirms key return |
| `key_received` | 10 | `host` | Host confirms key receipt |
| `return_digital_signature` | 11 | `both` | Both sign return agreement |
| `return_completion` | 12 | `both` | Both confirm return complete |

---

## Dependencies

- **Mapbox Search**: Already integrated via `mapboxSearchService.ts`
- **Supabase Real-time**: Already configured
- **Location Sharing**: Existing `profiles.latitude/longitude` fields
- **Notification System**: Existing infrastructure

---

## Appendix: Comparison with Competitors

| Feature | Turo | Getaround | MobiRides (Target) |
|---------|------|-----------|-------------------|
| Location Selection | Host sets | Fixed locations | Host chooses with options |
| Real-time Tracking | Yes | Yes | Yes |
| Turn-based Steps | Partial | No | Full alternating flow |
| Dual Signatures | Yes | Yes | Yes |
| Photo Documentation | Yes | Yes | Yes |
| Resume Capability | Yes | Yes | Yes |

---

*Document Version: 1.0*  
*Last Updated: 2026-02-02*
