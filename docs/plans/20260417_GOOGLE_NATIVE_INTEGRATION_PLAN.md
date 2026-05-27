# Execution Plan: Google Native Integration (Firebase & Push Notifications)
## MOB-122 — Firebase/Google Services Setup & `google-services.json` Config

**Original Date:** April 17, 2026  
**Updated:** May 26, 2026  
**Status:** 🔵 IN PROGRESS  
**Owner:** Modisa Maphanyane  
**Priority:** P1 (Urgent) · **Story Points:** 5  
**Linear Ticket:** [MOB-122](https://linear.app/mobirides/issue/MOB-122/sprint-15-firebasegoogle-services-setup-and-google-servicesjson-config)  
**Sprint:** Sprint 15 (May 16 – May 29, 2026)  
**Git Branch:** `maphanyane/mob-122-sprint-15-firebasegoogle-services-setup-and-google`  
**Sprint Plan:** [SPRINT_15_MAY_2026_JIRA_EXECUTION_PLAN.md](../Product%20Status/SPRINT_15_MAY_2026_JIRA_EXECUTION_PLAN.md)

---

## 📊 Executive Summary

The MobiRides Android application (built with Capacitor 8) currently uses **VAPID-based Web Push** for notifications, delivered via a Supabase Edge Function (`send-push-notification`). This works for browser contexts but **does not deliver native Android push notifications** — users receive no notification when the app is closed or backgrounded on a physical device.

This plan implements **Firebase Cloud Messaging (FCM)** alongside the existing Web Push infrastructure to enable native Android push notifications. The architecture is designed as a **dual-channel system**: Web Push (VAPID) continues to serve browser users, while FCM handles native Android delivery.

### Why This Matters for V1.0 Launch
- **Rental reminders** (pickup/return) must reach users even when the app is killed
- **Payment confirmations** and **booking approvals** require reliable delivery
- **Security alerts** (anomaly detection from SAR-002) need guaranteed delivery
- Google Play Store listing requires functional push notifications for peer-to-peer marketplace apps

---

## 🔍 Current State Assessment

| Component | Current State | Target State |
|-----------|--------------|--------------|
| `google-services.json` | ❌ Missing | ✅ Placed at `android/app/` |
| Google Services Gradle plugin | ✅ Declared (`4.4.4`) but conditionally skipped | ✅ Actively applied |
| Firebase Messaging SDK | ❌ Not in dependencies | ✅ Added via BoM |
| `AndroidManifest.xml` | ❌ No FCM permissions | ✅ `POST_NOTIFICATIONS` + channel metadata |
| `@capacitor/push-notifications` | ❌ Not installed | ✅ Installed & configured |
| FCM Token Storage | ❌ No schema support | ✅ `push_subscriptions.fcm_token` column |
| Server-side FCM Sending | ❌ Only VAPID Web Push | ✅ FCM HTTP v1 API via Edge Function |
| `firebaseService.ts` | ❌ Does not exist | ✅ Unified FCM init & token management |
| `.gitignore` for `google-services.json` | ⚠️ Line commented out | ✅ Uncommented (excluded from git) |

### Files Involved

| File | Action | Layer |
|------|--------|-------|
| `android/app/google-services.json` | **NEW** | Android Native |
| `android/.gitignore` | **MODIFY** | Security |
| `android/app/build.gradle` | **MODIFY** | Android Native |
| `android/app/src/main/AndroidManifest.xml` | **MODIFY** | Android Native |
| `capacitor.config.ts` | **MODIFY** | Capacitor |
| `package.json` | **MODIFY** | Dependencies |
| `src/services/firebaseService.ts` | **NEW** | TypeScript |
| `src/services/pushNotificationService.ts` | **MODIFY** | TypeScript |
| `src/App.tsx` or `src/main.tsx` | **MODIFY** | TypeScript |
| `supabase/migrations/YYYYMMDD_add_fcm_support.sql` | **NEW** | Database |
| `supabase/functions/send-push-notification/index.ts` | **MODIFY** | Edge Function |
| `.env.example` | **MODIFY** | Documentation |

---

## 📋 Sub-Task Backlog

### Phase 1: Firebase Console Provisioning (Manual — External)

> ⚠️ **This phase requires human action in the Firebase Console web UI. It cannot be automated.**

| Ticket | Status | Owner | Summary |
|--------|--------|-------|---------|
| **MOB-122-T1** | 🟡 TO DO | Modisa | Create Firebase project and register Android app (`com.mobirides.app`). |
| **MOB-122-T2** | 🟡 TO DO | Modisa | Download `google-services.json` and enable FCM in Project Settings. |
| **MOB-122-T3** | 🟡 TO DO | Modisa | Generate Firebase Admin SDK service account key (JSON) for server-side sends. |

#### Detailed Steps — MOB-122-T1 through T3

1. Navigate to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** → Name: `MobiRides` → Disable Google Analytics (unless desired) → Create.
3. In the project dashboard, click **Add App** → Select **Android**.
4. Enter:
   - **Package name:** `com.mobirides.app`
   - **App nickname:** `MobiRides Android`
   - **Debug signing certificate (SHA-1):** *(obtain via `./gradlew signingReport` in `android/` directory)*
5. Click **Register App** → Download `google-services.json`.
6. Navigate to **Project Settings → Cloud Messaging** → Verify FCM is enabled (it should be by default).
7. Navigate to **Project Settings → Service Accounts** → Click **Generate New Private Key** → Download the JSON file.
8. Store the service account JSON securely — it will be uploaded as Supabase secrets in Phase 6.

**Output artifacts:**
- `google-services.json` → place at `android/app/google-services.json`
- Service account key JSON → stored as Supabase secrets (never committed to git)

---

### Phase 2: Android Native Configuration

| Ticket | Status | Owner | Summary |
|--------|--------|-------|---------|
| **MOB-122-T4** | 🟡 TO DO | Antigravity | Secure `google-services.json` in `.gitignore` and place the file. |
| **MOB-122-T5** | 🟡 TO DO | Antigravity | Add Firebase BoM and Messaging SDK to `android/app/build.gradle`. |
| **MOB-122-T6** | 🟡 TO DO | Antigravity | Update `AndroidManifest.xml` with FCM permissions and channel metadata. |

#### T4 — `.gitignore` Security & File Placement

**File:** `android/.gitignore` (line 65)

```diff
 # Google Services (e.g. APIs or Firebase)
-# google-services.json
+google-services.json
```

Place the downloaded `google-services.json` at:
```
android/app/google-services.json
```

The existing conditional apply in `android/app/build.gradle` (lines 64–71) will automatically detect and apply the Google Services plugin:
```groovy
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.exists()) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception ignored) {
    logger.info("google-services.json not found, google-services plugin not applied.")
}
```

#### T5 — Gradle Dependencies

**File:** `android/app/build.gradle`

Add Firebase BoM and Messaging SDK after the existing dependencies block:

```diff
 dependencies {
     implementation fileTree(include: ['*.jar', '*.aar'], dir: 'libs')
     implementation fileTree(include: ['*.jar', '*.aar'], dir: '../capacitor-cordova-android-plugins/src/main/libs')
     implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
     implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
     implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
     implementation "com.google.android.material:material:$materialVersion"
     implementation project(':capacitor-android')
     testImplementation "junit:junit:$junitVersion"
     androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
     androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
     implementation project(':capacitor-cordova-android-plugins')
+
+    // Firebase — Native Push Notifications (MOB-122)
+    implementation platform('com.google.firebase:firebase-bom:33.15.0')
+    implementation 'com.google.firebase:firebase-messaging'
 }
```

> **Note:** Using the Firebase BoM ensures version alignment across all Firebase libraries. Only `firebase-messaging` is needed for FCM.

#### T6 — AndroidManifest.xml Updates

**File:** `android/app/src/main/AndroidManifest.xml`

```diff
 <?xml version="1.0" encoding="utf-8"?>
 <manifest xmlns:android="http://schemas.android.com/apk/res/android">

+    <!-- FCM Push Notifications (MOB-122) — Required for Android 13+ -->
+    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
+
     <application
         android:allowBackup="true"
         android:icon="@mipmap/ic_launcher"
         android:label="@string/app_name"
         android:roundIcon="@mipmap/ic_launcher_round"
         android:supportsRtl="true"
         android:theme="@style/AppTheme">

+        <!-- FCM Default Notification Channel (MOB-122) -->
+        <meta-data
+            android:name="com.google.firebase.messaging.default_notification_channel_id"
+            android:value="mobirides_default" />
+
+        <!-- FCM Default Notification Icon -->
+        <meta-data
+            android:name="com.google.firebase.messaging.default_notification_icon"
+            android:resource="@mipmap/ic_launcher" />
+
         <activity ... />
     </application>
 </manifest>
```

---

### Phase 3: Capacitor Push Notifications Plugin

| Ticket | Status | Owner | Summary |
|--------|--------|-------|---------|
| **MOB-122-T7** | 🟡 TO DO | Antigravity | Install `@capacitor/push-notifications` and sync with Android project. |

#### T7 — Plugin Installation

**Commands:**
```bash
npm install @capacitor/push-notifications
npx cap sync android
```

**File:** `capacitor.config.ts`

```diff
 import type { CapacitorConfig } from '@capacitor/cli';

 const config: CapacitorConfig = {
   appId: 'com.mobirides.app',
   appName: 'MobiRides',
-  webDir: 'dist'
+  webDir: 'dist',
+  plugins: {
+    PushNotifications: {
+      presentationOptions: ['badge', 'sound', 'alert'],
+    },
+  },
 };

 export default config;
```

---

### Phase 4: Firebase TypeScript Service (Client-Side)

| Ticket | Status | Owner | Summary |
|--------|--------|-------|---------|
| **MOB-122-T8** | 🟡 TO DO | Antigravity | Create `src/services/firebaseService.ts` — FCM token lifecycle management. |

#### T8 — `firebaseService.ts` Specification

**New File:** `src/services/firebaseService.ts`

**Responsibilities:**
1. Detect if running on a native platform (via `Capacitor.isNativePlatform()`)
2. Request push notification permissions from the OS
3. Register with FCM and receive the device token
4. Store the FCM token in Supabase `push_subscriptions` table (upsert by `user_id` + platform)
5. Listen for foreground notifications and render in-app toasts
6. Listen for notification taps (from background/killed) and deep-link to the relevant page

**Key implementation details:**

```typescript
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export class FirebaseService {
  private static instance: FirebaseService;
  private initialized = false;
  private currentToken: string | null = null;

  // Singleton pattern (consistent with other services)
  public static getInstance(): FirebaseService { ... }

  /**
   * Initialize — call AFTER user authentication.
   * On web: no-op (Web Push handles it).
   * On native: requests permissions → registers FCM → saves token.
   */
  async initialize(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) return;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.register();

    // Listener: token received
    PushNotifications.addListener('registration', async (token) => {
      this.currentToken = token.value;
      await this.saveTokenToSupabase(token.value);
    });

    // Listener: foreground notification
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // Show in-app toast via sonner
    });

    // Listener: notification tap (deep-link)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = action.notification.data?.url;
      if (url) window.location.href = url;
    });

    this.initialized = true;
  }

  /**
   * Upsert FCM token into push_subscriptions.
   * Uses `fcm://` prefix on endpoint to distinguish from Web Push subscriptions.
   */
  private async saveTokenToSupabase(token: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: `fcm://${token}`,   // Convention: fcm:// prefix
      platform: 'android',
      fcm_token: token,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' });
  }
}

