# 🧪 Test Coverage 90% Optimization & Remediation Plan
## MobiRides Frontend & Backend Sweeps — May 27, 2026

**Prepared by:** Antigravity AI  
**Author:** Modisa Maphanyane (CEO / AI-Assisted)  
**Target Goal:** Elevate Statement Coverage from **64.90% to 90.00%+**  
**Sprint Alignment:** Sprint 15 (May 16–29) & Sprint 16 (June 1–14)  
**Codebase Base Path:** `c:\Users\Administrator\.cursor\Mobi Rides v1`  

---

## 📊 1. Current State vs. Ideal State Summary

| Metric | Current State | Ideal Target | Gap/Statements Needed | Severity |
|--------|:-------------:|:------------:|:---------------------:|:--------:|
| **Statement Coverage** | **64.90%** (5613 / 8649) | **90.00%** (7784 / 8649) | **+2,171 statements** | 🔴 High |
| **Branch Coverage** | **50.35%** (3109 / 6175) | **75.00%** (4631 / 6175) | **+1,522 branches** | 🔴 High |
| **Function Coverage** | **62.74%** (938 / 1495) | **90.00%** (1345 / 1495) | **+407 functions** | 🟡 Medium |

### Summary of Coverage Loss:
1. **The Crashing Test Suites (9 suites):** Jest OOMs on massive TS compiles, and syntax errors on `import.meta.env` references silently crashed 9 testing suites (including map navigation and interactive handover). This excluded **~400 statements** of written tests from being successfully compiled and aggregated.
2. **Untested Core Hooks/Services:** Core services like optimized chat, verification loops, and daily insurance premium splits are completely untested.
3. **Untested UI Dialogs:** Key frontend pages (Login/Signup, Map view, Car Image Manager) have near-zero test coverage.

---

## 🏛️ 2. Jira-Style Task Breakdown

### Phase 1: Environment Resolution & Configuration Fixes (P0)
*Focus: Fix compiler worker crashes to immediately reclaim ~400 statements of existing coverage.*

#### **MOB-207**: Jest TS Compiler isolatedModules & Worker Memory Throttling
* **Priority:** Urgent (P0)  
* **Assignee:** Tapologo  
* **Estimated Points:** 3 pts  
* **Description:** Update `jest.config.js` to enable `isolatedModules: true` in `ts-jest` transformer block. This disables concurrent TS type-checking during test runs (relying on tsc/build sweeps instead) to prevent compiler memory OOM crashes. Configure Jest to run in single-process mode in CI/CD environments.
* **Acceptance Criteria:**
  - [ ] Inject `isolatedModules: true` into the `ts-jest` transform configuration block inside `jest.config.js`.
  - [ ] Add Jest memory allocation parameters (`--max-workers=50%` or `--runInBand` flags) to package.json scripts.
  - [ ] Verify that test suites `availabilityServiceCoverage`, `handoverOperations`, and `navigationLib` compile and execute successfully without throwing Heap Allocation exceptions.

#### **MOB-208**: Mock `import.meta` & Vite Environment Variables in Jest Config
* **Priority:** Urgent (P0)  
* **Assignee:** Tapologo  
* **Estimated Points:** 3 pts  
* **Description:** Create mock configuration proxies to intercept `import.meta.env` statements inside Jest. This prevents ESNext parser syntax errors (`SyntaxError: Cannot use 'import.meta' outside a module`) in jsdom environments.
* **Acceptance Criteria:**
  - [ ] Add global object definitions for `global.import = { meta: { env: { ... } } }` inside `src/__mocks__/jest.setup.ts`.
  - [ ] Verify `UnifiedUserTable.test.tsx` and all dependent profile table components parse successfully and execute without JSDom compile failures.

---

### Phase 2: High-Yield Service Mocks & Sweeps (P1)
*Focus: Write targeted unit tests for our three largest uncovered logic services (yielding +420 statements).*

#### **MOB-209**: Write Unit Tests for `useOptimizedConversations.ts`
* **Priority:** High (P1)  
* **Assignee:** Tapologo  
* **Estimated Points:** 5 pts  
* **Description:** Write a comprehensive test suite for the custom hook `useOptimizedConversations.ts` (currently at 39.57% coverage). Mock the Supabase realtime channel hooks, message payloads, and active conversation state loops.
* **Acceptance Criteria:**
  - [ ] Create `useOptimizedConversations.test.ts` in `src/hooks/__tests__/`.
  - [ ] Mock `supabase.channel` and message insertion webhooks.
  - [ ] Verify hook returns correct active message records and handles realtime stream drops.
  - [ ] Raise file coverage above **80.00%**.

