# Story 3.2: Loading State

Status: review

## Story

As a user,
I want to see a visual indicator while todos are being fetched,
so that I know the app is working.

## Acceptance Criteria

1. **Loading indicator displayed during fetch (AC1)**
   - Given I open the application
   - When todos are being fetched from the API
   - Then a loading indicator (Suspense fallback) is displayed in the list area
   - And the layout remains stable (no content shift when data arrives)

2. **Smooth transition on fast response (AC2)**
   - Given the API responds quickly (under ~200ms)
   - When the loading state is shown
   - Then the transition to the loaded list is smooth and not jarring

3. **Accessibility (AC3)**
   - Given the loading state is visible
   - When I inspect it for accessibility
   - Then the loading state has appropriate ARIA attributes (e.g., aria-busy, role="status")
   - And the layout remains usable at 200% browser zoom

4. **Unit tests (AC4)**
   - Given the LoadingState component is implemented
   - When I run the Vitest unit tests
   - Then tests pass for rendering the Suspense fallback correctly

5. **Accessibility audit (AC5)**
   - Given the loading state is rendered
   - When I run an axe-core accessibility audit via Playwright
   - Then zero WCAG AA violations are reported

## Tasks / Subtasks

- [x] Task 1: Enhance `LoadingState` component (AC: 1, 2, 3)
  - [x] Edit `apps/frontend/src/components/loading-state/loading-state.tsx`
  - [x] Add `aria-busy="true"` to the container for screen reader announcement
  - [x] Keep `role="status"` (already present)
  - [x] Add skeleton placeholder layout that matches the todo list structure to prevent CLS:
    - Render 3 skeleton "todo item" placeholders with the same height (min 48px) and spacing as real `TodoItem` components
    - Use animated pulse/shimmer effect via Tailwind `animate-pulse` with `bg-[#E7E5E4]` (Direction D border color) for skeleton bars
    - Skeleton items: a round circle (checkbox placeholder, left) + a rectangular bar (text placeholder, right)
  - [x] Wrap skeleton items in same `<ul>` structure as `TodoList` uses, matching `space-y-3` gap
  - [x] Respect `prefers-reduced-motion`: use Tailwind `motion-reduce:animate-none` to disable pulse animation
  - [x] Use relative units only — no fixed pixel widths on the component itself (200% zoom safe)
  - [x] Keep component stateless and simple — no props needed

- [x] Task 2: Unit tests for `LoadingState` (AC: 4)
  - [x] Create `apps/frontend/src/components/loading-state/loading-state.test.tsx`
  - [x] Test: renders with `role="status"` attribute
  - [x] Test: renders with `aria-busy="true"` attribute
  - [x] Test: renders skeleton placeholder items (3 list items)
  - [x] Follow existing test pattern: `render()` + `screen.getByRole()` from `@testing-library/react`

- [x] Task 3: E2E tests for loading state (AC: 5)
  - [x] Add `test.describe("Loading State")` block to `e2e/tests/todo-crud.spec.ts`
  - [x] Test 1: Loading state has accessible ARIA attributes — navigate to `/`, check for `role="status"` element (may need to intercept/delay API to catch loading state, or test the component in isolation)
  - [x] Test 2: axe-core a11y audit — use `expectNoA11yViolations(makeAxeBuilder)` on loaded page
  - [x] Test 3: No layout shift after load — verify CLS is 0 by checking that the todo list area has consistent dimensions
  - [x] Reuse fixtures: `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations` from `e2e/fixtures.ts`
  - [x] Note: The loading state is transient (Suspense fallback appears only while the query promise is pending). For E2E, you may need to use Playwright's `page.route()` to delay the `GET /api/todos` response to reliably capture the loading state. Example: `await page.route('**/api/todos', route => setTimeout(() => route.continue(), 500))`