export const firebaseService = FirebaseService.getInstance();
```

**Integration pattern:** The service follows the same singleton + lazy-init pattern as `PushNotificationService`, `CompleteNotificationService`, and other services in the codebase.

---

### Phase 5: Database Schema Migration

| Ticket | Status | Owner | Summary |
|--------|--------|-------|---------|
| **MOB-122-T9** | 🟡 TO DO | Antigravity | Create Supabase migration to add `fcm_token` and `platform` columns to `push_subscriptions`. |

#### T9 — Migration SQL

**New File:** `supabase/migrations/YYYYMMDDHHMMSS_add_fcm_push_support.sql`

```sql
-- ============================================================================
-- MOB-122: Add FCM (Firebase Cloud Messaging) support to push_subscriptions
-- ============================================================================

-- Add columns for native FCM push support
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'web';

-- Index for efficient FCM token lookup during push sends
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fcm_token
  ON public.push_subscriptions (fcm_token)
  WHERE fcm_token IS NOT NULL;

-- Index for platform-based queries (e.g., "send to all Android devices")
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform
  ON public.push_subscriptions (platform);

-- Documentation
COMMENT ON COLUMN public.push_subscriptions.fcm_token
  IS 'Firebase Cloud Messaging device token for native Android push (MOB-122)';
