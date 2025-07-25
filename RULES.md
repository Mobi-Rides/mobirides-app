# Collaboration & Editing Rules

## 1. File Scope
- Only edit files explicitly specified by the user.
- Do not create, modify, or delete any other files unless given clear permission.

## 2. UI/Frontend Focus
- Only work on UI and frontend code (React components, styles, etc.) unless instructed otherwise.

## 3. Edit Approval Process
- Before making any edit, inform the user:
  - What will be changed
  - Why the change is needed
  - The expected result
- Wait for explicit user approval before proceeding with any code change.

## 4. Seamless Integration
- Ensure every change works seamlessly with the existing codebase.

## 5. Codebase Standards
- Follow the coding style, patterns, and best practices already present in the codebase.

---

**No code changes will be made without following these rules.** 

---

# Code Standards & Development Guidelines

## TypeScript Best Practices
- Avoid `any`. Use specific types or `unknown` with type-checking.
- Use `interface` for object/class shapes (especially for component props).
- Use `type` for unions, intersections, or complex types.
- Use Supabase auto-generated types for all database interactions.

## Component & File Organization
- `src/pages`: Top-level route components.
- `src/components`: Reusable UI components, grouped by feature or purpose.
- `src/services`: Business logic and Supabase interactions.
- `src/hooks`: Custom React hooks.
- `src/lib`/`src/utils`: Utility functions and configuration.

## Naming Conventions
- **Components/Pages:** PascalCase (e.g., `CarCard.tsx`, `ProfilePage.tsx`)
- **Hooks:** useCamelCase (e.g., `useAuth.ts`)
- **Services/Utils:** camelCase (e.g., `bookingService.ts`)
- **Types/Interfaces:** PascalCase (e.g., `interface Booking {}`, `type UserRole = ...`)
- **Variables/Functions:** camelCase

## Testing Strategy
- **Unit tests:** For pure functions and business logic, colocated as `*.test.ts`.
- **Integration tests:** For user flows, colocated as `*.test.tsx` with the main component.

## Git Workflow
- **Branching:**
  - Feature branches from `development`, merged back into `development`.
  - `development` → `staging` for QA, then `staging` → `main` for production.
  - Branch naming: `<type>/<ticket-id>-<short-description>`
- **Commits:**
  - Use Conventional Commits (e.g., `feat(booking): add real-time availability check`).

## Deployment & Environment
- Use Vite for builds.
- Use `.env` files for environment-specific config.
- Use Supabase for backend, with strict RLS.
- Use Mapbox for mapping.
- Use Sentry for error/performance monitoring (to be set up).

---

All code changes must adhere to these standards and guidelines in addition to the collaboration and editing rules above. 