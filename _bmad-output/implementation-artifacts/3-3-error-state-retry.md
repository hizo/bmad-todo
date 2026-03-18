# Story 3.3: Error State & Retry

Status: review

## Story

As a user,
I want to see clear error messages when something goes wrong and be able to retry,
So that I can recover without confusion.

## Acceptance Criteria

1. **Given** the API is unreachable when the app loads
   **When** the initial fetch fails
   **Then** a full-screen error state is displayed with a friendly message (e.g., "Having trouble connecting")
   **And** a retry button is visible and functional
   **And** the error message does not expose technical details

2. **Given** an error state is displayed
   **When** I click the retry button
   **Then** the app attempts to fetch todos again
   **And** if successful, the error state is replaced with the todo list

3. **Given** I create a todo and the API request fails
   **When** the save fails
   **Then** an inline error indicator appears near the failed item
   **And** a retry option is available

4. **Given** I toggle a todo's completion and the API request fails
   **When** the update fails
   **Then** the visual state reverts to the previous state (no false progress)
   **And** a brief inline error is shown

5. **Given** the error state is displayed
   **When** I inspect it for accessibility
   **Then** error messages are announced via aria-live region
   **And** the retry button is keyboard accessible
   **And** all text meets WCAG AA contrast requirements

6. **Given** the ErrorState component and error handling are implemented
   **When** I run the Vitest unit tests
   **Then** tests pass for rendering error states, retry behavior, and mutation error rollback

7. **Given** error handling is implemented end-to-end
   **When** I run the Playwright E2E tests
   **Then** tests verify error state on API failure, retry button functionality, and inline error recovery

8. **Given** the error state is rendered
   **When** I run an axe-core accessibility audit via Playwright
   **Then** zero WCAG AA violations are reported

9. **Given** the error state is functional
   **When** I run a Lighthouse audit and performance trace via Chrome DevTools MCP
   **Then** accessibility score is 100, LCP is under 2.5s, CLS is under 0.1

## Tasks / Subtasks