COMMENT ON COLUMN public.push_subscriptions.platform
  IS 'Platform identifier: web | android | ios';
```

**Impact:** Non-destructive `ADD COLUMN IF NOT EXISTS` — safe to run against production. Existing Web Push subscriptions default to `platform = 'web'`.

---

### Phase 6: Server-Side FCM Push (Supabase Edge Function)

| Ticket | Status | Owner | Summary |
|--------|--------|-------|---------|
| **MOB-122-T10** | 🟡 TO DO | Antigravity | Update `send-push-notification` edge function to route FCM tokens via the FCM HTTP v1 API. |
| **MOB-122-T11** | 🟡 TO DO | Modisa | Configure Firebase service account credentials as Supabase secrets. |

#### T10 — Edge Function Update

**File:** `supabase/functions/send-push-notification/index.ts`

**Current behavior:** Sends Web Push using VAPID JWT + direct `fetch()` to the push service endpoint.

**Updated behavior:** Detect the subscription platform and route accordingly:

```
IF endpoint starts with "fcm://"
  → Extract FCM token
  → Authenticate via Firebase service account JWT (Google OAuth2)
  → Send via FCM HTTP v1 API: POST https://fcm.googleapis.com/v1/projects/{PROJECT_ID}/messages:send
ELSE
  → Continue with existing VAPID Web Push logic (unchanged)
