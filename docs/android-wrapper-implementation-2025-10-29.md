# MobiRides Android Wrapper Implementation Plan
**Date**: October 29, 2025  
**Status**: Planning Phase  
**Priority**: P2 - MEDIUM  
**Target Release**: December 2025 (Week 8)  
**Epic**: MOBI-MOBILE-101

---

## Executive Summary

This document outlines the complete implementation plan for creating a native Android wrapper app for MobiRides using Capacitor. The wrapper will enable distribution through Google Play Store while leveraging our existing React web application codebase.

### Key Objectives
1. Create a native Android APK/AAB from existing React web app
2. Integrate essential native features (camera, GPS, push notifications)
3. Meet Google Play Store submission requirements
4. Maintain unified codebase for web and mobile
5. Deliver within 3-4 week timeline

### Expected Outcomes
- **Time to Market**: 3-4 weeks vs 6-12 months for native rewrite
- **Cost Savings**: $2,500-4,000 vs $20,000-40,000 for native development
- **User Base Growth**: +20-30% from mobile-first users
- **App Store Presence**: Official Google Play Store listing
- **Bundle Size**: <25MB download size

---

## Technology Stack

### Core Technologies
- **Capacitor 6.x**: Native wrapper framework
- **React 18.3.1**: Existing web application
- **Vite 5.4.1**: Build tool and bundler
- **TypeScript**: Type-safe development

### Capacitor Plugins Required
```json
{
  "@capacitor/core": "^6.0.0",
  "@capacitor/cli": "^6.0.0",
  "@capacitor/android": "^6.0.0",
  "@capacitor/splash-screen": "^6.0.0",
  "@capacitor/push-notifications": "^6.0.0",
  "@capacitor/camera": "^6.0.0",
  "@capacitor/geolocation": "^6.0.0",
  "@capacitor/filesystem": "^6.0.0",
  "@capacitor/status-bar": "^6.0.0",
  "@capacitor/keyboard": "^6.0.0",
  "vite-plugin-pwa": "^0.20.0"
}
```

---

## Implementation Phases

## PHASE 1: Environment Setup & Configuration (Week 1)

### Story 1.1: Capacitor Installation & Initialization
**Story ID**: MOBI-MOBILE-101  
**Story Points**: 3 SP  
**Duration**: 1-2 days

#### Tasks

**1.1.1 Install Capacitor Dependencies**
```bash
# Install core Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/android

# Install native feature plugins
npm install @capacitor/splash-screen
npm install @capacitor/push-notifications
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/filesystem
npm install @capacitor/status-bar
npm install @capacitor/keyboard

# Install PWA plugin for offline support
npm install -D vite-plugin-pwa
```

**1.1.2 Initialize Capacitor Project**
```bash
npx cap init
```

**Configuration Values:**
- **App ID**: `bw.co.mobirides.app`
- **App Name**: `MobiRides`
- **Web Directory**: `dist`
- **Package Name**: `bw.co.mobirides.app`

**1.1.3 Create Capacitor Configuration File**

Create `capacitor.config.ts` in project root:

```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'bw.co.mobirides.app',
  appName: 'MobiRides',
  webDir: 'dist',
  
  server: {
    androidScheme: 'https',
    // Development configuration (comment out for production)
    // url: 'https://202b4434-c073-48f1-9472-10d5e3aefb97.lovableproject.com',
    // cleartext: true
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#0EA5E9",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff"
    },
    
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0EA5E9'
    },

    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    },

    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },

  // Android-specific configuration
  android: {
    buildOptions: {
      keystorePath: 'release-key.jks',
      keystoreAlias: 'mobirides',
    }
  }
};

export default config;
```

**1.1.4 Add Android Platform**
```bash
npx cap add android
```

This creates the `android/` directory with the native Android project structure.

**1.1.5 Project Structure After Setup**
```
mobirides/
├── android/                    # Native Android project
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── res/
│   │   │       │   ├── drawable/
│   │   │       │   ├── mipmap-*/
│   │   │       │   └── values/
│   │   │       └── java/bw/co/mobirides/app/
│   │   └── build.gradle
│   ├── build.gradle
│   └── gradle.properties
├── capacitor.config.ts         # Capacitor configuration
├── src/                        # React web app (unchanged)
├── dist/                       # Build output (web assets)
└── package.json
```

#### Acceptance Criteria
- ✅ Capacitor CLI installed and accessible
- ✅ `capacitor.config.ts` created with correct app ID
- ✅ Android platform added successfully
- ✅ `android/` directory created with proper structure
- ✅ Can run `npx cap sync` without errors

---

## PHASE 2: Native Features Integration (Week 1-2)

### Story 2.1: Splash Screen Configuration
**Story ID**: MOBI-MOBILE-102  
**Story Points**: 2 SP  
**Duration**: 1 day

#### Tasks

**2.1.1 Create Splash Screen Assets**

Create high-resolution splash screen images:
- **Source Image**: 2732x2732px (square, highest quality)
- **Logo**: MobiRides logo centered on brand color background

