---
project_name: 'mobirides-app'
user_name: 'Duma'
date: '2026-04-06T18:44:00Z'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 38
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Runtime Strategy**: Dual-runtime support (Deno + Node 20+) using strict ESM.
- **Build Tool**: Vite 7.3.1
- **Frontend**: React 19.2.3, TypeScript 5.9.3
- **Backend/DB**: Supabase 2.91.0 (`@supabase/supabase-js`)
- **Mobile**: Capacitor 8.0.2, Target Android API Level 34.
- **Accessibility Baseline**: WCAG 2.1 AA Compliance mandatory.

### Critical Version Rules
- **No Runtime-Specific Globals**: Wrap all Deno/Node specific logic in abstractions. Use feature detection.
- **Strict ESM**: No CommonJS allowed. All imports must include file extensions where required by Deno resolution.
- **Semantic UI**: Use Shadcn/UI primitives but verify ARIA roles for every custom implementation.

---

## Critical Implementation Rules

### Language-Specific Rules
- **Strict TypeScript**: `noImplicitAny`, `strictNullChecks`, and `noUnusedLocals` must be enabled and followed.
- **Tagged Error Pattern**: All service-level errors must extend `MobiRidesBaseError` with a unique `code` (e.g., `AUTH_INVALID_CREDENTIALS`).
- **Zod Boundaries**: Every external API response (including Supabase) must be validated with Zod before entering application state.
- **Async Discipline**: Use `Promise.allSettled()` for parallel operations to avoid unhandled rejections across Runtimes.

### Framework-Specific Rules
- **Thin Components**: Components handle presentation only; extract all complex logic into **Custom Hooks**.
- **Supabase Integration**: Import client ONLY from `src/integrations/supabase/client.ts`. Use generated `Database` types.
- **RLS Awareness**: Every query must consider the active user session. Frontend never uses `service_role` keys.
- **RBAC Visibility**: Hide UI elements (buttons, links) that the current user's role cannot access.
- **Admin MFA**: Users with the `admin` role must have MFA enabled for dashboard access.

### Testing Rules
- **State-Machine Mocking**: For sequential workflows (Handover/Booking), mock every intermediate state transition to ensure path-completeness.
- **Error Branch Coverage**: Every `catch` block in a service must have a corresponding test case in `__tests__`.
- **Factory Pattern**: Use test factories in `src/__tests__/factories` for consistent mock data.
- **RTL Role-Based Queries**: Use `getByRole` for testing to ensure screen-reader accessibility.

### Code Quality & Style Rules
- **PascalCase Components**: Both file names and React components must use `PascalCase` (e.g., `CarGrid.tsx`).
- **One Component Per File**: Export a single primary component per file to maintain focus.
- **Domain-Driven Naming**: Use names that reflect the PRD Epics (e.g., `OmangVerification.tsx` instead of `IdCheck.tsx`).
- **Feature Namespacing**: Organize components in feature-specific folders (e.g., `src/components/wallet/`).

### Development Workflow Rules
- **Conventional Commits**: `type(scope): description #MOB-ID` (e.g., `feat(booking): add extension limit #MOB-206`).
- **Atomic Commits**: Each commit must represent a single logical change.
- **Branch Naming**: Use `feat/` or `fix/` prefixes with ticket IDs (e.g., `fix/mob-214-notifications`).

### Critical Don't-Miss Rules
- **Data Privacy**: Mask sensitive user data (Omang IDs, addresses) in logs and UI unless required for verified handover.
- **High Contrast**: Maintain a minimum 4.5:1 ratio (7:1 preferred) for sunlight readability in Botswana.
- **Safe Area Insets**: Use Tailwind's `safe-area-*` classes to avoid overlaps with status bars/notches.
- **Focus Management**: Explicitly manage focus transitions between sequential steps in the handover to ensure screen reader continuity.

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new implementation patterns emerge.

**For Humans:**
- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review quarterly for outdated rules.

Last Updated: 2026-04-06T18:44:00Z