```

**FCM HTTP v1 API payload format:**
```json
{
  "message": {
    "token": "<fcm_device_token>",
    "notification": {
      "title": "Booking Confirmed",
      "body": "Your booking for Toyota Corolla has been confirmed!"
    },
    "data": {
      "url": "/bookings",
      "notification_type": "booking_confirmed_renter"
    },
    "android": {
      "priority": "high",
      "notification": {
        "channel_id": "mobirides_default",
        "icon": "ic_launcher",
        "sound": "default"
      }
    }
  }
}
```

**Authentication flow for FCM HTTP v1 API:**
1. Read `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from Supabase secrets
2. Create a signed JWT with scope `https://www.googleapis.com/auth/firebase.messaging`
3. Exchange for a Google OAuth2 access token via `https://oauth2.googleapis.com/token`
4. Use the access token in the `Authorization: Bearer <token>` header

**Error handling:**
- `404` / `UNREGISTERED` → Token expired/invalid → Delete from `push_subscriptions`
- `429` → Rate limited → Log and retry later
- `500` → FCM internal error → Log and continue with other tokens

#### T11 — Supabase Secrets Configuration

Extract the following values from the downloaded Firebase service account JSON and set as Supabase secrets:

```bash
supabase secrets set FIREBASE_PROJECT_ID="mobirides-xxxxx"
supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@mobirides-xxxxx.iam.gserviceaccount.com"
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Security:** The private key must NEVER be committed to source control. It is stored exclusively in Supabase's encrypted secrets vault.

---

### Phase 7: App Integration & Initialization

| Ticket | Status | Owner | Summary |
|--------|--------|-------|---------|
| **MOB-122-T12** | 🟡 TO DO | Antigravity | Initialize `firebaseService` on app startup (post-authentication). |
| **MOB-122-T13** | 🟡 TO DO | Antigravity | Update `pushNotificationService.ts` for platform-aware token handling. |
| **MOB-122-T14** | 🟡 TO DO | Antigravity | Update `.env.example` with Firebase secret documentation. |

#### T12 — App Initialization

**File:** `src/App.tsx` (or equivalent auth-gated component)

After the user session is established (inside the auth state change listener):

```typescript
import { firebaseService } from '@/services/firebaseService';

// Inside useEffect that runs after authentication:
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // Initialize FCM for native platforms
    firebaseService.initialize();
  }
});
```

#### T13 — Push Service Platform Awareness

**File:** `src/services/pushNotificationService.ts`

The existing `sendPushNotification()` method calls the `send-push-notification` edge function, which now handles both Web Push and FCM routing transparently on the server side. **No client-side changes are needed** to the push sending logic — the routing happens based on the `endpoint` prefix (`fcm://` vs `https://`) stored in `push_subscriptions`.

