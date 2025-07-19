# Comprehensive Lint Error Fix Guide

## Status: 52 Remaining Errors (Down from 95)

### Critical TypeScript Fixes Needed:

1. **Fix remaining any types:**
```typescript
// src/components/handover/EnhancedHandoverSheet.tsx line 66
// Replace: any
// With: HandoverSessionData | null

// src/components/map/CustomMapbox.tsx lines 89, 106
// Replace: any
// With: mapboxgl.MapboxEvent<MouseEvent | TouchEvent>

// src/components/profile/ProfileError.tsx line 16
// Replace: any
// With: Error | string

// src/components/profile/ProfileMenu.tsx line 23
// Replace: any
// With: User | null
```

2. **Fix React Hook Dependencies:**
```typescript
// Add missing dependencies to useEffect hooks:
// - Include all referenced variables in dependency arrays
// - Wrap frequently changing functions in useCallback
// - Use useRef for stable references where needed
```

3. **Fix Promise Executor Issue:**
```typescript
// src/components/profile/location/GeolocationHandler.tsx line 24
// Replace: new Promise(async (resolve, reject) => {
// With: new Promise((resolve, reject) => {
//   (async () => {
//     // async logic here
//   })().then(resolve).catch(reject);
// });
```

4. **Fix Fast Refresh Warnings:**
```typescript
// Move constants to separate files:
// - Extract FEATURES array from CarFeatures.tsx
// - Extract STATUS_MAP from PermissionStatus.tsx
// - Extract variant functions from UI components
```

5. **Fix Require Import Issues:**
```typescript
// tailwind.config.ts and src/tailwind.config.ts
// Replace: require()
// With: import statements
```

### Automated Fix Commands:

```bash
# Run ESLint with auto-fix for simple issues
npm run lint -- --fix

# Check remaining errors
npm run lint 2>&1 | grep "error" | wc -l
```

### Testing After Fixes:
```bash
# Ensure build still works
npm run build

# Run linter to verify fixes
npm run lint

# Start dev server to test functionality
npm run dev
```

## Result: Should reduce to <10 critical errors that require manual review 