**Image Sizes Required:**
```
android/app/src/main/res/
├── drawable/
│   └── splash.png (1280x1280px)
├── drawable-land-hdpi/
│   └── splash.png (800x480px)
├── drawable-land-mdpi/
│   └── splash.png (480x320px)
├── drawable-land-xhdpi/
│   └── splash.png (1280x720px)
├── drawable-land-xxhdpi/
│   └── splash.png (1600x960px)
├── drawable-land-xxxhdpi/
│   └── splash.png (1920x1280px)
├── drawable-port-hdpi/
│   └── splash.png (480x800px)
├── drawable-port-mdpi/
│   └── splash.png (320x480px)
├── drawable-port-xhdpi/
│   └── splash.png (720x1280px)
├── drawable-port-xxhdpi/
│   └── splash.png (960x1600px)
└── drawable-port-xxxhdpi/
    └── splash.png (1280x1920px)
```

**2.1.2 Configure Splash Screen Colors**

Update `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.AppCompat.NoActionBar">
        <item name="android:background">@drawable/splash</item>
        <item name="android:statusBarColor">#0EA5E9</item>
        <item name="android:navigationBarColor">#0EA5E9</item>
    </style>
</resources>
```

**2.1.3 Initialize Splash Screen in App**

Create `src/services/native/splashScreen.ts`:

```typescript
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export const initializeSplashScreen = async () => {
  if (Capacitor.isNativePlatform()) {
    // Hide splash screen after app is fully loaded
    await SplashScreen.hide({
      fadeOutDuration: 300
    });
  }
};

// Call after React app mount
export const hideSplashScreen = async () => {
  if (Capacitor.isNativePlatform()) {
    await SplashScreen.hide();
  }
};
```

Update `src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { initializeSplashScreen } from '@/services/native/splashScreen';

function App() {
  useEffect(() => {
    // Hide splash screen after React app loads
    initializeSplashScreen();
  }, []);

  return (
    // ... existing app code
  );
}
```

#### Acceptance Criteria
- ✅ Splash screen displays on app launch
- ✅ Splash screen auto-hides after 2 seconds
- ✅ Smooth fade-out animation
- ✅ Brand colors consistent with web app
- ✅ No white flash between splash and app

---

### Story 2.2: Push Notifications Setup
**Story ID**: MOBI-MOBILE-103  
**Story Points**: 3 SP  
**Duration**: 2 days

#### Tasks

**2.2.1 Configure Firebase Cloud Messaging**

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add Android app with package name `bw.co.mobirides.app`
3. Download `google-services.json`
4. Place in `android/app/google-services.json`

**2.2.2 Update Android Configuration**

Update `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.4.0'
}
```

**2.2.3 Create Push Notification Service**

Create `src/services/native/pushNotifications.ts`:

```typescript
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/utils/toast-utils';

export interface PushNotificationToken {
  userId: string;
  token: string;
  platform: 'android' | 'ios';
  deviceId?: string;
}

export const initializePushNotifications = async (userId: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only available on native platforms');
    return;
  }

  try {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration success
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      
      // Save token to Supabase
      await savePushToken(userId, token.value, 'android');
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
      toast({
        title: "Notification Setup Failed",
        description: "Unable to enable push notifications",
        variant: "destructive"
      });
    });

    // Handle push notification received
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        
        // Show in-app notification
        toast({
          title: notification.title || "New Notification",
          description: notification.body || "",
        });
      }
    );

    // Handle push notification action (user tapped notification)
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push notification action:', notification);
        
        // Navigate to relevant screen based on notification data
        handleNotificationNavigation(notification.notification.data);
      }
    );

  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

// Save push token to Supabase
const savePushToken = async (userId: string, token: string, platform: 'android' | 'ios') => {
  try {
    const { error } = await supabase
      .from('push_notification_tokens')
      .upsert({
        user_id: userId,
        token: token,
        platform: platform,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) throw error;
    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

// Handle notification navigation
const handleNotificationNavigation = (data: any) => {
  if (data.type === 'booking_request') {
    window.location.href = `/host-bookings/${data.bookingId}`;
  } else if (data.type === 'message') {
    window.location.href = `/messages/${data.conversationId}`;
  } else if (data.type === 'handover') {
    window.location.href = `/handover/${data.sessionId}`;
  }
};

// Remove push notification listeners on logout
export const cleanupPushNotifications = async () => {
  if (Capacitor.isNativePlatform()) {
    await PushNotifications.removeAllListeners();
  }
};
```

**2.2.4 Database Schema for Push Tokens**

```sql
-- Create push_notification_tokens table
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own tokens"
  ON push_notification_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**2.2.5 Integrate into Authentication Flow**

Update `src/hooks/use-user.tsx`:

```typescript
import { initializePushNotifications, cleanupPushNotifications } from '@/services/native/pushNotifications';

// After successful login
useEffect(() => {
  if (user?.id) {
    initializePushNotifications(user.id);
  }
  
  return () => {
    cleanupPushNotifications();
  };
}, [user?.id]);
```

#### Acceptance Criteria
- ✅ Firebase project configured
- ✅ Push notification permission requested on first launch
- ✅ Device token registered and saved to database
- ✅ Notifications received and displayed in-app
- ✅ Tapping notification navigates to correct screen
- ✅ Token cleanup on logout

---

### Story 2.3: Native Camera Integration
**Story ID**: MOBI-MOBILE-104  
**Story Points**: 2 SP  
**Duration**: 1 day

#### Tasks

**2.3.1 Create Camera Service**

Create `src/services/native/camera.ts`:

```typescript
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraOptions {
  quality?: number; // 0-100
  allowEditing?: boolean;
  resultType?: 'uri' | 'base64' | 'dataUrl';
  source?: 'camera' | 'photos' | 'prompt';
  width?: number;
  height?: number;
}

