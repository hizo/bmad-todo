# AI Integration Documentation

**Project:** BMad Todo
**Date:** 2026-03-18
**Scope:** Full project lifecycle — planning through QA (Epics 1–3, 10 stories)

---

## 1. Agent Usage

### Tasks Completed with AI Assistance

The entire BMad Todo project was built with AI agent assistance (Claude Code) using the BMad workflow. The agent operated across every phase of the SDLC: planning artifact generation, story creation, implementation, testing, code review, and QA reporting. A human directed the workflow, made design decisions, reviewed output, and corrected course.

**Epic 1 — Create and View Todos (Stories 1.1–1.3):**

| Story | AI-Driven Tasks |
|-------|-----------------|
| 1.1 — Project Scaffolding | Monorepo setup (pnpm workspaces), Docker Compose config, Fastify server boilerplate, PostgreSQL migration, shared types package, Swagger/OpenAPI wiring |
| 1.2 — Backend API (POST/GET) | Query functions with parameterized SQL, route handlers with JSON Schema validation, integration tests against real Postgres, unit tests for query layer |
| 1.3 — Frontend Create & Display | API client (`fetch`), TanStack Query hooks (`useSuspenseQuery`), AddTodoForm + TodoItem + TodoList components, unit tests, E2E tests with a11y audits |

**Epic 2 — Complete Task Lifecycle (Stories 2.1–2.2):**

| Story | AI-Driven Tasks |
|-------|-----------------|
| 2.1 — Toggle Completion | PATCH endpoint + schema, `updateTodo` query, Checkbox component with ARIA, toggle animation, aria-live announcements, backend integration tests, frontend unit tests, E2E tests, Lighthouse audit, Postman spec/collection sync |
| 2.2 — Delete Todo | DELETE endpoint + schema, `deleteTodo` query, delete button with accessible label, backend integration tests, frontend unit tests, E2E tests, a11y audit, Postman sync |

**Epic 3 — Polished Experience & Error Resilience (Stories 3.1–3.4):**

| Story | AI-Driven Tasks |
|-------|-----------------|
| 3.1 — Empty State | EmptyState component, unit tests, E2E tests, a11y audit, Lighthouse audit |
| 3.2 — Loading State | Skeleton UI with CLS prevention, ARIA attributes, unit + E2E tests, performance trace |
| 3.3 — Error State & Retry | ErrorBoundary wiring, optimistic mutation rollback (create/toggle/delete), inline error UI, unit + E2E tests |
| 3.4 — E2E Test Finalization | Coverage gap audit, 5 new cross-journey E2E tests, full suite verification |

**Cross-cutting QA tasks (AI-driven):**
- Security audit (OWASP top 10 review, 12 categories)
- QA report generation (coverage, accessibility, security summary)
- Code coverage configuration (vitest v8, c8, threshold enforcement)
- Postman API spec synchronization after each backend change

### Prompts That Worked Best

**Story-driven prompts with the BMad dev-story skill** were the most effective pattern throughout the project. Each story file contained acceptance criteria, task breakdowns, and dev notes accumulated from previous stories — giving the agent full context without lengthy prompting.

**Effective prompt patterns:**
- `/bmad-dev-story` with a story file path — the agent followed the spec precisely, checked off tasks, and ran verification steps
- `/bmad-code-review` after implementation — caught issues like missing shadcn Button usage, incorrect color values, and missing ARIA attributes across multiple stories
- `/bmad-create-story` — generated context-rich story files incorporating learnings from completed stories
- Targeted audit requests: "Review code for common security issues" produced a structured 12-category report; "Configure code coverage reporting and edit the report afterwards" installed deps, configured tools, ran tests, and updated docs
- BMad planning skills (`/bmad-analyst`, `/bmad-architect`, `/bmad-create-epics-and-stories`, `/bmad-check-implementation-readiness`) — generated PRD, architecture doc, UX spec, epics/stories, and readiness assessment before any code was written

**What made prompts effective:**
- Referencing specific files or story specs rather than describing requirements from scratch
- Asking for audits after implementation (not during) to get a fresh-context review
- Combining implementation + verification in one request ("do X, then run tests and fix failures")
- Accumulating learnings: each story spec included a "Previous Story Learnings" section so the agent didn't repeat mistakes

**Less effective patterns:**
- Vague requests like "make it better" — the agent needed specific acceptance criteria or constraints to produce focused changes
- Asking for changes across too many files simultaneously without a story spec — increased risk of inconsistencies

