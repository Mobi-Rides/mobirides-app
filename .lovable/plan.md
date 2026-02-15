

# Phase 4: Detailed Reviews -- Revised Implementation Plan

## Pre-Implementation Findings (Documentation Check)

A thorough audit revealed several misalignments between the existing backend and our planned categories:

| Area | Current State | Required Action |
|------|--------------|-----------------|
| DB function `calculate_category_ratings` | Uses keys: `cleanliness`, `punctuality`, `responsiveness`, `car_condition`, `rental_experience` | Must be updated to new keys |
| Existing `category_ratings` data | All 8 reviews have empty `{}` | No migration needed -- safe to change keys |
| `calculate_category_ratings` RPC | Never called from frontend | Will be wired up for car detail page |
| `calculate_car_rating` RPC | Used by `CarListing.tsx` and `RenterView.tsx`, defaults to 4.0 | No changes needed -- continues to work |
| `RentalReview.tsx` | Never writes `category_ratings` | Must be updated to save category data |
| Admin `ReviewDetailsDialog` | Only shows overall rating | Should display category breakdown |
| Recency weighting | Not implemented | Simple average for now (all reviews equal weight) |

---

## Finalized Category Keys

**Renter reviewing Car/Host** (`review_type: "car"`):
- `cleanliness` -- How clean was the car at pickup
- `accuracy` -- Did the car match the listing
- `communication` -- Host responsiveness
- `value` -- Worth the price

**Host reviewing Renter** (`review_type: "host_to_renter"`):
- `punctuality` -- On-time pickup and return
- `car_care` -- Condition of car on return
- `communication` -- Renter responsiveness

---

## Implementation Steps

### Step 1: Reusable Components (New Files)

**`src/components/reviews/CategoryRatingInput.tsx`**
- Props: `categories: { key: string; label: string }[]`, `ratings: Record<string, number>`, `onChange`
- Renders a compact list of category labels each with 5 tappable stars
- Mobile-first: labels left-aligned, stars right-aligned, each row 44px touch target
- Used by both `RentalReview.tsx` and the new host review page

**`src/components/reviews/CategoryRatingDisplay.tsx`**
- Props: `categoryAverages: Record<string, number>`, `reviewCount: number`
- Renders compact star rows: category label on the left, filled stars + numeric score on the right
- Gracefully hides categories with 0 reviews (legacy backfill handling)
- Used by `CarReviews.tsx` header area

### Step 2: Update RentalReview.tsx (Renter Review Form)

- Import `CategoryRatingInput` with renter categories (cleanliness, accuracy, communication, value)
- Add `categoryRatings` state: `Record<string, number>`
- Insert category rating section between the car image and the overall rating
- Overall rating auto-calculated as average of category ratings (rounded to nearest 0.5)
- Save `category_ratings` jsonb alongside `rating` on submit
- Validation: require all 4 categories rated before submit

### Step 3: Host Review Page (New Route)

- New file: `src/pages/HostRentalReview.tsx`
- Route: `/review/host/:bookingId`
- Same layout pattern as `RentalReview.tsx` but with host categories (punctuality, car_care, communication)
- `review_type` set to `"host_to_renter"`
- Accessible from host booking management when booking status is completed
- Overall rating auto-calculated from category averages

### Step 4: Update CarReviews.tsx (Car Detail Page Display)

- Call `calculate_category_ratings` RPC to fetch category averages
- Render `CategoryRatingDisplay` in the card header area, below the review count
- Each individual review card: show category breakdown inline (collapsible) if `category_ratings` is non-empty
- Legacy reviews (empty categories): show only overall star rating (current behavior preserved)

### Step 5: Update DB Function

- ALTER the `calculate_category_ratings` function to use new keys: `cleanliness`, `accuracy`, `communication`, `value` for car reviews
- Add a second branch or separate function for host-to-renter category keys: `punctuality`, `car_care`, `communication`
- Keep simple averaging (no recency weighting for now -- all published reviews weighted equally)

### Step 6: Admin ReviewDetailsDialog Update

- Show category breakdown when `category_ratings` is non-empty
- Reuse `CategoryRatingDisplay` component
- No new admin routes needed

---

## Averaging Logic (Addressing the "Over Time" Concern)

- **Simple average**: All published reviews contribute equally regardless of age
- **Backfill safe**: Legacy reviews with empty `category_ratings` are excluded from category averages (the DB function already handles this with the `category_ratings ? category_key` check)
- **Overall rating**: Continues to use the `rating` column (via `calculate_car_rating`), which averages ALL reviews. Category averages are supplementary detail only.
- **Future consideration**: Recency-weighted or rolling-window averages can be added later by modifying the DB function without frontend changes

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/components/reviews/CategoryRatingInput.tsx` | New -- reusable star input per category |
| `src/components/reviews/CategoryRatingDisplay.tsx` | New -- compact star row display |
| `src/pages/RentalReview.tsx` | Edit -- add category ratings to form and submission |
| `src/pages/HostRentalReview.tsx` | New -- host review page with host-specific categories |
| `src/components/car-details/CarReviews.tsx` | Edit -- fetch and display category averages |
| `src/components/admin/ReviewDetailsDialog.tsx` | Edit -- show category breakdown |
| `src/App.tsx` | Edit -- add `/review/host/:bookingId` route |
| DB: `calculate_category_ratings` function | Edit -- update category keys |

---

## Edge Cases

- **Legacy reviews**: Display overall rating only; excluded from category averages
- **Partial category ratings**: If a user somehow submits with some categories missing, DB function skips nulls via the `?` operator
- **Duplicate review prevention**: Already handled by existing check in `RentalReview.tsx` (queries for existing review by booking + reviewer)
- **Host review access**: Only the host of the booking can access `/review/host/:bookingId`; validated by checking `booking.cars.owner_id === user.id`

