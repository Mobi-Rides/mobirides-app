

# Traffic Analysis: Why 309 Requests/Minute with One User

## Root Cause: Aggressive Polling + Redundant Realtime Subscriptions

Your app has **both** polling (refetchInterval) **and** realtime subscriptions for the same data, creating duplicate traffic. Here's the breakdown:

### Polling Sources (DB requests every few seconds)

| Component | Interval | Requests/min |
|-----------|----------|-------------|
| `Navigation.tsx` — unread notifications | **5 seconds** | 12 |
| `Navigation.tsx` — unread messages | **10 seconds** | 6 |
| `Header.tsx` — notification count | **30 seconds** | 2 |
| `RenterStats.tsx` — dashboard stats | **30 seconds** | 2 |
| `HandoverBookingButtons.tsx` — handover check | **30 seconds** | 2 |
| `AuditLogViewer.tsx` — audit logs | **30 seconds** | 2 |
| `useHandoverPrompts.ts` — prompts | **5 minutes** | ~0.2 |

That's **~26 DB queries/minute** from polling alone, plus auth checks (`getUser()`) on each — so roughly **52+ DB+Auth requests/minute**.

### Realtime Subscriptions (Websocket connections)

These generate the **292 Realtime requests** you see:
- `Navigation.tsx` — `navigation-updates` channel (conversation_messages + participants + notifications)
- `NotificationsSection.tsx` — `notifications-realtime` channel
- `useNotifications.ts` — `notifications-changes` channel
- `useOptimizedConversations.ts` — conversations + messages + receipts channels
- `usePresence.ts` — presence channel per conversation
- `useVoiceCall.ts` / `useVideoCall.ts` — signaling channels
- `handoverService.ts` / `useRealtimeHandover.ts` — handover channels
- `locationSubscription.ts` / `useHostLocation.ts` — location channels

### The Problem

**Notifications** are polled every 5 seconds AND have a realtime subscription — double traffic for the same data. Same for messages (polled every 10s + realtime). Each poll also calls `supabase.auth.getUser()`, adding another request.

## Fix Plan

### 1. Remove aggressive polling where realtime subscriptions exist
- `Navigation.tsx`: Remove `refetchInterval: 5000` for notifications (realtime already covers it) or increase to 60s as a fallback
- `Navigation.tsx`: Remove `refetchInterval: 10000` for messages (realtime already covers it) or increase to 60s
- `Header.tsx`: Remove `refetchInterval: 30000` for notification count (redundant with Navigation)

### 2. Deduplicate notification subscriptions
- `NotificationsSection.tsx` and `useNotifications.ts` both subscribe to notification changes — consolidate into one

### 3. Cache auth user
- Every polling query calls `supabase.auth.getUser()` independently. Cache the user in a React context/hook so it's one call, not 26/minute.

### 4. Increase remaining poll intervals
- `RenterStats.tsx`: 30s → 120s (stats don't change that fast)
- `HandoverBookingButtons.tsx`: 30s → 60s
- `AuditLogViewer.tsx`: 30s → 60s (admin-only, no urgency)

## Expected Impact

- DB requests: ~52/min → ~8/min (85% reduction)
- Auth requests: ~26/min → ~2/min
- Realtime: unchanged (websocket, low overhead)
- Total: ~309 req/min → ~50-80 req/min for a single user

## Files Modified

| File | Change |
|------|--------|
| `src/components/Navigation.tsx` | Remove/increase refetchInterval for notifications (5s→60s) and messages (10s→60s) |
| `src/components/Header.tsx` | Remove refetchInterval for notification count (redundant) |
| `src/components/dashboard/RenterStats.tsx` | Increase refetchInterval 30s→120s |
| `src/components/map/HandoverBookingButtons.tsx` | Increase refetchInterval 30s→60s |
| `src/components/admin/AuditLogViewer.tsx` | Increase refetchInterval 30s→60s |
| `src/components/profile/NotificationsSection.tsx` | Remove duplicate realtime subscription (already in useNotifications) |

No migrations. No edge function changes. Frontend-only optimization.