- [x] Task 4: Lighthouse + performance audit (AC: 5)
  - [x] Run Lighthouse a11y audit via Chrome DevTools MCP (`lighthouse_audit`) — target 100 accessibility score
  - [x] Run performance trace (`performance_start_trace` / `performance_stop_trace`) — LCP under 2.5s, CLS under 0.1
  - [x] Fix any regressions before marking story complete

- [x] Task 5: Verify all tests pass
  - [x] Frontend unit tests: `pnpm vitest run` — all pass including new LoadingState tests
  - [x] E2E tests: `playwright test` — all existing + new tests pass
  - [x] Lint: `pnpm lint` — 0 errors
  - [x] TypeScript: `tsc --noEmit` — 0 errors

### Quality Audits (frontend stories)

- [x] Run Lighthouse a11y audit (`lighthouse_audit`) — must score 100 on accessibility
- [x] Run performance trace (`performance_start_trace`) — check LCP, CLS, and network dependency insights
- [x] Fix any regressions before marking story complete

## Dev Notes

### Architecture Constraints (MUST follow)

- **State management**: TanStack Query (`useSuspenseQuery` + `useMutation`) for server state. `useState` only for local UI. No Redux/Zustand.
- **Suspense pattern**: `<Suspense fallback={<LoadingState />}>` in `App.tsx` — this is already wired up. The `LoadingState` component IS the Suspense fallback. Do NOT add manual loading booleans or `isLoading` state.
- **Module system**: ESM (`"type": "module"`). Use `@/` path alias in frontend (configured in vite.config.ts).
- **Linting**: ESLint with typescript-eslint. Run `pnpm lint` / `pnpm lint:fix`.
- **Component library**: shadcn/ui v4 with Base UI React primitives + CVA. Existing `Button`, `Input`, `Checkbox` in `components/ui/` show the pattern.
- **Styling**: Tailwind CSS v4, Direction D (Warm & Friendly) color tokens.

### File Naming & Conventions (MUST follow)

| Layer | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `loading-state.tsx` |
| React components | PascalCase | `LoadingState` |
| Test files | Co-located, `*.test.tsx` for frontend unit tests | `loading-state.test.tsx` |
| Directories | kebab-case | `components/loading-state/` |

### Existing Infrastructure — DO NOT RECREATE

| File | Purpose | Key Detail |
|------|---------|------------|
| `apps/frontend/src/components/loading-state/loading-state.tsx` | Current Suspense fallback — **ENHANCE, do not recreate** | Currently renders `<p role="status">Loading…</p>` with `text-[#A8A29E]` color |
| `apps/frontend/src/App.tsx` | Lines 103-105: `<Suspense fallback={<LoadingState />}><TodoApp /></Suspense>` | ErrorBoundary wraps Suspense. Do NOT change the Suspense/ErrorBoundary wiring |
| `apps/frontend/src/hooks/use-todos.ts` | Uses `useSuspenseQuery()` — throws promise while loading, triggers Suspense | No changes needed |
| `apps/frontend/src/api/todos.ts` | `getTodos()` fetches `GET /api/todos` — typed with `ApiResponse<Todo[]>` | No changes needed |
| `apps/frontend/src/components/todo-list/todo-list.tsx` | Renders todo items in `<ul>` with `space-y-3` gap and min-h-[48px] items | Match this structure in skeleton |
| `apps/frontend/src/components/todo-item/todo-item.tsx` | Individual todo: checkbox (left) + text (center) + delete button (right), min-h-[48px] | Skeleton should mirror this layout |
| `e2e/fixtures.ts` | `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations` | Reuse in loading state E2E tests |
| `e2e/tests/todo-crud.spec.ts` | Has describe blocks for CRUD, Toggle, Empty State, Delete | Add Loading State describe block here |

### Current LoadingState Implementation (ENHANCE, do not rewrite from scratch)

The current component at `apps/frontend/src/components/loading-state/loading-state.tsx`:
```tsx
export function LoadingState() {
  return (
    <p className="text-sm text-[#A8A29E]" role="status">
      Loading…
    </p>
  );
}
```

