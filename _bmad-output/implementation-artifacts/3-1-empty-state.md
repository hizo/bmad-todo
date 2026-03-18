# Story 3.1: Empty State

Status: done

## Story

As a user,
I want to see a helpful prompt when I have no todos,
so that I know how to get started.

## Acceptance Criteria

1. **Empty state displayed on no todos (AC1)**
   - Given I open the application with no todos in the database
   - When the page loads and the API returns an empty list
   - Then I see a friendly empty state message guiding me to create my first task (heading + brief description)
   - And the input field is autofocused, ready for text entry

2. **Transition empty → list (AC2)**
   - Given I am viewing the empty state
   - When I create my first todo
   - Then the empty state disappears and the todo list appears with the new item

3. **Transition list → empty (AC3)**
   - Given I have todos and delete them all
   - When the last todo is removed
   - Then the empty state reappears

4. **Accessibility (AC4)**
   - Given the empty state component is rendered
   - When I inspect it for accessibility
   - Then all text meets WCAG AA contrast requirements
   - And the layout remains usable at 200% browser zoom

5. **Unit tests (AC5)**
   - Given the EmptyState component is implemented
   - When I run the Vitest unit tests
   - Then tests pass for rendering the empty state and transitioning to/from it

6. **E2E tests (AC6)**
   - Given the empty state is implemented
   - When I run the Playwright E2E tests
   - Then tests verify the empty state displays when no todos exist and transitions correctly when a todo is added

7. **Accessibility audit (AC7)**
   - Given the empty state is rendered
   - When I run an axe-core accessibility audit via Playwright
   - Then zero WCAG AA violations are reported

## Tasks / Subtasks

- [x] Task 1: Create `EmptyState` component (AC: 1, 4)
  - [x] Create file: `apps/frontend/src/components/empty-state/empty-state.tsx`
  - [x] Render a heading (e.g., "Nothing here yet") and a short description (e.g., "Add your first task above to get started.")
  - [x] Use UX Direction D typography:
    - Heading: `text-lg font-medium text-[#292524]` (1.125rem / 18px, weight 500)
    - Body: `text-sm text-[#78716C]` (0.875rem / 14px, weight 400)
  - [x] Center the content vertically with some padding: `py-12 text-center` (or similar)
  - [x] No icons, images, or illustrations — text-only per UX "nothing extra" principle
  - [x] NO semantic heading tag needed if visual hierarchy is clear via typography; use `<p>` for heading unless you use proper ARIA structure
  - [x] Export: `export function EmptyState()`

- [x] Task 2: Update `TodoList` to render `EmptyState` (AC: 1, 2, 3)
  - [x] In `apps/frontend/src/components/todo-list/todo-list.tsx`:
    - Import `EmptyState` from `@/components/empty-state/empty-state`
    - Replace the current inline placeholder `<p className="text-center text-sm text-muted-foreground">No todos yet. Add one above!</p>` with `<EmptyState />`
    - The `if (todos.length === 0)` guard already exists — just swap the JSX

- [x] Task 3: Verify autofocus already works on empty state (AC: 1)
  - [x] `AddTodoForm` already has `autoFocus` on the `<Input>` — no code changes needed
  - [x] Verify in Playwright E2E test that the input is focused on page load with empty database

- [x] Task 4: Unit tests for `EmptyState` (AC: 5)
  - [x] Create file: `apps/frontend/src/components/empty-state/empty-state.test.tsx`
  - [x] Test: renders with heading text visible
  - [x] Test: renders with description text visible
  - [x] Follow existing test patterns: `render()` + `screen.getByText()` from `@testing-library/react`
  - [x] Updated `todo-list.test.tsx` — add test that `EmptyState` renders when `todos` prop is empty
  - [x] Existing todo-list tests pass `todos={[]}` for empty and `todos={[mockTodo]}` for populated; verify no regressions