> This is a key architectural decision: the **client-side push service remains unchanged**, and the **server-side edge function becomes the routing layer**. This minimizes blast radius and preserves backward compatibility.

#### T14 — Environment Documentation

**File:** `.env.example`

```diff
 # MobiRides Branding
 MOBIRIDES_FROM_EMAIL=no-reply@mobirides.com
 MOBIRIDES_SUPPORT_EMAIL=support@mobirides.com
 MOBIRIDES_COMPANY_NAME=MobiRides
+
+# Firebase Cloud Messaging — Server-Side (MOB-122)
+# These are stored as Supabase secrets, NOT in .env
+# FIREBASE_PROJECT_ID=your-firebase-project-id
+# FIREBASE_CLIENT_EMAIL=your-service-account-email
+# FIREBASE_PRIVATE_KEY=your-service-account-private-key-pem
```

---

## 🏗️ Technical Architecture

### Notification Delivery Flow (After Implementation)

```
┌──────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGER                    │
│  (Booking confirmed, message received, payment, etc.)     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ completeNotification │
              │   Service.ts        │
              │ (Orchestrator)      │
              └─────────┬───────────┘
                        │
          ┌─────────────┼──────────────┐
          │             │              │
          ▼             ▼              ▼
     ┌─────────┐  ┌──────────┐  ┌──────────┐
     │  Email  │  │ WhatsApp │  │   Push   │
     │ (Resend)│  │ (Twilio) │  │ Service  │
     └─────────┘  └──────────┘  └────┬─────┘
                                     │
                                     ▼
                      ┌──────────────────────────┐
                      │ send-push-notification   │
                      │ (Supabase Edge Function) │
                      └──────────┬───────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          endpoint: "fcm://..."    endpoint: "https://..."
                    │                         │
                    ▼                         ▼
          ┌─────────────────┐     ┌──────────────────┐
          │ FCM HTTP v1 API │     │ Web Push (VAPID)  │
          │ (Firebase)      │     │ (Existing)        │
          └────────┬────────┘     └────────┬─────────┘
                   │                       │
                   ▼                       ▼
          ┌─────────────────┐     ┌──────────────────┐
          │ Android Native  │     │ Browser / PWA    │
          │ System Tray     │     │ Notification     │
          └─────────────────┘     └──────────────────┘
```

### Token Registration Flow

```
App Start → Auth Check → Capacitor.isNativePlatform()?
  ├── YES → PushNotifications.requestPermissions()
  │         → PushNotifications.register()
  │         → FCM token received
  │         → Upsert to push_subscriptions (endpoint: "fcm://TOKEN", platform: "android")
  │
  └── NO  → Existing Web Push flow (VAPID subscription)
            → Upsert to push_subscriptions (endpoint: "https://fcm.googleapis.com/...", platform: "web")
```

---

## ⚠️ Risk Matrix

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Firebase project creation access | Medium | Low | Modisa has Google Cloud admin access |
| `google-services.json` committed to git | High | Medium | Uncomment `.gitignore` exclusion as first step |
| FCM token expiry / rotation | Low | Medium | Upsert strategy handles token refresh automatically |
| Capacitor plugin version conflict | Medium | Low | Using stable `@capacitor/push-notifications` compatible with Capacitor 8 |
| Edge function deployment failure | Medium | Low | Tested locally via `supabase functions serve` before deploy |
| Android 13+ runtime permission denied | Medium | Medium | Graceful fallback — Web Push still works in WebView |
| Firebase service account key leak | Critical | Low | Stored ONLY in Supabase secrets vault, never in source |

---

## 🔒 Security Checklist

- [ ] `google-services.json` excluded from git (`.gitignore` uncommented)
- [ ] Firebase service account key stored as Supabase secrets only
- [ ] SSRF protection on edge function retained (existing `ALLOWED_PUSH_DOMAINS` whitelist updated to include `fcm.googleapis.com`)
- [ ] FCM tokens scoped to authenticated users only (`supabase.auth.getUser()` check)
- [ ] Stale/invalid FCM tokens cleaned up on `UNREGISTERED` response from FCM