---

## 2. MCP Server Usage

Two MCP servers were configured in `.mcp.json` and used throughout the project:

### Chrome DevTools MCP (`chrome-devtools-mcp`)

**Configuration:** `npx -y chrome-devtools-mcp@latest --headless`

**How it helped:**
- **Lighthouse audits** after each story: verified a11y score (consistently 100), best practices (100), SEO (100), and performance metrics
- **Performance traces:** Measured LCP (146–430ms, well under 2.5s NFR target) and CLS (0.00) to confirm no layout shift regressions
- **Visual verification:** Screenshots confirmed component layouts, skeleton loading states, and error states rendered correctly
- **Regression checks:** After each story, performance was re-measured to catch regressions from new code

**Specific high-value moments:**
- Story 3.2 (Loading State): The CLS measurement was critical — the skeleton UI needed to exactly match real TodoItem dimensions (`min-h-[48px]`, `gap-3`, `px-3 py-3`) to prevent layout shift. The performance trace confirmed CLS stayed at 0.00.
- Story 1.3 (Frontend): First baseline measurement established LCP at ~125ms and CLS at 0.00, setting the bar for all subsequent stories.

### Postman MCP (`postman`)

**Configuration:** HTTP MCP to `https://mcp.postman.com/mcp` with bearer token auth

**How it helped:**
- **API spec sync:** After each backend API change (Stories 1.2, 2.1, 2.2), the agent pushed updated OpenAPI YAML to the Postman spec via `updateSpecFile`
- **Collection generation:** After spec updates, `syncCollectionWithSpec` regenerated the Postman collection to match the current API contract
- **Single source of truth:** Kept Swagger (`/docs`), Postman spec, and Postman collection in sync automatically across all stories that touched the backend

**Stories that used Postman sync:** 1.2 (POST/GET endpoints), 2.1 (PATCH endpoint), 2.2 (DELETE endpoint)

**Lesson learned:** During Story 2.1, the agent only updated the spec but forgot to sync the collection, leaving the Postman collection out of date. A feedback memory was saved: "When backend API changes, run BOTH `updateSpecFile` AND `syncCollectionWithSpec`." This prevented the issue from recurring in Stories 2.2 and beyond.

---

## 3. Test Generation

### How AI Assisted in Generating Test Cases

The agent generated the entire test suite across all three layers:

**Final test counts:**
- Frontend unit tests: 54 (across 9 test files)
- Backend unit + integration tests: 28 (across 2 test files)
- E2E tests: 36+ (1 spec file, 7 describe blocks)
- **Total: 118+ tests, all passing**

**By epic:**

**Epic 1 — Foundation tests (AI-generated):**
- `queries.test.ts` — parameterized query verification, snake_case→camelCase mapping, error handling
- `todo-routes.integration.test.ts` — POST/GET endpoints against real Postgres via Fastify `inject()`
- `add-todo-form.test.tsx` — submit behavior, input clearing, empty rejection, trim handling
- `todo-item.test.tsx` — rendering, checkbox, strikethrough styling, delete button, keyboard navigation
- `todo-list.test.tsx` — list rendering, empty state, ordering, prop forwarding
- `todo-crud.spec.ts` (E2E) — initial create and view tests with a11y scans

**Epic 2 — Interaction tests (AI-generated):**
- Added PATCH/DELETE integration tests to existing backend test file
- Added toggle + delete E2E tests with persistence verification and aria-live checks
- Per-story a11y audits via axe-core in Playwright fixtures

**Epic 3 — Polish + coverage tests (AI-generated):**
- `empty-state.test.tsx`, `loading-state.test.tsx`, `error-state.test.tsx` — component-level tests
- `use-todos.test.tsx` — optimistic rollback testing for all three mutations
- `App.test.tsx` — full App rendering, CRUD interactions, live announcements, error display
- `api/todos.test.ts` — all 4 fetch functions with success + error paths
- 5 cross-journey E2E tests filling coverage gaps

**Patterns the AI followed well:**
- **Role-based selectors** (`getByRole`) instead of test IDs — this enforced accessible markup as a side effect of testing
- **`userEvent` over `fireEvent`** — realistic user interaction simulation throughout
- **Axe-core scans on every major state** — automated WCAG AA compliance was baked into E2E from Story 1.3 onward
- **Real database for backend tests** — integration tests used Fastify `inject()` against real Postgres, not mocks (a deliberate architectural choice from the start)
- **Optimistic update rollback testing** — verified cache state before and after failure using TanStack Query internals
- **Network interception in E2E** (`page.route()`) — simulated loading delays and API failures for error/loading state testing