- [x] Task 5: Playwright E2E tests for empty state (AC: 6, 7)
  - [x] Add `test.describe("Empty State")` block to `e2e/tests/todo-crud.spec.ts`
  - [x] Test 1: Empty state shows when no todos — `resetDb()` + navigate + assert empty state text visible
  - [x] Test 2: Input is autofocused when empty state — assert `page.locator('input')` is focused
  - [x] Test 3: Empty state → list transition — add a todo, assert empty state text gone and todo visible
  - [x] Test 4: List → empty transition — create todo, delete it, assert empty state returns
  - [x] Test 5: axe-core a11y audit on empty state — `expectNoA11yViolations(makeAxeBuilder)`
  - [x] Reuse fixtures: `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations` from `e2e/fixtures.ts`

- [x] Task 6: Lighthouse + performance audit (AC: 7)
  - [x] Run Lighthouse a11y audit via Chrome DevTools MCP (`lighthouse_audit`) — target 100 accessibility score
  - [x] Run performance trace (`performance_start_trace` / `performance_stop_trace`) — LCP under 2.5s, CLS under 0.1
  - [x] Fix any regressions before marking story complete

- [x] Task 7: Verify all tests pass
  - [x] Frontend unit tests: `pnpm vitest run` — all pass including new EmptyState tests
  - [x] E2E tests: `playwright test` — all existing + new tests pass
  - [x] Lint: `pnpm lint` — 0 errors
  - [x] TypeScript: `tsc --noEmit` — 0 errors

### Quality Audits

- [x] Run Lighthouse a11y audit (`lighthouse_audit`) — target **100** accessibility score
- [x] Run performance trace (`performance_start_trace`) — LCP under 2.5s, CLS under 0.1
- [x] Fix any regressions before marking story complete

## Dev Notes

### Architecture Constraints (MUST follow)

- **State management**: TanStack Query (`useSuspenseQuery` + `useMutation`) for server state. `useState` only for local UI. No Redux/Zustand.
- **API client**: Native `fetch` wrapped in typed functions in `api/todos.ts`. No axios.
- **Shared types**: Import `Todo`, `ApiResponse<T>`, `ApiError` from `@bmad-todo/shared` — do NOT redeclare.
- **Module system**: ESM (`"type": "module"`). Use `@/` path alias in frontend (configured in vite.config.ts). Backend imports require `.js` extension (not relevant for this story — frontend only).
- **Linting**: ESLint with typescript-eslint. Run `pnpm lint` / `pnpm lint:fix`.
- **Component library**: shadcn/ui v4 with Base UI React primitives + CVA. Existing `Button`, `Input`, `Checkbox` in `components/ui/` show the pattern. EmptyState uses only Tailwind CSS — no shadcn primitives needed.
- **Styling**: Tailwind CSS v4, Direction D (Warm & Friendly) color tokens — see UX specifics below.

### File Naming & Conventions (MUST follow)

| Layer | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `empty-state.tsx` |
| React components | PascalCase | `EmptyState` |
| Test files | Co-located, `*.test.tsx` for frontend unit tests | `empty-state.test.tsx` |
| Directories | kebab-case | `components/empty-state/` |

### Existing Infrastructure — DO NOT RECREATE

| File | Purpose | Key Detail |
|------|---------|------------|
| `apps/frontend/src/components/todo-list/todo-list.tsx` | Maps todos to `<TodoItem>`, already handles empty case with inline `<p>` | Replace the `<p>` with `<EmptyState />` |
| `apps/frontend/src/components/loading-state/loading-state.tsx` | Suspense fallback — already implemented | Do NOT modify in this story (Story 3.2 will polish it) |
| `apps/frontend/src/components/add-todo-form/add-todo-form.tsx` | Has `autoFocus` on the `<Input>` | Input already autofocused — no changes needed |
| `apps/frontend/src/App.tsx` | `TodoApp` renders `AddTodoForm` + `TodoList`, has `ErrorBoundary` + `Suspense` | No changes needed for this story |
| `apps/frontend/src/hooks/use-todos.ts` | `useTodos()` hook — returns `todos`, `createMutation`, `toggleMutation`, `deleteMutation` | No changes needed for this story |
| `e2e/fixtures.ts` | `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations` | Reuse in empty state E2E tests |
| `e2e/tests/todo-crud.spec.ts` | E2E tests for CRUD, toggle, delete | Add Empty State describe block here |

