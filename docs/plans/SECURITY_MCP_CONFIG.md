# MCP Configuration Security

## ⚠️ CRITICAL SECURITY NOTICE

**The Supabase API token in `mcp-config.json` was previously hardcoded and committed to version control.**

### Immediate Actions Required:

1. **REVOKE THE EXPOSED TOKEN IMMEDIATELY**
   - Go to Supabase Dashboard → Settings → API
   - Revoke/regenerate the Personal Access Token: `sbp_00550f11a4ace484186a5c0e81123b851365d3b6`
   - Anyone with repository access could have accessed your production database

2. **Do NOT commit `mcp-config.json` with real tokens**
   - The file is now in `.gitignore` to prevent future commits
   - Only commit `mcp-config.json.example` (template file)

## Setup Instructions

1. Copy the example template:
   ```bash
   cp mcp-config.json.example mcp-config.json
   ```

2. Get your Supabase Personal Access Token:
   - Go to Supabase Dashboard → Settings → API → Personal Access Tokens
   - Create a new token with appropriate permissions
   - Copy the token (starts with `sbp_`)

3. Replace the placeholder in `mcp-config.json`:
   ```json
   {
       "mcpServers": {
           "supabase-remote": {
               "type": "http",
               "url": "https://mcp.supabase.com/mcp?project_ref=putjowciegpzdheideaf",
               "headers": {
                   "Authorization": "Bearer YOUR_TOKEN_HERE"
               }
           }
       }
   }
   ```

4. Verify `mcp-config.json` is in `.gitignore` (it should be automatically excluded)

## Security Best Practices

- ✅ Never commit API tokens or secrets to version control
- ✅ Use environment variables for sensitive configuration
- ✅ Rotate tokens immediately if exposed
- ✅ Use least-privilege tokens with minimal required permissions
- ✅ Review repository access regularly

---

**Last Updated:** December 2025  
**Status:** Token removed, configuration secured