**What to change:**
- Replace the simple `<p>Loading…</p>` with a skeleton placeholder that matches the todo list layout
- Keep `role="status"` for screen reader announcement
- Add `aria-busy="true"` to communicate loading state to assistive technology
- Add skeleton items that mirror the TodoItem layout (checkbox circle + text bar)
- Use Tailwind `animate-pulse` for subtle shimmer effect

### UX Design Specifics (MUST follow)

**Direction D: Warm & Friendly — Color Tokens:**

| Role | Value | Usage in LoadingState |
|------|-------|----------------------|
| Background | `#FFFBF5` (page) | Already applied in App.tsx |
| Surface | `#FFFFFF` | Skeleton container background (if using card) |
| Border | `#E7E5E4` | Skeleton bar background color (pulse target) |
| Text Muted | `#A8A29E` | Accessible "Loading..." text (screen reader label) |

**Skeleton Design:**
- 3 skeleton "todo items" matching the real TodoItem dimensions
- Each skeleton: round circle (16-20px, left-aligned) + rectangular bar (60-80% width, right)
- Background of skeleton bars: `bg-[#E7E5E4]` (border color — subtle on cream background)
- Pulse animation: `animate-pulse` with `motion-reduce:animate-none`
- Layout: same `space-y-3` gap as real `TodoList` uses

**CLS Prevention (CRITICAL):**
- The skeleton MUST occupy the same vertical space as a reasonable todo list (3 items)
- Each skeleton item: `min-h-[48px]` matching real TodoItem
- This prevents content shift when the real list renders
- The `<Suspense>` swap from `<LoadingState />` to `<TodoApp />` should feel smooth

**Accessibility:**
- `role="status"` — already present, tells screen readers this is a live status region
- `aria-busy="true"` — indicates content is loading, screen readers announce it
- Include visually-hidden text "Loading todos..." for screen readers (not just visual skeleton)
- All colors must meet WCAG AA contrast on cream background
- `motion-reduce:animate-none` — respect reduced motion preference