### Current Empty State Handling (REPLACE, do not keep)

`TodoList` currently renders this inline empty state:
```tsx
if (todos.length === 0) {
  return <p className="text-center text-sm text-muted-foreground">No todos yet. Add one above!</p>;
}
```
Replace this `<p>` with `<EmptyState />`. The `if (todos.length === 0)` guard stays.

### Backend API (currently implemented — NO CHANGES for this story)

| Method | Endpoint | Status | Response |
|--------|----------|--------|----------|
| GET | `/api/todos` | 200 | `{ data: Todo[] }` — returns `[]` when no todos |
| POST | `/api/todos` | 201 | `{ data: Todo }` |
| PATCH | `/api/todos/:id` | 200 | `{ data: Todo }` |
| DELETE | `/api/todos/:id` | 200 | `{ data: { id: string } }` |

**No backend changes. No Postman sync needed (no API changes).**

### UX Design Specifics (MUST follow)

**Direction D: Warm & Friendly — Color Tokens:**

| Role | Value | Usage in EmptyState |
|------|-------|---------------------|
| Background | `#FFFBF5` (page) | Already applied in App.tsx |
| Text Primary | `#292524` | Heading text |
| Text Secondary | `#78716C` | Description body text |

**EmptyState Typography (from UX spec):**
- Heading: 1.125rem (18px), weight 500, color `#292524` → `text-lg font-medium text-[#292524]`
- Body: 0.875rem (14px), weight 400, color `#78716C` → `text-sm text-[#78716C]`

**UX Tone:**
- Copy should be warm and inviting: "Nothing here yet" / "Add your first task above to get started."
- Alternatively: "What's on your mind?" (matches UX placeholder tone) + "Use the input above to add your first task."
- Do NOT use generic error-like language ("No items found", "Empty list")
- Per UX: "Welcomed, not overwhelmed. Curious, not confused."

**Accessibility:**
- All text meets WCAG AA: `#292524` on `#FFFBF5` = ~16:1 ratio (passes); `#78716C` on `#FFFBF5` = ~4.8:1 (passes AA)
- Layout usable at 200% browser zoom — use relative units, no fixed pixel widths in component
- No images/icons that would need alt text (text-only component)

**Autofocus:**
- `AddTodoForm` input already has `autoFocus` attribute — the browser will focus it on initial page load
- This covers the AC1 requirement "input field is autofocused, ready for text entry"
- No additional code needed — just verify via E2E test

**Animations/Transitions:**
- Empty state appears/disappears via React conditional render (no explicit animation needed for this story)
- Story 3.2/3.3 will add more polish if needed
- Respect `prefers-reduced-motion` — since there's no animation in EmptyState itself, this is already satisfied

### Previous Story Learnings (from Story 2.2)

- **Testing deps already installed**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` — no new deps needed
- **ESLint is the linter** (not Biome): Run `pnpm lint`
- **E2E test config**: `workers: 1, fullyParallel: false` in `e2e/playwright.config.ts` — tests run sequentially to avoid `resetDb()` interference
- **E2E fixture pattern**: `resetDb` must be called at start of each test that needs a clean database
- **Accessibility violations**: `expectNoA11yViolations` helper in `e2e/fixtures.ts` — reuse it
- **Lighthouse/perf baseline**: LCP 125ms, CLS 0.00 from Story 2.2 — ensure no regression
- **`@/` alias**: Works in frontend imports, configured in `vite.config.ts`
- **No `.js` extension needed** in frontend imports (only backend requires `.js` extensions for ESM)
- **Completed text color was updated** to `#78716C` (not `#A8A29E`) for WCAG AA — use `#78716C` for secondary text in EmptyState too

