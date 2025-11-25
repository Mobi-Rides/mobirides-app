## MCP Servers Setup Plan (Supabase, Resend, Twilio, WhatsApp)

This document outlines how to configure Model Context Protocol (MCP) servers for Supabase, Resend, Twilio, and WhatsApp in Cursor using Command Prompt (no PowerShell).

Reference repository: `https://github.com/Mobi-Rides/mobirides-app.git`

---

### 1) Create `.cursor/mcp.json`

Create a `.cursor/mcp.json` file at the repository root with the following content (fill in environment variables later):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp"],
      "env": {
        "SUPABASE_URL": "",
        "SUPABASE_ANON_KEY": "",
        "SUPABASE_SERVICE_ROLE_KEY": ""
      }
    },
    "resend": {
      "command": "npx",
      "args": ["-y", "resend-mcp"],
      "env": {
        "RESEND_API_KEY": ""
      }
    },
    "twilio": {
      "command": "npx",
      "args": ["-y", "twilio-mcp"],
      "env": {
        "TWILIO_ACCOUNT_SID": "",
        "TWILIO_AUTH_TOKEN": "",
        "TWILIO_MESSAGING_SERVICE_SID": ""
      }
    },
    "whatsapp": {
      "command": "npx",
      "args": ["-y", "whatsapp-mcp"],
      "env": {
        "WHATSAPP_TOKEN": "",
        "WHATSAPP_PHONE_NUMBER_ID": "",
        "WHATSAPP_BUSINESS_ACCOUNT_ID": ""
      }
    }
  }
}
```

Notes:
- Uses `npx -y <server>` so no global installs are required.
- If the package names differ (e.g., community variants), replace the server names in `args` accordingly.

---

### 2) Add environment placeholders

Create `.env.local` at the repo root (if it does not exist) and add:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

Optionally mirror these into `.env.example` for teammates.

---

### 3) Verify via Command Prompt (no PowerShell)

```bat
cd /d "C:\\Users\\Administrator\\.cursor\\Mobi Rides v1"
type ".cursor\\mcp.json"
```

Reload the workspace in Cursor; it should detect `.cursor/mcp.json` and start MCP servers on demand.

---

### 4) Package name variations (if needed)

- Supabase MCP: `supabase-mcp` or `@supabase-community/mcp-server`
- Resend MCP: `resend-mcp`
- Twilio MCP: `twilio-mcp`
- WhatsApp MCP: `whatsapp-mcp` or a Twilio MCP that supports WhatsApp

Replace the names in the `args` array to match the chosen packages.

---

### 5) Next steps

- Fill in environment variables with real credentials.
- Commit `.cursor/mcp.json` and update `.env.example` for team onboarding.
- Test each MCP server within Cursor and grant requested permissions when prompted.