**Transitions (AC2):**
- No explicit CSS transition needed between loading → loaded (React's Suspense handles the swap)
- The key is CLS prevention: skeleton dimensions match real content dimensions, so the swap is smooth
- On fast connections, loading state may flash briefly — this is acceptable behavior for Suspense

### Previous Story Learnings (from Story 3.1)

- **Testing deps already installed**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` — no new deps needed
- **ESLint is the linter** (not Biome): Run `pnpm lint`
- **E2E test config**: `workers: 1, fullyParallel: false` in `e2e/playwright.config.ts` — tests run sequentially
- **E2E fixture pattern**: `resetDb` must be called at start of each test that needs a clean database
- **Accessibility violations**: `expectNoA11yViolations` helper in `e2e/fixtures.ts` — reuse it
- **Lighthouse/perf baseline**: LCP 428ms, CLS 0.00 from Story 3.1 — ensure no regression
- **`@/` alias**: Works in frontend imports, configured in `vite.config.ts`
- **No `.js` extension needed** in frontend imports (only backend requires `.js` extensions for ESM)
- **Completed text color**: `#78716C` for secondary text, `#A8A29E` for muted text — both Direction D tokens
- **Unit test count at Story 3.1**: 24 passing. E2E test count: 24 passing. Ensure no regressions.

### E2E Testing Strategy for Transient Loading State

The loading state is a **Suspense fallback** — it only renders while `useSuspenseQuery` is fetching. On a local Docker setup, the API responds in <50ms, making the loading state nearly invisible.

**Recommended approach to test loading state in E2E:**
1. Use Playwright's `page.route()` to intercept and delay the `GET /api/todos` endpoint:
   ```ts
   await page.route("**/api/todos", async (route) => {
     await new Promise((resolve) => setTimeout(resolve, 1000));
     await route.continue();
   });
   ```
2. Navigate to the page — loading state will be visible for 1 second
3. Assert loading skeleton is present (e.g., `role="status"`, `aria-busy="true"`)
4. Wait for the delayed response to complete
5. Assert loading state is gone and todo list is rendered

**Alternative**: If route interception is unreliable, test the LoadingState component in unit tests only and verify the E2E a11y audit passes on the loaded page (which confirms the Suspense/ErrorBoundary setup is sound).

### Git Intelligence

Recent commit patterns:
- Format: `feat: implement Story X.X — Title`
- E2E tests use `test.describe("Feature Name")` blocks in `todo-crud.spec.ts`
- Unit tests co-located with components in same directory
- All recent stories have been frontend-only

### Project Structure Notes

Files to **modify**:
```
apps/frontend/src/components/loading-state/loading-state.tsx  # Enhance with skeleton placeholders
```

Files to **create**:
```
apps/frontend/src/components/loading-state/loading-state.test.tsx  # Unit tests
```

Files to **modify** (tests):
```
e2e/tests/todo-crud.spec.ts  # Add Loading State describe block
```

### Backend API (NO CHANGES for this story)

| Method | Endpoint | Status | Response |
|--------|----------|--------|----------|
| GET | `/api/todos` | 200 | `{ data: Todo[] }` |

**No backend changes. No Postman sync needed (no API changes).**

### Scope Boundaries — What NOT to build

- **No changes to App.tsx** — Suspense + ErrorBoundary wiring is already correct
- **No changes to use-todos.ts** — `useSuspenseQuery` already triggers Suspense
- **No changes to api/todos.ts** — fetch wrapper is already typed
- **No manual loading state management** — do NOT add `isLoading` state, `useEffect`, or loading booleans. Suspense handles everything.
- **No error handling** — Story 3.3 covers error states and retry
- **No backend changes** — purely frontend component story
- **No Postman sync** — no API changes
- **No spinner animation** — use skeleton placeholders instead (per UX: "Skeleton/placeholder loading — brief placeholder content rather than spinners, preserving layout stability")
- **No optimistic UI changes** — this story is about the initial page load loading state only

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Suspense pattern, Component Tree]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Direction D colors, Skeleton/placeholder loading pattern, State Patterns section]
- [Source: _bmad-output/implementation-artifacts/3-1-empty-state.md — Testing patterns, E2E fixtures, Lighthouse baseline, previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- E2E loading state tests required `waitUntil: "commit"` and 2s route delay to reliably capture transient Suspense fallback
- Initial E2E runs failed because Playwright was run from repo root instead of `e2e/` directory

### Completion Notes List

- Enhanced LoadingState component from simple `<p>Loading…</p>` to skeleton placeholder matching TodoItem layout
- 3 skeleton items with checkbox circle + text bar, `animate-pulse` with `motion-reduce:animate-none`
- ARIA: `role="status"`, `aria-busy="true"`, visually-hidden "Loading todos..." text for screen readers
- CLS prevention: skeleton items use same `min-h-[48px]`, `gap-4`, and `<ul>` structure as real TodoList
- 4 unit tests (role, aria-busy, 3 list items, sr-only text) — 28 total unit tests (no regressions)
- 3 E2E tests (ARIA attributes, a11y audit, CLS check) — 27 total E2E tests (no regressions)
- Lighthouse: Accessibility 100, Best Practices 100, SEO 100
- Performance: LCP 430ms, CLS 0.00 (no regression from Story 3.1 baseline)

### File List

- `apps/frontend/src/components/loading-state/loading-state.tsx` (modified) — Enhanced with skeleton placeholders
- `apps/frontend/src/components/loading-state/loading-state.test.tsx` (created) — 4 unit tests
- `e2e/tests/todo-crud.spec.ts` (modified) — Added Loading State describe block with 3 E2E tests

### Change Log

- 2026-03-18: Implemented Story 3.2 — Loading State with skeleton placeholders, ARIA attributes, unit + E2E tests, Lighthouse/perf audits