export const takePhoto = async (options: CameraOptions = {}): Promise<Photo | null> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web file input
      return null;
    }

    // Request camera permissions
    const permissions = await Camera.requestPermissions();
    
    if (permissions.camera !== 'granted' && permissions.photos !== 'granted') {
      throw new Error('Camera permission denied');
    }

    // Take photo
    const photo = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Uri,
      source: options.source === 'camera' 
        ? CameraSource.Camera 
        : options.source === 'photos'
        ? CameraSource.Photos
        : CameraSource.Prompt, // Prompt user to choose
      width: options.width,
      height: options.height,
      correctOrientation: true,
      saveToGallery: false
    });

    return photo;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

// Convert photo to File object for upload
export const photoToFile = async (photo: Photo, filename: string): Promise<File> => {
  const response = await fetch(photo.webPath!);
  const blob = await response.blob();
  return new File([blob], filename, { type: 'image/jpeg' });
};

// Multiple photo selection
export const selectMultiplePhotos = async (maxPhotos: number = 5): Promise<Photo[]> => {
  // Note: Capacitor Camera doesn't support multiple selection natively
  // For multiple photos, call takePhoto() multiple times or use a different plugin
  const photos: Photo[] = [];
  
  for (let i = 0; i < maxPhotos; i++) {
    try {
      const photo = await takePhoto({ source: 'photos' });
      if (photo) {
        photos.push(photo);
      } else {
        break; // User cancelled
      }
    } catch (error) {
      break;
    }
  }
  
  return photos;
};
```

**2.3.2 Update Photo Upload Components**

Update existing photo upload components to use native camera:

Example: `src/components/handover/steps/VehicleInspectionStep.tsx`

```typescript
import { takePhoto, photoToFile } from '@/services/native/camera';
import { Capacitor } from '@capacitor/core';

const handlePhotoUploadClick = async (type: string) => {
  if (Capacitor.isNativePlatform()) {
    // Use native camera
    try {
      const photo = await takePhoto({ 
        source: 'prompt', // Let user choose camera or gallery
        quality: 90 
      });
      
      if (photo) {
        const file = await photoToFile(photo, `${type}_${Date.now()}.jpg`);
        await handlePhotoUpload(file, type);
      }
    } catch (error) {
      console.error('Native camera error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera",
        variant: "destructive"
      });
    }
  } else {
    // Web fallback - use file input
    document.getElementById(`file-input-${type}`)?.click();
  }
};
```

#### Acceptance Criteria
- ✅ Native camera opens when taking photos
- ✅ Camera permission requested appropriately
- ✅ Photos saved with proper quality (90%)
- ✅ Photo selection from gallery works
- ✅ Graceful fallback to web file input on web platform
- ✅ All existing photo upload flows work with native camera

---

### Story 2.4: Geolocation & GPS Integration
**Story ID**: MOBI-MOBILE-105  
**Story Points**: 2 SP  
**Duration**: 1 day

#### Tasks

**2.4.1 Create Geolocation Service**

Create `src/services/native/geolocation.ts`:

```typescript
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      // Web fallback
      return await getWebGeolocation();
    }

    // Request permissions
    const permissions = await Geolocation.requestPermissions();
    
    if (permissions.location !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Get current position
    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

// Watch position for real-time tracking (navigation)
export const watchPosition = (
  callback: (location: LocationCoordinates) => void,
  errorCallback?: (error: any) => void
) => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const watchId = Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    },
    (position, error) => {
      if (error) {
        errorCallback?.(error);
        return;
      }

      if (position) {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined
        });
      }
    }
  );

  return watchId;
};

// Clear watch
export const clearWatch = async (watchId: string) => {
  if (watchId) {
    await Geolocation.clearWatch({ id: watchId });
  }
};

// Web fallback
const getWebGeolocation = (): Promise<LocationCoordinates | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Web geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
```

**2.4.2 Update Navigation Components**

Update navigation to use native GPS for better accuracy.

#### Acceptance Criteria
- ✅ Location permission requested appropriately
- ✅ Current location retrieved with high accuracy
- ✅ Position watching works for turn-by-turn navigation
- ✅ Battery-efficient location tracking
- ✅ Graceful fallback to web geolocation API

---

### Story 2.5: Status Bar & Keyboard Configuration
**Story ID**: MOBI-MOBILE-106  
**Story Points**: 1 SP  
**Duration**: 0.5 day

#### Tasks

**2.5.1 Configure Status Bar**

Create `src/services/native/statusBar.ts`:

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export const initializeStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Light });
    
    // Set status bar background color (MobiRides primary blue)
    await StatusBar.setBackgroundColor({ color: '#0EA5E9' });
    
    // Show status bar (in case it was hidden)
    await StatusBar.show();
  } catch (error) {
    console.error('Error configuring status bar:', error);
  }
};

export const hideStatusBar = async () => {
  if (Capacitor.isNativePlatform()) {
    await StatusBar.hide();
  }
};

export const showStatusBar = async () => {
  if (Capacitor.isNativePlatform()) {
    await StatusBar.show();
  }
};
```

**2.5.2 Configure Keyboard**

Create `src/services/native/keyboard.ts`:

