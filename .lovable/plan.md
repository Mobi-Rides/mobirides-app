

## Replace App Logo with Uploaded Image

The uploaded `MOBI_LOGO.png` will replace the current logo across the entire app.

### Current Logo Locations

The current logo (`a065be26-80b7-4e50-b683-b6afb0add925.png`) is used in 4 files:
1. **`src/components/Header.tsx`** (line 236) -- main app header
2. **`src/pages/Login.tsx`** (line 258) -- login page
3. **`src/pages/signup.tsx`** (line 13) -- signup page
4. **`src/pages/ResetPassword.tsx`** (line 95) -- reset password page

The favicon (`e4db7130-ffbd-4628-9728-eb992434cd6c.png`) is in:
5. **`index.html`** (line 8)

### Steps

1. **Copy the uploaded image** to `public/lovable-uploads/MOBI_LOGO.png`
2. **Update all 4 component files** to reference `/lovable-uploads/MOBI_LOGO.png` instead of the old logo path
3. **Update `index.html`** favicon to use the new logo as well

This is a straightforward find-and-replace across 5 files -- no logic changes needed.

