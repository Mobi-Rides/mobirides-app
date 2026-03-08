

## Fix Car Location Map: Use Location Text + Host Coordinates as Fallback

### Problem
~40 of 63 cars have `NULL` lat/lng in the database. The `toSafeCarWithProfiles` function defaults these to `(0, 0)` — the Gulf of Guinea — making the map appear broken. Meanwhile, each car already has a `location` text field (e.g. "Gaborone") and a host (`owner_id`) whose `profiles` row may have valid coordinates from location sharing.

### Solution: Two-tier coordinate resolution

When a car's own coordinates are missing/zero, resolve them in order:

1. **Host's profile coordinates** — query `profiles` for `owner_id` to get `latitude`/`longitude` (the host's last shared location, since car locations are tied to host locations)
2. **Forward geocode the `location` text** — use Mapbox Geocoding API to convert e.g. "Gaborone" → `(-24.65, 25.92)`
3. **Hide map** — if both fail, show just the location text with a "Map unavailable" message instead of rendering an empty/broken map

### Changes

| File | Change |
|------|--------|
| `src/utils/mapbox/geocoding.ts` | Add `forwardGeocode(locationText)` function — calls Mapbox `geocoding/v5/mapbox.places/{text}.json` and returns `{lat, lng}` or `null` |
| `src/pages/CarDetails.tsx` | After fetching car, if `latitude/longitude` are null or 0: (a) fetch host profile coords via `owner_id`, (b) if still missing, call `forwardGeocode(car.location)`, (c) pass resolved coords to `CarLocation` or skip rendering |
| `src/components/car-details/CarLocation.tsx` | Add early-return fallback UI when coords are `(0,0)` or invalid — show location text + "Exact location unavailable" instead of an empty map div |

### Technical Detail

**New `forwardGeocode` function:**
```typescript
export const forwardGeocode = async (query: string): Promise<{lat: number; lng: number} | null> => {
  const token = await getMapboxToken();
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&access_token=${token}`
  );
  const data = await res.json();
  if (data.features?.[0]?.center) {
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  }
  return null;
};
```

**Coordinate resolution in CarDetails.tsx:**
```typescript
// After car query resolves:
let resolvedLat = car.latitude;
let resolvedLng = car.longitude;

if (!resolvedLat || !resolvedLng) {
  // Try host's profile location
  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('latitude, longitude')
    .eq('id', car.owner_id)
    .maybeSingle();
  
  if (hostProfile?.latitude && hostProfile?.longitude) {
    resolvedLat = hostProfile.latitude;
    resolvedLng = hostProfile.longitude;
  } else {
    // Forward geocode the location text
    const coords = await forwardGeocode(car.location);
    if (coords) { resolvedLat = coords.lat; resolvedLng = coords.lng; }
  }
}
```

**CarLocation fallback UI** (when coords still invalid):
```tsx
if (!latitude || !longitude || (latitude === 0 && longitude === 0)) {
  return (
    <Card>
      <CardHeader><CardTitle>Location</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-red-500" />
          <p>{location}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Exact location unavailable</p>
      </CardContent>
    </Card>
  );
}
```

### Outcome
- Cars with host location sharing get the host's live coordinates on their map
- Cars with only a text location get geocoded coordinates (cached per render)
- Cars with neither get a clean fallback instead of a broken map