---

## ✅ Acceptance Criteria

Mapped to the original Linear issue MOB-122:

| # | Criterion | Verification Method |
|---|-----------|-------------------|
| **AC-1** | `google-services.json` obtained from Firebase Console and placed at `android/app/google-services.json` | `ls android/app/google-services.json` returns the file |
| **AC-2** | Initialization logic in `src/services/firebaseService.ts` successfully registers for FCM and receives a token | Logcat shows `🔥 FCM Token received: <token>` on app launch |
| **AC-3** | Push notification registration tested with physical device/emulator — notification appears in system tray | Send test notification from Firebase Console → appears on device |
| **AC-4** | `google-services.json` not committed to repository | `git status` does not show the file; `.gitignore` has active exclusion |
| **AC-5** | Server-side FCM delivery works end-to-end | Invoke `send-push-notification` edge function with FCM token → notification received on device |
| **AC-6** | Existing Web Push notifications continue to work (no regression) | Browser notification test passes after changes |

---

## 🚦 Execution Tracker

| Phase | Tickets | Status | Dependencies |
|-------|---------|--------|-------------|
| **Phase 1:** Firebase Console | MOB-122-T1, T2, T3 | 🟡 TO DO | Google Cloud access (Modisa) |
| **Phase 2:** Android Native Config | MOB-122-T4, T5, T6 | 🟡 TO DO | Phase 1 complete (needs `google-services.json`) |
| **Phase 3:** Capacitor Plugin | MOB-122-T7 | 🟡 TO DO | None |
| **Phase 4:** Firebase TypeScript Service | MOB-122-T8 | 🟡 TO DO | Phase 3 complete |
| **Phase 5:** Database Migration | MOB-122-T9 | 🟡 TO DO | None (can run in parallel) |
| **Phase 6:** Server-Side FCM | MOB-122-T10, T11 | 🟡 TO DO | Phase 1 (service account key), Phase 5 (schema) |
| **Phase 7:** App Integration | MOB-122-T12, T13, T14 | 🟡 TO DO | Phases 3, 4, 5, 6 all complete |

### Critical Path
```
Phase 1 (Manual) → Phase 2 → Phase 3 → Phase 4 → Phase 7
                                                    ↑
Phase 5 (parallel) ────────────────────────────────┤
Phase 6 (after Phase 1 + 5) ──────────────────────┘
```

### Overall Progress
| Metric | Value |
|--------|-------|
| **Sub-tasks Total** | 14 |
| **Completed** | 0 of 14 |
| **Blocked By** | Firebase Console access (Phase 1) |

---

## 🧪 Verification Plan

### Automated Verification
1. **Build check:** `npm run build && npx cap sync android` — no errors
2. **Gradle build:** `cd android && ./gradlew assembleDebug` — verifies `google-services.json` processed correctly
3. **Edge function test:** `supabase functions serve send-push-notification` → test with mock FCM payload

### Manual Device Testing
1. Build debug APK: `npx cap run android`
2. Launch app on device/emulator with Google Play Services
3. Log in with test account
4. Verify in Logcat: `🔥 FCM Token received: <token>`
5. Verify in Supabase dashboard: `push_subscriptions` row with `platform = 'android'` and populated `fcm_token`
6. From Firebase Console → Cloud Messaging → Send test message using the token
7. Confirm notification appears in Android system tray (both app in foreground and background)
8. Tap notification → verify deep-link navigates to correct page
9. Verify existing Web Push still works in browser (regression check)

---

## 🏁 Definition of Done

- [ ] All 14 sub-tasks completed and verified
- [ ] All 6 acceptance criteria passing
- [ ] No regression in existing Web Push functionality
- [ ] `google-services.json` secured (not in git)
- [ ] Firebase service account key stored in Supabase secrets
- [ ] Sprint 15 plan updated with final status
- [ ] Linear ticket MOB-122 moved to **Done**

---

*Document originally created: April 17, 2026*  
*Updated: May 26, 2026 — Expanded from high-level outline to full Jira-style execution plan*  
*Prepared by: Antigravity AI (on behalf of Modisa Maphanyane)*  
*System Auditor: Antigravity AI*