### What AI-Generated Tests Missed

**Initially missed, caught in review or iteration:**
- **Coverage of `App.tsx` and `api/todos.ts`:** Through Epic 3, the hook tests mocked the API module entirely, leaving the root component and fetch client at 0% unit coverage. This was only caught when code coverage reporting was configured and the 62.5% overall number became visible. A second pass added dedicated test files for both, bringing coverage to 93%.
- **ErrorBoundary unit test complexity:** React's Suspense + ErrorBoundary interaction doesn't work naturally in jsdom. The initial ErrorBoundary unit test failed because `useSuspenseQuery` throws promises (for Suspense) before throwing errors (for ErrorBoundary). This path is better covered by E2E tests.
- **Fetch mock isolation:** The first API client test file used `vi.spyOn(globalThis, "fetch")` with `afterEach(() => vi.restoreAllMocks())`, which broke spy references across test suites. Required restructuring to `vi.restoreAllMocks()` in `beforeEach` with fresh spies per test.
- **React Query internal arguments:** A `createTodo` mock assertion initially used `toHaveBeenCalledWith("New todo")`, but React Query passes additional internal arguments. Fixed to `expect(mock.calls[0][0]).toBe("New todo")`.

**Structural gaps AI did not identify (required human awareness):**
- No Firefox/WebKit browser coverage in E2E (Chromium only throughout)
- No server lifecycle tests (startup, graceful shutdown, migration failure)
- No load/performance testing beyond Lighthouse snapshots
- No manual screen reader testing — automated axe-core covers ~57% of WCAG criteria; VoiceOver/NVDA testing was never performed

---

## 4. Debugging with AI

### Case 1: ESM Import Extensions (Epic 1)

**Problem:** Backend TypeScript compilation failed because relative imports lacked `.js` extensions, which are required when targeting ESM (`"type": "module"`).

**How AI helped:** After the first build failure, the agent identified the ESM requirement and retroactively added `.js` extensions to all relative imports in the backend. This learning was captured in the Story 1.2 dev notes and carried forward to all subsequent stories.

### Case 2: snake_case to camelCase Mapping (Story 1.2)

**Problem:** PostgreSQL column `created_at` needed to map to TypeScript's `createdAt` field. Initial implementation returned raw DB rows without mapping.

**How AI helped:** The agent established the mapping pattern in `db/queries.ts` at the query boundary, keeping it isolated from route handlers. A dedicated unit test (`queries.test.ts`) explicitly verified the mapping. This pattern was reused correctly in Stories 2.1 (updateTodo) and 2.2 (deleteTodo) without issues.

### Case 3: CLS Prevention in Skeleton Loading State (Story 3.2)

**Problem:** The loading skeleton needed to match the exact dimensions of real TodoItem components to prevent Cumulative Layout Shift when content loaded.

**How AI helped:** The agent read the TodoItem component source, extracted the exact CSS classes (`min-h-[48px]`, `gap-3`, `px-3 py-3`), and replicated them in the skeleton. It then ran a Chrome DevTools performance trace to measure CLS, confirming 0.00. Without the MCP-powered measurement, the visual match would have been subjective.

### Case 4: Optimistic Mutation Rollback (Story 3.3)

**Problem:** When a toggle or delete mutation failed, the UI needed to revert to the previous state without a full page reload.

**How AI helped:** The agent implemented the TanStack Query `onMutate`/`onError`/`onSettled` pattern across all three mutations (create, toggle, delete), including cache snapshot, optimistic update, rollback on error, and query invalidation on settle. It wrote rollback-specific unit tests that verified cache state before and after failure, catching a subtle issue where the optimistic todo ID (`temp-${Date.now()}`) needed cleanup on rollback.

### Case 5: Postman Sync Drift (Story 2.1)

**Problem:** After adding the PATCH endpoint, the Postman collection was out of sync with the actual API — the spec was updated but the collection wasn't regenerated.

**How AI helped:** Once the human noticed the drift, the agent corrected it by running both `updateSpecFile` and `syncCollectionWithSpec`. More importantly, it saved a feedback memory to prevent recurrence. In all subsequent stories with backend changes, the two-step sync was performed automatically.

### Case 6: Security Audit — False Positive on .env Files

**Problem:** The initial security audit flagged `.env` files as "committed with hardcoded credentials" (severity: HIGH).