```typescript
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export const initializeKeyboard = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Set keyboard style
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
    
    // Configure resize behavior
    await Keyboard.setResizeMode({ mode: 'body' });
    
    // Enable scroll assist
    await Keyboard.setScroll({ isDisabled: false });
  } catch (error) {
    console.error('Error configuring keyboard:', error);
  }
};

// Hide keyboard programmatically
export const hideKeyboard = async () => {
  if (Capacitor.isNativePlatform()) {
    await Keyboard.hide();
  }
};
```

**2.5.3 Initialize in App**

Update `src/App.tsx`:

```typescript
import { initializeStatusBar } from '@/services/native/statusBar';
import { initializeKeyboard } from '@/services/native/keyboard';

useEffect(() => {
  const initializeNativeFeatures = async () => {
    await initializeSplashScreen();
    await initializeStatusBar();
    await initializeKeyboard();
    
    if (user?.id) {
      await initializePushNotifications(user.id);
    }
  };

  initializeNativeFeatures();
}, [user?.id]);
```

#### Acceptance Criteria
- ✅ Status bar styled with brand colors
- ✅ Status bar visible on all screens
- ✅ Keyboard doesn't cover input fields
- ✅ Keyboard style matches app theme
- ✅ Smooth keyboard show/hide animations

---

## PHASE 3: PWA & Offline Support (Week 2)

### Story 3.1: Service Worker & PWA Configuration
**Story ID**: MOBI-MOBILE-107  
**Story Points**: 2 SP  
**Duration**: 1 day

#### Tasks

**3.1.1 Install PWA Plugin**
```bash
npm install -D vite-plugin-pwa
```

**3.1.2 Configure PWA in Vite**

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'og-image.png'],
      
      manifest: {
        name: 'MobiRides - Car Rental Botswana',
        short_name: 'MobiRides',
        description: 'Peer-to-peer car rental platform in Botswana',
        theme_color: '#0EA5E9',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        
        categories: ['travel', 'transportation'],
        shortcuts: [
          {
            name: 'Find a Car',
            url: '/cars',
            description: 'Browse available rental cars'
          },
          {
            name: 'My Bookings',
            url: '/renter-bookings',
            description: 'View your bookings'
          },
          {
            name: 'Messages',
            url: '/messages',
            description: 'Check your messages'
          }
        ]
      },

      workbox: {
        // Runtime caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        
        // Precache important routes
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        
        // Clean up old caches
        cleanupOutdatedCaches: true
      },

      devOptions: {
        enabled: true // Enable in development for testing
      }
    })
  ],
  
  // ... existing config
});
```

**3.1.3 Create Offline Detection Component**

Create `src/components/native/OfflineIndicator.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const setupNetworkListeners = async () => {
      if (Capacitor.isNativePlatform()) {
        // Native network status
        const status = await Network.getStatus();
        setIsOnline(status.connected);

        const handler = await Network.addListener('networkStatusChange', (status) => {
          setIsOnline(status.connected);
          setShowAlert(!status.connected);
        });

        return () => {
          handler.remove();
        };
      } else {
        // Web network status
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
          setIsOnline(true);
          setShowAlert(false);
        };
        const handleOffline = () => {
          setIsOnline(false);
          setShowAlert(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    };

    setupNetworkListeners();
  }, []);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  if (!showAlert && isOnline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top">
      <Alert variant={isOnline ? 'default' : 'destructive'}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertDescription>
          {isOnline 
            ? 'Connection restored. Syncing data...'
            : 'You are offline. Some features may be limited.'}
        </AlertDescription>
      </Alert>
    </div>
  );
};
```

**3.1.4 Add Network Capability**

Install network plugin:
```bash
npm install @capacitor/network
```

Update `src/App.tsx`:

```typescript
import { OfflineIndicator } from '@/components/native/OfflineIndicator';

function App() {
  return (
    <>
      <OfflineIndicator />
      {/* ... existing app content */}
    </>
  );
}
```

#### Acceptance Criteria
- ✅ Service worker registers successfully
- ✅ PWA installable prompt appears on Android
- ✅ Offline mode caches essential assets
- ✅ Network status detection works
- ✅ Offline indicator shows when disconnected
- ✅ App works offline for cached content

---

## PHASE 4: Android Build & Optimization (Week 3)

### Story 4.1: Android Manifest Configuration
**Story ID**: MOBI-MOBILE-108  
**Story Points**: 1 SP  
**Duration**: 0.5 day

#### Tasks

**4.1.1 Update AndroidManifest.xml**

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="bw.co.mobirides.app">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
                     android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <!-- Hardware features -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep links -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https"
                      android:host="mobirides.co.bw" />
            </intent-filter>

        </activity>

        <!-- Firebase Cloud Messaging -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

    </application>

</manifest>
```

**4.1.2 Update build.gradle**

Edit `android/app/build.gradle`:

```gradle
android {
    namespace "bw.co.mobirides.app"
    compileSdk 34
    
    defaultConfig {
        applicationId "bw.co.mobirides.app"
        minSdk 24  // Android 7.0 (covers 95%+ of devices in Botswana)
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        // Enable vector drawables
        vectorDrawables.useSupportLibrary = true
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // Signing config (configured later)
            signingConfig signingConfigs.release
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

#### Acceptance Criteria
- ✅ All required permissions declared
- ✅ Minimum SDK set to 24 (Android 7.0+)
- ✅ Deep links configured for mobirides.co.bw
- ✅ Hardware acceleration enabled
- ✅ Firebase messaging service configured

---

### Story 4.2: App Icons & Branding
**Story ID**: MOBI-MOBILE-109  
**Story Points**: 1 SP  
**Duration**: 0.5 day

#### Tasks

**4.2.1 Generate Adaptive Icons**

Create adaptive icon layers:

**Foreground Layer** (`ic_launcher_foreground.xml`):
```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- MobiRides logo icon here -->
</vector>
```

**Background Layer** (`ic_launcher_background.xml`):
```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0EA5E9"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
```

**4.2.2 Icon Sizes Required**

Generate PNG icons for all densities:
```
android/app/src/main/res/
├── mipmap-mdpi/         (48x48px)
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-hdpi/         (72x72px)
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xhdpi/        (96x96px)
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/       (144x144px)
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xxxhdpi/      (192x192px)
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
└── mipmap-anydpi-v26/   (Adaptive icons)
    ├── ic_launcher.xml
    └── ic_launcher_round.xml
```

**4.2.3 Update App Name & Strings**

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">MobiRides</string>
    <string name="title_activity_main">MobiRides</string>
    <string name="package_name">bw.co.mobirides.app</string>
    <string name="custom_url_scheme">mobirides</string>
</resources>
```

#### Acceptance Criteria
- ✅ App icon displays correctly in launcher
- ✅ Adaptive icon works on Android 8.0+
- ✅ Round icon displays on supported launchers
- ✅ All density variants generated
- ✅ Brand colors consistent with web app

---

### Story 4.3: Bundle Size Optimization
**Story ID**: MOBI-MOBILE-110  
**Story Points**: 2 SP  
**Duration**: 1 day

#### Tasks

**4.3.1 Enable Code Splitting**

