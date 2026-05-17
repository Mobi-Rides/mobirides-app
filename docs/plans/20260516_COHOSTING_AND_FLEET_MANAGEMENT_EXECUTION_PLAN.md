# Sprint 14 Execution Plan: Co-hosting & Fleet Management (MOB-160)
## MobiRides Application — May 16, 2026

**Prepared by:** Antigravity (AI Assistant)  
**Status:** 🟡 DRAFT (Awaiting Approval)  
**Epic:** Fleet Scalability & Operational Efficiency

---

## 📊 Overview
To support larger fleet operators and commercial partners, MobiRides requires a "Co-hosting" feature. This allows a primary vehicle owner (Main Host) to authorize secondary users (Co-hosts) to manage their fleet operations. Co-hosts will have delegated authority to approve bookings, communicate with renters, and perform handover inspections.

## 🎯 Objectives
1.  **Delegated Authority**: Allow hosts to invite others to manage their vehicles and bookings.
2.  **Fine-Grained Permissions**: Control exactly what co-hosts can do (e.g., Approve only, Handover only).
3.  **Unified Operations**: Co-hosts can see delegated tasks in their existing Host Dashboard.
4.  **Auditability**: Track which user (Main Host or Co-host) performed specific actions.

---

## 📋 Backlog Items

### Category 1: Infrastructure & Permissions (P0)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-161** | 🟡 TO DO | Create `host_team_members` table and implement Invitation state machine. |
| **MOB-162** | 🟡 TO DO | Update RLS Policies on `cars`, `bookings`, and `vehicle_condition_reports` for team access. |
| **MOB-163** | 🟡 TO DO | Implement `getAuthorizedFleets` logic to scope dashboard queries. |

### Category 2: Invitation & Team Management (P1)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-164** | 🟡 TO DO | Build "Team Management" Settings UI (Invite by Email, Role Assignment). |
| **MOB-165** | 🟡 TO DO | Develop Invitation acceptance flow with deep-linking/notifications. |
| **MOB-166** | 🟡 TO DO | Implement Permission Toggle logic (JSONB updates in DB). |

### Category 3: Dashboard & Operational UI (P1)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-167** | 🟡 TO DO | Refactor `useHostCars` and `useHostBookings` hooks to include delegated items. |
| **MOB-168** | 🟡 TO DO | Add "Managed by [Team]" badges to dashboard items for clarity. |
| **MOB-169** | 🟡 TO DO | Update Chat/Messaging to allow co-hosts to participate in booking threads. |

### Category 4: Notifications & Alerts (P2)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-170** | 🟡 TO DO | Implement Multi-target notification triggers for team-wide alerts. |
| **MOB-171** | 🟡 TO DO | Add "Action Performed By" metadata to audit logs and activity feeds. |

---

## 🏗️ Technical Architecture

### Data Model: `host_team_members`
```sql
CREATE TABLE public.host_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('manager', 'operator', 'viewer')),
    permissions JSONB DEFAULT '{"can_approve": true, "can_handover": true, "can_edit_vehicle": false}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, member_id)
);
```

### RLS Strategy
Policies will be refactored to use a security definer function `is_fleet_authorized(host_id)` which checks both direct ownership and team membership, ensuring high performance across the dashboard.

---

## 🚦 Verification Plan

### Automated Tests
- [ ] Logic tests for permission checking (e.g., can a 'viewer' role approve a booking?).
- [ ] RLS validation tests to ensure co-hosts cannot see cars from unauthorized hosts.

### Manual Verification
- [ ] **Invite Flow**: Main Host invites a user; User receives notification and accepts.
- [ ] **Operation Flow**: Co-host approves a booking and completes a handover; Main Host sees the update.
- [ ] **Security Check**: Co-host attempts to delete a vehicle (should be blocked by default permissions).

---

## 🏁 Final Goal
Enable professional fleet operators to scale their business on MobiRides by distributing operational workload safely.
