# MCP Configuration Security Fix

**Date:** December 5, 2025  
**Priority:** Critical  
**Status:** Action Required

## Issue Summary

The `mcp-config.json` file contains an exposed Supabase Personal Access Token (PAT) that has been committed to version control. This is a security vulnerability.

## Impact Assessment

| Environment | Impact |
|------------|--------|
| Lovable IDE | ✅ No impact - uses native Supabase integration |
| Cursor IDE | ⚠️ Will need local token configuration |
| VS Code | ⚠️ Will need local token configuration |
| Trae IDE | ⚠️ Will need local token configuration |

## Remediation Plan

### Step 1: Add to `.gitignore`
```
# MCP configuration (contains sensitive tokens)
mcp-config.json
```

### Step 2: Sanitize the File
Replace the hardcoded token with a placeholder:
```json
{
    "mcpServers": {
        "supabase-remote": {
            "type": "http",
            "url": "https://mcp.supabase.com/mcp?project_ref=putjowciegpzdheideaf",
            "headers": {
                "Authorization": "Bearer YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"
            }
        }
    }
}
```

### Step 3: Create Example File
Create `mcp-config.example.json` for developer reference.

---

## Post-Implementation (Manual Steps Required)

### 1. Revoke the Exposed Token
1. Go to https://supabase.com/dashboard/account/tokens
2. Find the token starting with `sbp_00550f11...`
3. Click **Revoke** to invalidate it immediately

### 2. Generate New Personal Access Tokens
Each developer needs their own token:
1. Go to https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Give it a descriptive name (e.g., "MobiRides Dev - [Your Name]")
4. Copy the token immediately (it won't be shown again)

### 3. Configure Local MCP
Each developer creates their local `mcp-config.json`:
```json
{
    "mcpServers": {
        "supabase-remote": {
            "type": "http",
            "url": "https://mcp.supabase.com/mcp?project_ref=putjowciegpzdheideaf",
            "headers": {
                "Authorization": "Bearer YOUR_NEW_TOKEN_HERE"
            }
        }
    }
}
```

### 4. Verify `.gitignore` Protection
Run: `git status` - `mcp-config.json` should NOT appear in tracked files.

---

## Verification Checklist

- [ ] Token revoked in Supabase Dashboard
- [ ] `mcp-config.json` added to `.gitignore`
- [ ] File sanitized or removed from repo
- [ ] New tokens generated for developers
- [ ] Local configurations working

## Owner

Assign to: Security Lead / DevOps
