

## Root Cause: `useHandover()` crash in non-handover mode

`CustomMapbox.tsx` line 87 calls `useHandover()` unconditionally. The `HandoverContext` throws if used outside a `HandoverProvider`. In normal map mode (no `?mode=handover`), `Map.tsx` does **not** wrap `CustomMapbox` in `HandoverProvider` (lines 425-431), so the hook throws immediately and the entire Map page crashes.

This was introduced when the enhanced navigation changes added the unconditional `useHandover()` call in `CustomMapbox`.

### Fix

**`src/components/map/CustomMapbox.tsx`** — Make the `useHandover()` call safe when no provider exists:

Change lines 87-88 from:
```typescript
const handoverData = useHandover();
const handover = isHandoverMode ? handoverData : null;
```

To use a safe version that doesn't throw:
```typescript
const handoverData = useHandoverSafe();
const handover = isHandoverMode ? handoverData : null;
```

Where `useHandoverSafe` is either:
- A new export from `HandoverContext.tsx` that returns `null` instead of throwing when no provider is found
- Or inline: use `useContext(HandoverContext)` directly (importing the context) without the throw guard

The cleanest approach: add a `useHandoverSafe()` hook to `HandoverContext.tsx`:
```typescript
export const useHandoverSafe = () => {
  return useContext(HandoverContext);
};
```

Then in `CustomMapbox.tsx`, import and use `useHandoverSafe()` instead of `useHandover()`. The existing `const handover = isHandoverMode ? handoverData : null` pattern already handles the null case.

### Changes

| File | Change |
|------|--------|
| `src/contexts/HandoverContext.tsx` | Add `useHandoverSafe()` export that returns context or `null` |
| `src/components/map/CustomMapbox.tsx` | Replace `useHandover()` with `useHandoverSafe()` |

Single root cause, two-line fix.

