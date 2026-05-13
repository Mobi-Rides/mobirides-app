# Test Coverage Report - May 13, 2026

## Scope

Coverage target: current `test-coverage-46-to-80` checkout based on latest `origin/develop`.

This run continued the May 12 coverage work. The May 12 full run reported 7 failing suites and 10.13% line coverage. Today, those previously failing suites were rerun and passed before the full coverage run.

## Change Applied

Renamed the insurance integration test file to avoid a `ts-jest` transform collision:

```text
__tests__/insuranceClaims.test.tsx -> __tests__/insuranceClaimsFlow.test.tsx
```

Reason: the repo also has `__tests__/insuranceClaims.test.ts`. During full coverage runs, the duplicate basename caused `ts-jest` to fail processing the `.tsx` suite even though the suite passed when run by itself.

Added one focused website feature coverage suite:

```text
__tests__/websiteFeatureCoverage.test.tsx
```

The suite covers optimized feature data loading, filtering, sorting, pagination, lazy loading, cache hits, failures, virtualization, super admin analytics loading/export/realtime refresh, and verification provider flow actions.

Expanded this suite again after the initial 82.15% focused result. The added tests cover user-facing failure states, cache expiry, memoized data reuse, debounced oversized responses, cleanup behavior, analytics refresh/export failures, chart distribution data, and verification navigation/progress edge cases.

Added one broader page/UI/map coverage suite:

```text
__tests__/pageUiMapCoverage.test.tsx
```

The suite covers Login, Dashboard, SuperAdminAnalytics, Map, HandoverBookingButtons, MapContainer, Sidebar, Carousel, and Chart UI behavior using jsdom-safe mocks. The Mapbox Jest mock was expanded so map-facing components can import expected Mapbox helpers without loading Mapbox GL.

Fixed a bug found while testing the analytics feature:

```text
src/hooks/useSuperAdminAnalytics.ts
```

The hook exposed chart helpers for time-series and event-type distribution data, but it never loaded analytics rows into state. In production this could leave analytics chart data empty even after the page loaded. The fix fetches `analyticsService.getAnalytics(filters)`, stores the returned analytics rows, and returns `getUserGrowthData` from the hook API.

## Command

```bash
npm test -- --coverage --runInBand --collectCoverageFrom='src/**/*.{ts,tsx}' --collectCoverageFrom='!src/**/*.d.ts' --collectCoverageFrom='!src/__mocks__/**'
```

## Coverage Summary

### Focused Feature Scope

Command:

```bash
npm test -- __tests__/websiteFeatureCoverage.test.tsx --coverage --runInBand --collectCoverageFrom='src/hooks/usePerformanceOptimization.ts' --collectCoverageFrom='src/hooks/useSuperAdminAnalytics.ts' --collectCoverageFrom='src/contexts/VerificationContext.tsx'
```

| Metric | Coverage |
|--------|----------|
| Lines | 100.00% |
| Statements | 99.49% |
| Functions | 100.00% |
| Branches | 87.81% |

Primary focused feature coverage percentage: **100.00% line coverage**.

### Full Source Scope

| Metric | Coverage | Covered / Total |
|--------|----------|-----------------|
| Lines | 26.40% | 5,751 / 21,783 |
| Statements | 26.49% | 6,312 / 23,830 |
| Functions | 19.59% | 1,047 / 5,345 |
| Branches | 16.85% | 3,443 / 20,428 |
| Files instrumented | 594 | - |

Primary full-codebase coverage percentage: **26.40% line coverage**.

## Test Result

The Jest run passed.

```text
Test Suites: 96 passed, 96 total
Tests:       758 passed, 758 total
Snapshots:   0 total
Time:        66.887 s
```

## Notes

Coverage collection still reports TypeScript diagnostics for some instrumented source files, mostly around `import.meta.env`, generated Supabase type mismatches, and test transform module resolution warnings. These diagnostics no longer fail the Jest run, but they still make the coverage baseline noisy.

## Artifacts

Generated locally:

- `coverage/coverage-final.json`
- `coverage/lcov.info`
- `coverage/lcov-report/index.html`