#### **MOB-210**: Write Unit Tests for `verificationService.ts`
* **Priority:** High (P1)  
* **Assignee:** Tapologo  
* **Estimated Points:** 5 pts  
* **Description:** Write Jest tests for `verificationService.ts` (currently at 26.24% coverage), mocking the Supabase KYC profiles, RLS policies, and OCR Vision API calls.
* **Acceptance Criteria:**
  - [ ] Mock external OCR Vision API return payloads (Google Cloud / AWS).
  - [ ] Verify successful verification status updates and document parsing.
  - [ ] Raise file coverage above **85.00%**.

#### **MOB-211**: Write Unit Tests for `insuranceService.ts`
* **Priority:** High (P1)  
* **Assignee:** Tapologo  
* **Estimated Points:** 3 pts  
* **Description:** Write Jest tests for `insuranceService.ts` (currently at 34.50% coverage). Verify that standard daily rate calculations, premium remittance batches, and platform excess decimal transformations execute without rounding issues.
* **Acceptance Criteria:**
  - [ ] Verify `excess_percentage` scales ($\times 100$ and $/ 100$) on load and save.
  - [ ] Test four-tier daily package calculations under different user locations.
  - [ ] Raise file coverage above **85.00%**.

---

### Phase 3: Client UI Page & Dialog Sweeps (P2)
*Focus: Write targeted component tests for the entry point pages (yielding +290 statements).*

#### **MOB-212**: Write Component Tests for `CarImageManager.tsx`
* **Priority:** Medium (P2)  
* **Assignee:** Tapologo  
* **Estimated Points:** 5 pts  
* **Description:** Test the React UI component for car listings image uploads, mocking upload progress states, file drops, and delete actions.
* **Acceptance Criteria:**
  - [ ] Mock the dropzone trigger events inside JSDom.
  - [ ] Verify correct rendering of progress bars and deletion icons.
  - [ ] Raise file coverage above **80.00%**.

#### **MOB-213**: Write Component Tests for Map Page (`Map.tsx`)
* **Priority:** Medium (P2)  
* **Assignee:** Tapologo  
* **Estimated Points:** 5 pts  
* **Description:** Mock the Mapbox layout render flows and location hooks inside `Map.tsx` (currently at 46.29% coverage) to verify button clicks, search lookups, and bottom-drawer expansions.
* **Acceptance Criteria:**
  - [ ] Verify Mapbox rendering stubs inside JSDom.
  - [ ] Test search suggestions list selections and location coordinate pins.
  - [ ] Raise file coverage above **80.00%**.

#### **MOB-214**: Write Component Tests for Login/Signup (`Login.tsx`)
* **Priority:** Medium (P2)  
* **Assignee:** Tapologo  
* **Estimated Points:** 5 pts  
* **Description:** Test the Auth Login form submission flows, input verification validations, password visibility toggles, and MFA code prompts.
* **Acceptance Criteria:**
  - [ ] Test form submission behaviors under invalid email/password inputs.
  - [ ] Verify that correct trigger events are dispatched to `authService`.
  - [ ] Raise file coverage above **85.00%**.

---

### Phase 4: Operational CI/CD Guardrails & Cleanups (P2)
*Focus: Enforce strict verification rules to block coverage regression.*

#### **MOB-215**: Configure Github Action Coverage Verification Gates
* **Priority:** Medium (P2)  
* **Assignee:** Tapologo  
* **Estimated Points:** 3 pts  
* **Description:** Configure automated verification gates inside the repository pull request workflow. Automatically reject any pull request that drops overall statement coverage or contains less than **90% coverage on newly written code lines**.
* **Acceptance Criteria:**
  - [ ] Create/update the CI/CD test configuration inside `.github/workflows/test.yml`.
  - [ ] Enforce `--coverage` parsing using coverage reporters (e.g. Codecov or Jest summary parsing).
  - [ ] Set strict gate thresholds preventing merges when overall statements drop below the target benchmark.

---

## 🏁 3. Verification Plan

### Automated Tests
- Run `npm test -- --coverage` locally to aggregate coverage numbers.
- Verify that Jest runs cleanly with 0 OOM heap exceptions or Vite syntax crashes.
- Monitor Github Actions pipeline executions on active Pull Requests.

### Manual Verification
- Review generated HTML reports in `coverage/lcov-report/index.html` to confirm statement coverage exceeds the 90% benchmark across all folders.