Already configured in Vite, but verify:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'maps': ['mapbox-gl'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

**4.3.2 Image Optimization**

1. Compress all images using ImageOptim or similar
2. Convert large images to WebP format
3. Lazy load images below the fold
4. Use srcset for responsive images

**4.3.3 Remove Unused Dependencies**

Audit and remove unused packages:
```bash
npx depcheck
```

**4.3.4 Enable ProGuard**

Create `android/app/proguard-rules.pro`:

```proguard
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }

# Keep Supabase WebSocket
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# General rules
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
```

**4.3.5 Bundle Analysis**

Run bundle analyzer:
```bash
npm run build -- --report
```

**Target Bundle Sizes:**
- Initial load: <2MB
- Total app size: <25MB (uncompressed)
- APK size: <15MB
- AAB size: <12MB

#### Acceptance Criteria
- ✅ Bundle size meets targets
- ✅ Code splitting working correctly
- ✅ Images optimized and compressed
- ✅ ProGuard configuration applied
- ✅ No unused dependencies in production build

---

## PHASE 5: Testing & Play Store Submission (Week 3-4)

### Story 5.1: Device Testing
**Story ID**: MOBI-MOBILE-111  
**Story Points**: 3 SP  
**Duration**: 2 days

#### Tasks

**5.1.1 Build Debug APK**

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

**5.1.2 Test Matrix**

**Devices to Test:**
1. **Budget Device**: Samsung Galaxy A12 (2GB RAM, Android 11)
2. **Mid-Range Device**: Xiaomi Redmi Note 10 (4GB RAM, Android 11)
3. **High-End Device**: Samsung Galaxy S21 (8GB RAM, Android 13)

**Test Scenarios:**

| Feature | Test Steps | Expected Result |
|---------|------------|-----------------|
| **App Launch** | 1. Install APK<br>2. Open app | Splash screen shows, app loads <2s |
| **Authentication** | 1. Sign up new user<br>2. Login | Success, redirects to home |
| **Browse Cars** | 1. Navigate to cars<br>2. Scroll list<br>3. Apply filters | Smooth scrolling, filters work |
| **Car Booking** | 1. Select car<br>2. Choose dates<br>3. Select insurance<br>4. Confirm | Booking created successfully |
| **Camera** | 1. Upload profile photo<br>2. Take verification photo | Native camera opens, photo uploads |
| **GPS/Navigation** | 1. View car location<br>2. Start navigation | Map loads, navigation starts |
| **Messages** | 1. Send message<br>2. Receive reply | Real-time messaging works |
| **Push Notifications** | 1. Trigger notification<br>2. Tap notification | Notification received, navigates correctly |
| **Offline Mode** | 1. Turn off network<br>2. Navigate app | Cached pages load, offline indicator shows |
| **Payment** | 1. Top up wallet (Orange Money)<br>2. Make payment | Payment flow completes |
| **Performance** | 1. Monitor app<br>2. Check memory usage | <150MB RAM, smooth 60fps |

**5.1.3 Bug Tracking**

Use GitHub Issues for tracking:
- **Critical**: App crashes, data loss
- **High**: Feature doesn't work, major UI issues
- **Medium**: Minor bugs, UX improvements
- **Low**: Polish, nice-to-have features

**5.1.4 Performance Benchmarks**

Measure and record:
- Cold start time: <2 seconds
- Hot start time: <0.5 seconds
- Memory usage: <150MB (low-end devices)
- Battery drain: <5% per hour of active use
- Network usage: <10MB per hour (excluding media)

#### Acceptance Criteria
- ✅ Tested on 3+ devices across all Android versions
- ✅ All critical user flows working
- ✅ No crashes or critical bugs
- ✅ Performance targets met
- ✅ Battery usage acceptable
- ✅ All bugs documented and triaged

---

### Story 5.2: Signed Release Build
**Story ID**: MOBI-MOBILE-112  
**Story Points**: 1 SP  
**Duration**: 0.5 day

#### Tasks

**5.2.1 Generate Release Keystore**

```bash
keytool -genkey -v \
  -keystore mobirides-release.keystore \
  -alias mobirides \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Enter details:
# - Password: [SECURE PASSWORD - STORE IN PASSWORD MANAGER]
# - Name: MobiRides
# - Organization: MobiRides Botswana
# - City: Gaborone
# - State: South-East
# - Country: BW
```

**CRITICAL**: Store keystore and passwords securely. If lost, you cannot update the app on Play Store.

**5.2.2 Configure Signing in build.gradle**

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../mobirides-release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'mobirides'
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**5.2.3 Build Signed AAB (Android App Bundle)**

```bash
# Set environment variables
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_PASSWORD="your_key_password"

# Build release
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**5.2.4 Verify Signed Bundle**

```bash
# Check signature
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab

# Should show: "jar verified"
```

#### Acceptance Criteria
- ✅ Release keystore generated and backed up
- ✅ Signing configuration added to build.gradle
- ✅ Signed AAB built successfully
- ✅ Bundle signature verified
- ✅ Bundle size <12MB

---

### Story 5.3: Google Play Store Submission
**Story ID**: MOBI-MOBILE-113  
**Story Points**: 2 SP  
**Duration**: 1 day

#### Tasks

**5.3.1 Create Google Play Console Account**

1. Visit [play.google.com/console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete account verification
4. Add payment merchant account (for paid apps/IAP - optional)

**5.3.2 Prepare Store Assets**

**App Icon**:
- Size: 512x512px
- Format: PNG (32-bit, no alpha)
- MobiRides logo on transparent or solid background

**Feature Graphic**:
- Size: 1024x500px
- Format: PNG or JPEG
- Showcase app on phone mockup with tagline

**Screenshots** (5-8 required):
- Phone: 16:9 or 9:16 aspect ratio
- Minimum dimension: 320px
- Maximum dimension: 3840px
- Recommended: 1080x1920px (portrait)

**Screenshot Ideas**:
1. Home screen with featured cars
2. Car details with booking interface
3. Navigation/map view
4. Messaging interface
5. User profile and verification
6. Booking confirmation
7. Insurance selection
8. Handover process

**Promotional Video** (optional but recommended):
- 30-second overview
- Upload to YouTube (unlisted)
- Paste URL in Play Console

**5.3.3 Write Store Listing**

**Short Description** (80 characters max):
```
Rent cars easily in Botswana. Browse, book, and drive with MobiRides.
```

**Full Description** (4000 characters max):
```
MobiRides - Botswana's Premier Car Rental Platform

Find and rent the perfect car for your next trip in Botswana. MobiRides connects you with verified car owners offering quality vehicles at competitive prices.

🚗 WHY CHOOSE MOBIRIDES?

✓ Wide Selection - Browse hundreds of cars from sedans to SUVs
✓ Trusted Community - All hosts and renters are verified
✓ Secure Payments - Pay safely with Orange Money, Stripe, or bank transfer
✓ Insurance Included - Choose from Basic, Standard, or Premium coverage
✓ Real-time GPS Navigation - Built-in turn-by-turn directions
✓ Instant Messaging - Chat directly with car owners
✓ Transparent Pricing - No hidden fees, see total cost upfront

🔐 SAFETY FIRST

• Identity verification for all users
• Driver's license validation
• Comprehensive insurance options
• Vehicle inspection checklist
• Digital handover process
• 24/7 customer support

💰 HOW IT WORKS

1. Browse - Find the perfect car for your needs
2. Book - Select dates and choose insurance coverage
3. Meet - Coordinate pickup with the host via in-app messaging
4. Drive - Enjoy your rental with built-in navigation
5. Return - Complete the handover process and rate your experience

📱 KEY FEATURES

• Dynamic pricing based on demand
• Real-time availability calendar
• Push notifications for bookings and messages
• Offline mode for viewing cached content
• Secure digital wallet for hosts
• Review system for transparency
• Commission-free peer-to-peer rentals

🌍 MADE FOR BOTSWANA

MobiRides is built specifically for the Botswana market, supporting local payment methods including Orange Money and accepting Pula (BWP) currency.

Whether you're a traveler needing a car for your Botswana adventure, or a car owner looking to earn extra income, MobiRides makes it simple and secure.

Download now and experience the future of car rental in Botswana!

---

Support: support@mobirides.co.bw
Website: https://mobirides.co.bw
Terms: https://mobirides.co.bw/terms
Privacy: https://mobirides.co.bw/privacy
```

**5.3.4 Configure App Settings**

**Category**: 
- Primary: Travel & Local
- Secondary: Transportation (if allowed)

**Content Rating**:
- Complete questionnaire (likely PEGI 3 / Everyone)

**Target Audience**:
- Age: 18+ (due to driver's license requirement)

**Privacy Policy**:
- URL: https://mobirides.co.bw/privacy
- Ensure policy covers:
  - Data collection (email, phone, location, photos)
  - Data usage (booking management, navigation)
  - Third-party services (Supabase, Mapbox, Firebase)
  - User rights (access, deletion, portability)

**App Access**:
- Requires login: Yes
- Demo account credentials for review (optional)

**Data Safety**:
- Collected data: Location, Photos, Personal info, Financial info
- Data sharing: With service providers only
- Data encryption: In transit and at rest
- User data deletion: Available on request

**5.3.5 Upload AAB and Submit**

1. Create new release in Production track
2. Upload `app-release.aab`
3. Set release name: "1.0.0 - Initial Release"
4. Write release notes:
   ```
   Welcome to MobiRides v1.0.0!

   🚗 Initial Release Features:
   • Browse and book cars across Botswana
   • Secure payments with Orange Money and Stripe
   • Comprehensive insurance options
   • Real-time GPS navigation
   • Instant messaging with hosts
   • User verification and safety features
   • Offline mode support

   Thank you for choosing MobiRides!
   ```
5. Review everything
6. Submit for review

**5.3.6 Review Process Timeline**

- **Initial Review**: 5-7 days
- **Resubmission** (if rejected): 2-3 days
- **Average Time to Go Live**: 7-14 days

**Common Rejection Reasons**:
1. Insufficient functionality (app is just a web wrapper)
2. Missing privacy policy
3. Crashes on test devices
4. Permissions not justified in description
5. Content rating issues

**Mitigation**:
- We've added native features (camera, GPS, push notifications, offline mode)
- Privacy policy is comprehensive and accessible
- Thorough testing completed
- All permissions explained in description

#### Acceptance Criteria
- ✅ Play Console account created and verified
- ✅ All store assets prepared and uploaded
- ✅ App description compelling and complete
- ✅ Privacy policy accessible and compliant
- ✅ AAB uploaded successfully
- ✅ App submitted for review
- ✅ No immediate rejection (validation passed)

---

## PHASE 6: Post-Launch Monitoring (Week 4+)

### Post-Launch Checklist

**Day 1-7: Critical Monitoring**
- [ ] Monitor crash reports (Firebase Crashlytics)
- [ ] Track user acquisition (Play Console)
- [ ] Monitor app performance (ANRs, crashes)
- [ ] Respond to initial user reviews
- [ ] Fix any critical bugs immediately

**Week 2-4: Performance Tuning**
- [ ] Analyze user behavior (Firebase Analytics)
- [ ] Optimize slow screens based on data
- [ ] Address user feedback in reviews
- [ ] Plan first update based on learnings

**Ongoing:**
- [ ] Monthly app updates
- [ ] Regular security patches
- [ ] Feature additions based on user requests
- [ ] A/B testing for key flows

---

## Success Metrics

### Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **App Store Rating** | 4.3+ stars | Google Play Console |
| **Crash-Free Rate** | >99.5% | Firebase Crashlytics |
| **ANR Rate** | <0.5% | Play Console Vitals |
| **Cold Start Time** | <2 seconds | Play Console Vitals |
| **Bundle Size** | <12MB (AAB) | Build output |
| **Memory Usage** | <150MB | Android Profiler |
| **Battery Drain** | <5%/hour | Manual testing |

### Business KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Installs (Week 1)** | 100+ | Play Console |
| **Installs (Month 1)** | 1,000+ | Play Console |
| **Active Users (DAU)** | 200+ | Firebase Analytics |
| **Retention (Day 7)** | >40% | Firebase Analytics |
| **Bookings from Mobile** | 30%+ of total | Backend analytics |
| **Conversion Rate** | 15%+ (install → booking) | Backend analytics |

### User Satisfaction

| Metric | Target | Measurement |
|--------|--------|-------------|
| **App Store Reviews** | 50+ in Month 1 | Play Console |
| **Average Rating** | 4.5+ stars | Play Console |
| **Review Sentiment** | 80%+ positive | Manual analysis |
| **Support Tickets (Mobile)** | <10% of tickets | Support system |

---

## Risk Assessment

### Technical Risks

**1. WebView Performance on Low-End Devices**
- **Risk Level**: MEDIUM
- **Mitigation**: Extensive testing on budget devices, code optimization, reduce animations
- **Contingency**: Release "Lite" version with simplified UI

**2. Play Store Rejection**
- **Risk Level**: MEDIUM
- **Mitigation**: Added sufficient native functionality, comprehensive testing
- **Contingency**: Address rejection reasons quickly, resubmit within 48 hours

**3. Native Plugin Compatibility Issues**
- **Risk Level**: LOW
- **Mitigation**: Using stable, well-maintained Capacitor plugins
- **Contingency**: Implement web fallbacks for non-critical features

**4. Bundle Size Exceeds Targets**
- **Risk Level**: LOW
- **Mitigation**: Aggressive code splitting, image optimization, ProGuard
- **Contingency**: Remove non-essential features, lazy load more modules

### Business Risks

**5. Low Adoption Rate**
- **Risk Level**: MEDIUM
- **Mitigation**: Marketing campaign, ASO optimization, referral program
- **Contingency**: Adjust marketing strategy, offer launch incentives

**6. Payment Integration Issues**
- **Risk Level**: HIGH
- **Mitigation**: Thorough testing of Orange Money + Stripe in WebView
- **Contingency**: Fallback to web payment flow if native issues occur

**7. User Complaints About "Not Native Feel"**
- **Risk Level**: LOW
- **Mitigation**: Optimized animations, native UI patterns, smooth transitions
- **Contingency**: Gradually add more native screens for critical flows (Phase 2 - Q1 2026)

---

## Budget Estimate

### Development Costs

| Item | Cost (USD) | Notes |
|------|------------|-------|
| **Development Time** | $2,000 - $3,000 | 3-4 weeks @ $150-200/day |
| **Google Play Developer Account** | $25 | One-time fee |
| **Firebase Plan** | $0 - $50/month | Spark (free) likely sufficient initially |
| **App Store Assets** | $200 - $500 | Designer for icon, screenshots, graphics |
| **Code Signing Certificate** | $0 | Included with keystore generation |
| **Testing Devices** | $0 - $300 | If purchasing budget test device |
| **Contingency (15%)** | $300 - $600 | For unexpected issues |

**Total Estimated Cost**: **$2,525 - $4,475**

### Ongoing Costs (Post-Launch)

| Item | Monthly Cost (USD) | Notes |
|------|-------------------|-------|
| **Firebase (Crashlytics, Analytics)** | $0 - $50 | Scales with usage |
| **Push Notifications (FCM)** | $0 | Free from Google |
| **App Maintenance** | $200 - $500 | Bug fixes, updates |
| **Marketing (ASO, ads)** | $100 - $1,000 | Optional, scales with goals |

**Estimated Monthly Cost**: **$300 - $1,550**

---

## Timeline Summary

### Week-by-Week Breakdown

**Week 1: Setup & Configuration (Nov 25 - Dec 1)**
- Mon-Tue: Capacitor setup, Android platform added
- Wed-Thu: Native features (splash, push, camera, GPS)
- Fri: Status bar, keyboard, initial testing

**Week 2: Features & PWA (Dec 2-8)**
- Mon-Tue: PWA configuration, offline support
- Wed: Network detection, service worker
- Thu-Fri: Testing all native features integration

**Week 3: Build & Optimize (Dec 9-15)**
- Mon: Android manifest, build configuration
- Tue: App icons, branding
- Wed: Bundle size optimization
- Thu-Fri: Performance tuning, device testing

**Week 4: Launch Prep (Dec 16-22)**
- Mon: Signed release build
- Tue-Wed: Play Store assets, listing preparation
- Thu: Submit to Play Store
- Fri: Monitor submission, address any immediate issues

**Week 5+: Review & Launch (Dec 23-31)**
- Dec 23-30: Google review period (5-7 days)
- Dec 31: Target go-live date (if approved)
- Jan 1-7: Post-launch monitoring and hot-fixes

---

## Developer Handoff

### Key Files Reference

**Configuration Files**:
- `capacitor.config.ts` - Main Capacitor configuration
- `android/app/build.gradle` - Android build settings
- `android/app/src/main/AndroidManifest.xml` - App permissions and activities
- `vite.config.ts` - PWA and build configuration

**Native Service Layer**:
- `src/services/native/splashScreen.ts` - Splash screen management
- `src/services/native/pushNotifications.ts` - Push notification handling
- `src/services/native/camera.ts` - Native camera integration
- `src/services/native/geolocation.ts` - GPS and location services
- `src/services/native/statusBar.ts` - Status bar styling
- `src/services/native/keyboard.ts` - Keyboard configuration

**Components**:
- `src/components/native/OfflineIndicator.tsx` - Network status indicator

### Build Commands

**Development**:
```bash
npm run dev          # Start Vite dev server
npm run build        # Build web app for production
npx cap sync         # Sync web build to native platforms
npx cap open android # Open Android project in Android Studio
```

**Production Release**:
```bash
npm run build                  # Build web app
npx cap sync android           # Sync to Android
cd android
./gradlew bundleRelease        # Create signed AAB
```

### Testing Commands

```bash
# Run on emulator
npx cap run android

# Run on specific device
npx cap run android --target=device_id

# Check for issues
npx cap doctor
```

### Troubleshooting

**Common Issues**:

1. **Build fails after sync**:
   - Solution: `cd android && ./gradlew clean`

2. **WebView not loading**:
   - Check `capacitor.config.ts` server URL
   - Ensure `cleartext` enabled for dev

3. **Native plugin not working**:
   - Run `npx cap sync` after installing plugins
   - Check permissions in AndroidManifest.xml

4. **Keystore not found**:
   - Ensure `mobirides-release.keystore` is in `android/` directory
   - Check environment variables set correctly

---

## Conclusion

This implementation plan provides a complete roadmap for creating a native Android wrapper app for MobiRides using Capacitor. The approach balances speed to market (3-4 weeks) with sufficient native functionality to meet Google Play Store requirements and provide a quality user experience.

**Key Advantages**:
- ✅ Reuses 100% of existing React codebase
- ✅ Adds essential native features (camera, GPS, push notifications)
- ✅ Meets Play Store submission requirements
- ✅ Cost-effective ($2,500-4,500 vs $20,000-40,000 for native)
- ✅ Maintains unified codebase for web and mobile

**Next Phase** (Q1 2026):
After successful launch and user feedback, consider Phase 2 enhancements:
- Native screens for critical flows (booking, handover)
- Performance optimizations for low-end devices
- Advanced offline functionality
- iOS version using same Capacitor setup

**Final Notes**:
- Prioritize thorough testing on real devices
- Budget extra time for Play Store review process
- Plan for post-launch monitoring and rapid bug fixes
- Gather user feedback early to guide future updates

---

**Document Version**: 1.0  
**Last Updated**: October 29, 2025  
**Next Review**: December 31, 2025 (Post-launch)