**How AI helped:** A verification step checked `git ls-files .env .env.docker` and confirmed the files were NOT tracked — `.gitignore` properly excluded them. The agent corrected the finding from HIGH to PASS in the final report. This demonstrates the value of automated verification over assumption-based auditing.

### Case 7: Fetch Mock Leaking Between Test Suites

**Problem:** API client tests were failing with unexpected responses — tests were receiving mock responses meant for earlier tests.

**How AI helped:** After seeing the test failures, the agent identified that `vi.restoreAllMocks()` in `afterEach` was destroying the spy reference, causing subsequent mock calls to attach to a dead spy. The fix was restructuring mock lifecycle management. The agent iterated through the fix in one pass after analyzing the error output.

---

## 5. Limitations Encountered

### Where AI Struggled

**Complex React testing boundaries:**
React's Suspense + ErrorBoundary interaction doesn't work naturally in jsdom. The agent's attempt at an ErrorBoundary unit test failed because `useSuspenseQuery` throws promises (for Suspense) before throwing errors (for ErrorBoundary). Recognizing this as a known limitation of unit-testing Suspense boundaries required human awareness of React internals.

**Mock lifecycle management:**
The agent's first attempt at fetch mocking used a pattern (`vi.spyOn` + `vi.restoreAllMocks` in afterEach) that broke across test suites. While the agent diagnosed and fixed the issue after seeing failures, a more experienced test author would have avoided the anti-pattern upfront. This suggests AI is better at reactive debugging than proactive test architecture.

**Holistic UX judgment:**
The agent implemented exactly what specs described but couldn't evaluate whether the overall experience "felt right." For example, the 50ms delay before aria-live announcements was specified in the story, but the agent couldn't judge whether this timing produced a natural screen reader experience. Manual testing with actual assistive technology was never performed.

**Cross-browser visual testing:**
All E2E tests ran in Chromium only. The agent couldn't assess whether skeleton animations, focus-visible rings, or reduced-motion overrides rendered correctly in Firefox or Safari.

**Production hardening decisions:**
The security review identified three findings (missing helmet, rate limiting, Swagger exposure) but the agent couldn't determine appropriate production configuration values. These decisions require understanding deployment context, traffic patterns, and infrastructure that only a human can assess.

**Code coverage blind spot:**
Through three full epics of implementation, the agent never flagged that `App.tsx` and `api/todos.ts` had 0% unit coverage. The gap was only visible once code coverage reporting was explicitly configured. The agent should have recommended coverage tooling earlier in the project.

### Where Human Expertise Was Critical

| Area | Why Human Input Mattered |
|------|--------------------------|
| **Product vision & PRD** | Defined what to build, success metrics, and scope boundaries — the entire project direction |
| **UX design decisions** | Color choices, copy tone, animation timing, interaction patterns — all authored by humans via the UX spec |
| **Architecture choices** | Tech stack selection (Fastify over Express, raw SQL over ORM, React Query with Suspense) required human judgment about trade-offs |
| **Story prioritization** | Sprint planning, epic sequencing, and story acceptance were human-driven via BMad workflow |
| **Code review judgment** | `/bmad-code-review` caught mechanical issues, but architectural decisions (e.g., "use inline errors, not toasts") were made by humans in the story spec |
| **Accessibility validation** | Axe-core caught automated violations, but VoiceOver/NVDA screen reader testing requires human ears and judgment |
| **Security risk assessment** | The agent identified missing security headers but couldn't judge severity in context — a dev-only todo app has different risk tolerance than a production SaaS |
| **Deciding what NOT to build** | The agent planned a GitHub Actions CI workflow for Story 3.4, but the human decided to skip it. The agent saved this as a feedback memory to avoid re-proposing CI |
| **Course corrections** | When the agent used raw `<button>` elements instead of shadcn Button, the human caught it and provided feedback that was saved for all future work |

### Summary

**AI was highly effective for:** implementation from specs, test generation, automated audits (a11y, security, performance), documentation generation, iterative debugging, dependency management, and maintaining consistency across stories via accumulated learnings.

**AI needed human guidance for:** product definition, UX judgment, architectural trade-offs, production configuration, manual accessibility testing, cross-browser validation, and deciding what NOT to build.

**Key insight:** The BMad workflow's story-driven approach was the single biggest factor in AI effectiveness. Stories with clear acceptance criteria, task breakdowns, and accumulated dev notes produced high-quality output with minimal iteration. Vague or open-ended requests produced lower-quality results that required more human correction.