- [x] Task 1: Create ErrorState component (AC: #1, #5)
  - [x] Create `apps/frontend/src/components/error-state/error-state.tsx`
  - [x] Render friendly message "Having trouble connecting" + description "Check your connection and try again"
  - [x] Render retry button using shadcn/ui `Button`
  - [x] Accept `onRetry` callback prop for retry button click
  - [x] Add `role="alert"` and `aria-live="assertive"` for screen reader announcements
  - [x] Use error colors: text `#B91C1C` heading / `#EF4444` inline, background `#FEF2F2` (WCAG AA compliant)
  - [x] Respect `prefers-reduced-motion`

- [x] Task 2: Wire ErrorState into App.tsx Error Boundary (AC: #1, #2)
  - [x] Replace current inline error rendering in `ErrorBoundary` with `<ErrorState>`
  - [x] Pass `onRetry` that calls `this.setState({ hasError: false })` + resets query client
  - [x] Ensure ErrorBoundary catches `useSuspenseQuery` failures (already does via class boundary)
  - [x] Verify retry clears error state and re-triggers Suspense → query refetch

- [x] Task 3: Add mutation error handling with rollback (AC: #3, #4)
  - [x] In `use-todos.ts`, add optimistic updates to `createMutation`:
    - `onMutate`: optimistically add todo to cache, return previous state
    - `onError`: rollback cache to previous state, set mutation error state
    - `onSettled`: invalidate queries
  - [x] In `use-todos.ts`, add optimistic updates to `toggleMutation`:
    - `onMutate`: optimistically toggle in cache, return previous state
    - `onError`: rollback cache, set error state
    - `onSettled`: invalidate queries
  - [x] In `use-todos.ts`, add optimistic updates to `deleteMutation`:
    - `onMutate`: optimistically remove from cache, return previous state
    - `onError`: rollback cache, set error state
    - `onSettled`: invalidate queries
  - [x] Expose mutation error states from `useTodos()` hook

- [x] Task 4: Add inline error UI to TodoItem and AddTodoForm (AC: #3, #4, #5)
  - [x] In `TodoItem`: show inline error text "Couldn't save — tap to retry" when mutation fails
  - [x] In `TodoItem`: add retry action (click error text or retry button) that re-triggers mutation
  - [x] In `TodoItem`: revert visual state on toggle failure (checkbox state rolls back)
  - [x] In `AddTodoForm`: show inline error below input on create failure with retry
  - [x] All inline errors use `aria-live="polite"` for screen reader announcements
  - [x] Error text uses `#EF4444` color, meets WCAG AA contrast

- [x] Task 5: Unit tests — ErrorState component (AC: #6)
  - [x] Create `apps/frontend/src/components/error-state/error-state.test.tsx`
  - [x] Test: renders error heading and description
  - [x] Test: renders retry button
  - [x] Test: calls onRetry callback when retry button clicked
  - [x] Test: has `role="alert"` for accessibility
  - [x] Test: has `aria-live="assertive"` region

- [x] Task 6: Unit tests — mutation error handling (AC: #6)
  - [x] Test: create mutation rollback on error (todo removed from cache)
  - [x] Test: toggle mutation rollback on error (state reverts)
  - [x] Test: delete mutation rollback on error (todo reappears)
  - [x] Test: error state exposed from hook after mutation failure

- [x] Task 7: E2E tests — error scenarios (AC: #7, #8)
  - [x] Add "Error State & Retry" describe block in `e2e/tests/todo-crud.spec.ts`
  - [x] Test: full-screen error state when API unreachable (use `page.route()` to block API)
  - [x] Test: retry button clears error and loads todos (unblock route, click retry)
  - [x] Test: inline error on create failure with retry
  - [x] Test: toggle rollback on API failure
  - [x] Test: axe-core accessibility audit on error state (`expectNoA11yViolations`)

- [x] Task 8: Quality audits (AC: #9)
  - [x] Run Lighthouse a11y audit — must score 100
  - [x] Run performance trace — check LCP < 2.5s, CLS < 0.1
  - [x] Verify no regressions from previous stories (38 unit, 32 E2E tests all pass)

## Dev Notes

### Architecture Constraints (MUST follow)

- **State management:** TanStack Query only — `useSuspenseQuery` + `useMutation`. No Redux/Zustand/useReducer for server state.
- **Suspense pattern:** `<Suspense fallback={<LoadingState />}>` already wired in `App.tsx` (lines 103-105). ErrorBoundary wraps Suspense.
- **Error response envelope:** Backend returns `{ error: { code: string, message: string } }`. Frontend must NOT expose these technical details to user.
- **Optimistic updates:** TanStack Query `onMutate`/`onError`/`onSettled` pattern for cache manipulation. Use `queryClient.setQueryData` and `queryClient.getQueryData` for rollback.
- **No raw useEffect/fetch:** All data fetching through TanStack Query hooks.

### Key Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/frontend/src/components/error-state/error-state.tsx` | **CREATE** | ErrorState component with retry button |
| `apps/frontend/src/components/error-state/error-state.test.tsx` | **CREATE** | Unit tests for ErrorState |
| `apps/frontend/src/App.tsx` | **MODIFY** | Wire ErrorState into ErrorBoundary, add query client reset on retry |
| `apps/frontend/src/hooks/use-todos.ts` | **MODIFY** | Add optimistic updates + rollback + error state exposure |
| `apps/frontend/src/components/todo-item/todo-item.tsx` | **MODIFY** | Add inline error display + retry for toggle/delete failures |
| `apps/frontend/src/components/todo-item/todo-item.test.tsx` | **MODIFY** | Add error state tests |
| `apps/frontend/src/components/add-todo-form/add-todo-form.tsx` | **MODIFY** | Add inline error display for create failures |
| `apps/frontend/src/components/add-todo-form/add-todo-form.test.tsx` | **MODIFY** | Add error UI tests |
| `e2e/tests/todo-crud.spec.ts` | **MODIFY** | Add Error State & Retry describe block |

### Existing Code Patterns to Reuse

**ErrorBoundary in App.tsx (lines 15-33):** Class component with `getDerivedStateFromError`. Currently renders inline error text — replace render with `<ErrorState>` component. Add `resetErrorBoundary` method that clears state + resets query client.

**API client (`api/todos.ts`):** All four functions (`getTodos`, `createTodo`, `toggleTodo`, `deleteTodo`) throw `Error` on non-ok response. These errors propagate to TanStack Query error handlers.

**useTodos hook (`hooks/use-todos.ts`):** Currently uses `onSuccess` callbacks that invalidate `["todos"]` query key. Extend each mutation with `onMutate`/`onError`/`onSettled` for optimistic updates.

**AddTodoForm (`add-todo-form.tsx`, line 16):** Currently swallows errors with empty catch `() => {}`. This keeps input text on failure — preserve this behavior and ADD inline error display.

**Test fixtures (`e2e/fixtures.ts`):** Reuse `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations`. For API blocking, use `page.route('**/api/todos', route => route.abort())`.

### UX Design Requirements

**Full-screen error (server unreachable):**
- Heading: "Having trouble connecting"
- Description: "Check your connection and try again"
- Retry button (shadcn/ui `Button`)
- Tone: calm and helpful, never alarming

**Inline errors (mutation failures):**
- Text: "Couldn't save — tap to retry"
- Appears near the failed action, not in a modal/toast
- Error color: `#EF4444` on background, Error background: `#FEF2F2`
- Recovery is always one tap away

**Optimistic-then-confirm pattern:**
- Every mutation shows immediate visual feedback
- On success: confirm the change
- On failure: revert visual state + show inline error
- User never sees a loading spinner for mutations

**Anti-patterns to avoid:**
- No toast notifications for errors (use inline)
- No modal confirmations
- No technical error details shown to user
- No global error banner for mutation failures (use inline per-item)

### Accessibility Requirements

- Error state: `role="alert"`, `aria-live="assertive"` for immediate announcement
- Inline errors: `aria-live="polite"` for non-urgent announcements
- Retry button: keyboard accessible, visible focus ring (2px accent color, 2px offset)
- Error text contrast: `#EF4444` on white/light backgrounds ≥ 4.5:1 AA
- Respect `prefers-reduced-motion` — no animation on error appearance
- Tab order: error message → retry button follows visual order

### Testing Patterns

**Unit tests:** Use `@testing-library/react` with `render()`, `screen`, `userEvent`. Mock `useTodos` hook or wrap with `QueryClientProvider` for mutation tests. Use `vi.fn().mockRejectedValue()` for error simulation.

**E2E error simulation:** Use Playwright `page.route()` to intercept and abort/fail API calls:
```typescript
await page.route('**/api/todos', route => route.abort());
// or for specific status:
await page.route('**/api/todos', route => route.fulfill({ status: 500, body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'fail' } }) }));
```

**E2E test structure:** Add `test.describe("Error State & Retry", ...)` block in `todo-crud.spec.ts`. Use `page.unroute()` to restore API before retry assertions.

### Project Structure Notes

- File naming: kebab-case files, PascalCase components
- Tests co-located with components (`*.test.tsx`)
- E2E tests in `e2e/tests/todo-crud.spec.ts` (single file, describe blocks per feature)
- Component directories: `components/error-state/` (matches `loading-state/`, `empty-state/`)
- ESM modules with `@/` path alias

### Quality Audits (frontend stories)

<!-- Run these via Chrome DevTools MCP after implementation is functional -->
- [ ] Run Lighthouse a11y audit (`lighthouse_audit`) — must score 100 on accessibility
- [ ] Run performance trace (`performance_start_trace`) — check LCP, CLS, and network dependency insights
- [ ] Fix any regressions before marking story complete

### API Sync (if story modifies backend API)

No backend API changes needed for this story. Error handling is frontend-only. Backend error responses already implemented in `plugins/error-handler.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Patterns, Error Handling, Testing Standards]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Journey 3: Error & Recovery, Color System, Anti-Patterns]
- [Source: _bmad-output/implementation-artifacts/3-2-loading-state.md — Previous Story Intelligence]
- [Source: apps/frontend/src/App.tsx — ErrorBoundary implementation]
- [Source: apps/frontend/src/hooks/use-todos.ts — Current mutation patterns]
- [Source: apps/frontend/src/api/todos.ts — API client error throwing]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Adjusted ErrorState heading color from `#EF4444` to `#B91C1C` and description from `#78716C` to `#57534E` to pass WCAG AA contrast on `#FEF2F2` background (axe-core caught the violation in E2E a11y test)

### Completion Notes List

- Created ErrorState component with full-screen error display, retry button, role="alert", aria-live="assertive"
- Wired ErrorState into App.tsx ErrorBoundary with queryClient.resetQueries() on retry
- Implemented optimistic updates with rollback for all three mutations (create, toggle, delete) using TanStack Query onMutate/onError/onSettled pattern
- Added inline error UI to TodoItem (error prop + retry button) and AddTodoForm (error message below input)
- Updated TodoList to pass per-item error info from mutation state
- 10 new unit tests: 6 for ErrorState component, 4 for mutation rollback behavior
- 5 new E2E tests: full-screen error, retry button, inline create error, toggle rollback, a11y audit on error state
- Lighthouse: Accessibility 100, Best Practices 100, SEO 100
- Performance: LCP 146ms (<2.5s), CLS 0.00 (<0.1)
- All 38 unit tests pass (was 28), all 32 E2E tests pass (was 27), all 28 backend tests pass

### Change Log

- 2026-03-18: Implemented Story 3.3 — Error State & Retry (all 8 tasks)

### File List

- `apps/frontend/src/components/error-state/error-state.tsx` — **CREATED** — ErrorState component
- `apps/frontend/src/components/error-state/error-state.test.tsx` — **CREATED** — ErrorState unit tests (6 tests)
- `apps/frontend/src/hooks/use-todos.test.tsx` — **CREATED** — Mutation rollback unit tests (4 tests)
- `apps/frontend/src/App.tsx` — **MODIFIED** — ErrorBoundary uses ErrorState, added itemErrors + createError wiring
- `apps/frontend/src/hooks/use-todos.ts` — **MODIFIED** — Optimistic updates + rollback for all mutations
- `apps/frontend/src/components/todo-item/todo-item.tsx` — **MODIFIED** — Added error + onRetry props, inline error display
- `apps/frontend/src/components/todo-list/todo-list.tsx` — **MODIFIED** — Added itemErrors prop, passes error/retry to TodoItem
- `apps/frontend/src/components/add-todo-form/add-todo-form.tsx` — **MODIFIED** — Added error prop, inline error display
- `e2e/tests/todo-crud.spec.ts` — **MODIFIED** — Added "Error State & Retry" describe block (5 tests)
