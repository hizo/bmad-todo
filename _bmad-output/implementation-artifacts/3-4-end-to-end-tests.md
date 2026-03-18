# Story 3.4: E2E Test Suite Finalization & CI Integration

Status: done

## Story

As a developer,
I want to verify all E2E tests (written per-story) run together and integrate with CI,
so that the full test suite is reliable and automated.

## Acceptance Criteria

1. **AC1 — Unified E2E execution:** Running `pnpm test:e2e` (which calls `playwright test --config e2e/playwright.config.ts`) executes all E2E test suites together against the running application and all pass.

2. **AC2 — Full user journey coverage:** All core user journeys are covered by E2E tests: create, view, toggle, delete, empty state, loading state, error state + retry, and persistence across refresh.

3. **AC3 — Coverage gap fill:** Any missing E2E scenarios identified during review are written as new tests.

4. **AC4 — Single-command full test suite:** A single command runs all tests — backend (unit + integration), frontend (unit), and E2E — and all pass. (NFR23)

5. **AC5 — CI via GitHub Actions:** A GitHub Actions workflow runs all tests automatically on push/PR with proper reporting, artifact capture (Playwright HTML report), and status checks.

## Tasks / Subtasks

- [x] Task 1: Audit existing E2E test coverage (AC: #2, #3)
  - [x] 1.1 Review `e2e/tests/todo-crud.spec.ts` against the complete list of user journeys
  - [x] 1.2 Create a coverage gap checklist: create, view, toggle, delete, empty state, loading state, error state + retry, persistence across refresh
  - [x] 1.3 Identify missing or incomplete scenarios

- [x] Task 2: Write missing E2E tests to fill gaps (AC: #3)
  - [x] 2.1 Add any missing test scenarios to `e2e/tests/todo-crud.spec.ts`
  - [x] 2.2 Ensure all new tests follow existing patterns: `resetDb` in `beforeEach`, fixture-based `makeAxeBuilder`, role-based selectors
  - [x] 2.3 Verify all tests pass locally with `pnpm test:e2e`

- [x] Task 3: Verify unified E2E execution (AC: #1)
  - [x] 3.1 Run `pnpm test:e2e` and confirm all test suites execute together
  - [x] 3.2 Fix any flaky or failing tests
  - [x] 3.3 Verify total test count matches expectations

- [x] Task 4: Verify single-command full test suite (AC: #4)
  - [x] 4.1 Run `pnpm test` (backend unit + integration, frontend unit) and confirm all pass
  - [x] 4.2 Run `pnpm test:e2e` and confirm all E2E tests pass
  - [x] 4.3 Document the two commands needed for full coverage (root `pnpm test` + `pnpm test:e2e`)

- ~~Task 5: Create GitHub Actions CI workflow (AC: #5)~~ — **Skipped per user: no CI pipeline for this project**

- ~~Task 6: Validate CI workflow locally (AC: #5)~~ — **Skipped per user: no CI pipeline for this project**

## Dev Notes

### Existing E2E Test Coverage (in `e2e/tests/todo-crud.spec.ts`)

The current test file already has extensive coverage from stories 1.1–3.3:

| Describe Block | Tests | Journeys Covered |
|---|---|---|
| Todo CRUD | 5 tests | Create via Enter, persistence, empty input guard, a11y (empty + with todo) |
| Toggle Todo Completion | 8 tests | Toggle complete/incomplete, persistence, visual styling, aria-live, a11y |
| Empty State | 5 tests | Empty display, autofocus, transition to list, reappear after delete, a11y |
| Loading State | 3 tests | ARIA attributes + skeleton, a11y, no layout shift (CLS) |
| Error State & Retry | 5 tests | Full-screen error, retry button, inline create error, toggle rollback, a11y |
| Delete Todo | 5 tests | Delete removes item, persistence, leaves others intact, aria-live, a11y |

**Total: 31 tests across 6 describe blocks**

### Potential Coverage Gaps to Investigate

- Delete rollback on API failure (tested for toggle but not delete)
- Multiple todos ordering (created_at DESC/ASC verification)
- Long text input handling
- Rapid consecutive operations (create multiple todos quickly)
- Cross-journey flow: create → toggle → delete in one session

### Test Infrastructure (DO NOT recreate — extend existing)

- **Config:** `e2e/playwright.config.ts` — Chromium only, single worker, HTML reporter, Docker Compose webServer
- **Fixtures:** `e2e/fixtures.ts` — custom `makeAxeBuilder` and `resetDb` fixtures, `expectNoA11yViolations` helper
- **A11y:** `@axe-core/playwright` with `wcag2a` + `wcag2aa` tags
- **DB Reset:** `DELETE /test/reset` endpoint at `http://localhost:3000`

### GitHub Actions CI Architecture

**Two separate jobs** (they have different service requirements):

1. **`test-unit-integration`** — needs PostgreSQL service container, no Docker Compose
   - Uses `services: postgres:16`
   - Runs migrations via backend scripts
   - Runs `pnpm test` (backend unit/integration + frontend unit via Vitest)

2. **`test-e2e`** — needs Docker Compose (full app stack)
   - Uses `docker-compose up -d` to start postgres + backend + frontend
   - Waits for `http://localhost:5173` to be ready
   - Installs Playwright browsers: `npx playwright install --with-deps chromium`
   - Runs `pnpm test:e2e`
   - Uploads `playwright-report/` as artifact on failure

### Key Environment Variables

From `.env.example` / `.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — Backend port (default 3000)
- `CORS_ORIGIN` — Frontend origin (default http://localhost:5173)

### Project Structure Notes

- E2E tests live at monorepo root: `e2e/` (NOT inside apps/frontend)
- Playwright config references Docker Compose: `cd .. && docker-compose up`
- All new tests go in `e2e/tests/todo-crud.spec.ts` (single spec file pattern)
- CI workflow goes in `.github/workflows/ci.yml`

### Architecture Compliance

- **Testing framework:** Playwright for E2E (per architecture doc)
- **CI platform:** GitHub Actions (per epics acceptance criteria)
- **Test runner commands:** `pnpm test` for unit/integration, `pnpm test:e2e` for E2E
- **Naming:** kebab-case files, existing patterns must be followed
- **No new dependencies required** — Playwright and axe-core already installed

### Previous Story Intelligence

From stories 3.1–3.3:
- All stories added E2E tests incrementally to the same `todo-crud.spec.ts` file
- Pattern: each `test.describe` block has its own `beforeEach` with `resetDb` + `page.goto("/")`
- Network interception via `page.route()` used for loading and error state tests
- Role-based selectors preferred: `getByRole("button")`, `getByRole("textbox")`, `getByRole("checkbox")`
- A11y tests run `expectNoA11yViolations(makeAxeBuilder)` after page reaches stable state
- Lighthouse audit + performance trace run via Chrome DevTools MCP (manual, not in Playwright)
- Previous completion metrics: Lighthouse a11y 100, LCP ~146-430ms, CLS 0.00

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Standards]
- [Source: e2e/playwright.config.ts]
- [Source: e2e/fixtures.ts]
- [Source: e2e/tests/todo-crud.spec.ts]
- [Source: package.json#scripts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — all tasks completed without issues.

### Completion Notes List

- **Task 1:** Audited 31 existing E2E tests across 6 describe blocks. Identified 3 coverage gaps: delete rollback on API failure, cross-journey flow, and multiple todos ordering.
- **Task 2:** Added 5 new tests: delete rollback on API failure, full lifecycle (create → toggle → delete), multiple todos display order, multiple todos persist across refresh. New "Cross-Journey Flows" describe block added. All 36 tests pass.
- **Task 3:** Confirmed `pnpm test:e2e` runs all 36 tests together (1 worker, sequential). No flaky tests.
- **Task 4:** `pnpm test` runs 28 backend + 38 frontend = 66 unit/integration tests. `pnpm test:e2e` runs 36 E2E tests. Total: 102 tests, all passing.
- **Task 5 & 6:** Skipped — user confirmed no CI pipeline for this project.

### File List

- `e2e/tests/todo-crud.spec.ts` (modified — added 5 new E2E tests)
- `_bmad-output/implementation-artifacts/3-4-end-to-end-tests.md` (modified — task tracking)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status update)

## Change Log

- 2026-03-18: Completed Story 3.4 — Audited E2E coverage, filled 3 gaps (5 new tests), verified full test suite (102 tests passing). CI tasks skipped per user decision.