### Git Intelligence

Recent commit patterns:
- All stories have been frontend-only modifications to existing test files + new components
- E2E tests use `test.describe("Feature Name")` blocks in `todo-crud.spec.ts`
- Unit tests co-located with components in same directory
- Commits use format: `feat: implement Story X.X — Title`

### Project Structure Notes

Files to **create**:
```
apps/frontend/src/components/empty-state/empty-state.tsx       # New component
apps/frontend/src/components/empty-state/empty-state.test.tsx  # Unit tests
```

Files to **modify**:
```
apps/frontend/src/components/todo-list/todo-list.tsx      # Replace inline <p> with <EmptyState />
apps/frontend/src/components/todo-list/todo-list.test.tsx # Add test for EmptyState rendering
e2e/tests/todo-crud.spec.ts                               # Add Empty State describe block
```

### Scope Boundaries — What NOT to build

- **No animation on empty state appearance/disappearance** — simple conditional render. Story 3.2/3.3 handles polish.
- **No illustration or icon** — text-only, per UX "nothing extra" principle and "typography-driven hierarchy over UI chrome"
- **No changes to LoadingState** — Story 3.2 will polish the loading Suspense fallback
- **No changes to ErrorBoundary/ErrorState** — Story 3.3 handles error states
- **No backend changes** — this is purely a frontend component story
- **No Postman sync** — no API changes
- **No autofocus state management** — `autoFocus` is already on `<Input>` in `AddTodoForm`. Do not add any `useEffect` or `ref` to manually focus — browser handles it natively.
- **No undo or snackbar** after todo deletion leads to empty state — that's Story 3.3's concern

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Component Tree, Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Direction D colors, Typography System, Empty State, Experience Mechanics section 4]
- [Source: _bmad-output/implementation-artifacts/2-2-delete-todo.md — Testing patterns, E2E fixtures, Lighthouse baseline]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Created `EmptyState` component with warm/friendly copy ("Nothing here yet" / "Add your first task above to get started.") using Direction D color tokens (`#292524` heading, `#78716C` body) and Tailwind `py-12 text-center` layout — text-only, no icons per UX spec.
- Updated `TodoList` to import and render `<EmptyState />` instead of the inline `<p>` placeholder when `todos.length === 0`.
- Autofocus verified via E2E test — `AddTodoForm`'s existing `autoFocus` attribute handles it natively, no code changes needed.
- Updated `todo-list.test.tsx` empty-state test to check for new EmptyState text; also updated the existing E2E test that asserted on the old "No todos yet" string.
- Unit tests: 24 pass (2 new EmptyState tests + updated TodoList empty test). No regressions.
- E2E tests: 24 pass including 5 new Empty State tests (show, autofocus, empty→list, list→empty, axe a11y).
- Lighthouse: accessibility 100, best-practices 100, SEO 100. No regressions.
- Performance trace: LCP 428ms (under 2.5s), CLS 0.00. No regressions.
- Lint: 0 errors. TypeScript: 0 errors.

### File List

- `apps/frontend/src/components/empty-state/empty-state.tsx` (created)
- `apps/frontend/src/components/empty-state/empty-state.test.tsx` (created)
- `apps/frontend/src/components/todo-list/todo-list.tsx` (modified — replaced inline `<p>` with `<EmptyState />`)
- `apps/frontend/src/components/todo-list/todo-list.test.tsx` (modified — updated empty state test to assert EmptyState text)
- `e2e/tests/todo-crud.spec.ts` (modified — updated old empty string assertion + added Empty State describe block with 5 tests)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status: in-progress → review)

### Change Log

| Date | Change |
|------|--------|
| 2026-03-18 | Story created — ready for dev |
| 2026-03-18 | Implemented EmptyState component, updated TodoList, added unit + E2E + a11y tests, Lighthouse 100, LCP 428ms |
