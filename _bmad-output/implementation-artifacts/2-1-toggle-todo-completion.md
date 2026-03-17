# Story 2.1: Toggle Todo Completion

Status: review

## Story

As a user,
I want to mark a todo as complete or incomplete,
so that I can track what's done and what's left.

## Acceptance Criteria

1. **PATCH endpoint (AC1)**
   - Given the backend server is running
   - When I send `PATCH /api/todos/:id` with body `{ "completed": true }`
   - Then I receive a `200` response with the updated todo `{ data: { id, text, completed: true, createdAt } }`
   - And the change is persisted in the database

2. **PATCH 404 (AC2)**
   - Given I send `PATCH /api/todos/:id` for a non-existent id
   - When the request is processed
   - Then I receive a `404` response with `{ error: { code: "NOT_FOUND", message: "..." } }`

3. **Toggle to complete (AC3)**
   - Given a todo is displayed in the list
   - When I click/tap the checkbox on an active todo
   - Then the todo is visually marked as complete (strikethrough text + muted color)
   - And the completion state is persisted via the API
   - And a screen reader announcement is triggered via aria-live region ("Task completed")

4. **Toggle to incomplete (AC4)**
   - Given a todo is marked as complete
   - When I click/tap the checkbox again
   - Then the todo visually reverts to active state (normal text, full color)
   - And the state change is persisted via the API
   - And a screen reader announcement is triggered ("Task restored")

5. **Perceived instant response (AC5)**
   - Given the toggle interaction
   - When the user clicks the checkbox
   - Then the visual change occurs immediately (under 100ms perceived response)

6. **Tests pass (AC6)**
   - Given the PATCH endpoint and toggle UI are implemented
   - When I run the backend integration tests and frontend unit tests
   - Then all tests pass, including toggle behavior and visual state changes

7. **E2E tests (AC7)**
   - Given the toggle feature is implemented end-to-end
   - When I run the Playwright E2E tests
   - Then tests verify toggling a todo complete/incomplete with visual change and persistence across refresh

8. **Accessibility audit (AC8)**
   - Given the toggle feature is rendered
   - When I run an axe-core accessibility audit via Playwright
   - Then zero WCAG AA violations are reported

## Tasks / Subtasks

- [x] Task 1: Add `updateTodo` query function (AC: 1, 2)
  - [x] In `apps/backend/src/db/queries.ts`, add `updateTodo(id: string, completed: boolean): Promise<Todo | null>`
  - [x] SQL: `UPDATE todos SET completed = $2 WHERE id = $1 RETURNING id, text, completed, created_at`
  - [x] Return `null` if no row returned (id not found) — do NOT throw
  - [x] Map `snake_case` → `camelCase` in return (same pattern as `createTodo` and `getAllTodos`)
  - [x] Accept optional `queryPool` parameter for testability (same pattern as existing functions)

- [x] Task 2: Add PATCH route + JSON Schema (AC: 1, 2)
  - [x] In `apps/backend/src/schemas/todo-schemas.ts`, add `updateTodoBodySchema` — `{ completed: boolean }` required
  - [x] Add `todoIdParamsSchema` — `{ id: { type: "string", format: "uuid" } }` for param validation
  - [x] In `apps/backend/src/routes/todo-routes.ts`, add `PATCH /:id` route:
    - Schema: params = `todoIdParamsSchema`, body = `updateTodoBodySchema`, response 200/400/404/500
    - Handler: extract `id` from params, `completed` from body → call `updateTodo(id, completed)`
    - If result is `null` → reply 404 with `{ error: { code: "NOT_FOUND", message: "Todo not found" } }`
    - Otherwise → reply 200 with `{ data: todo }`

- [x] Task 3: Backend integration tests (AC: 6)
  - [x] In `apps/backend/src/routes/todo-routes.integration.test.ts`, add tests:
    - PATCH `/api/todos/:id` with `{ completed: true }` → 200, returned todo has `completed: true`
    - PATCH same id with `{ completed: false }` → 200, `completed: false`
    - PATCH with non-existent UUID → 404 with `NOT_FOUND` error code
    - PATCH with invalid body (missing `completed`) → 400
    - PATCH with non-UUID id → 400
  - [x] Follow existing test patterns: use `app.inject()`, share `app` setup from existing tests

- [x] Task 4: Add `toggleTodo` API client function (AC: 1, 3, 4)
  - [x] In `apps/frontend/src/api/todos.ts`, add:
    ```ts
    export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
      const res = await fetch(`${BASE_URL}/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error(`Failed to update todo: ${res.status} ${res.statusText}`);
      const json: ApiResponse<Todo> = await res.json();
      return json.data;
    }
    ```

- [x] Task 5: Add `toggleMutation` to `useTodos` hook (AC: 3, 4, 5)
  - [x] In `apps/frontend/src/hooks/use-todos.ts`:
    - Import `toggleTodo` from `@/api/todos`
    - Add `toggleMutation = useMutation({ mutationFn: ({ id, completed }) => toggleTodo(id, completed), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }) })`
    - Return `toggleMutation` alongside existing `todos` and `createMutation`

- [x] Task 6: Update TodoItem with checkbox toggle (AC: 3, 4, 5, 8)
  - [x] Modify `apps/frontend/src/components/todo-item/todo-item.tsx`:
    - Add `onToggle: (id: string, completed: boolean) => void` prop
    - Add a round checkbox (native `<input type="checkbox">`) left-aligned before the text
    - Checkbox visually: round border, amber fill (`#F59E0B`) when completed (UX spec Direction D)
    - On click: call `onToggle(todo.id, !todo.completed)`
    - Completed state: strikethrough text + muted color `#78716C` (changed from `#A8A29E` — WCAG AA fix)
    - Active state: normal text `#292524`
    - Checkbox is keyboard focusable and activatable with Space
    - Visible 2px focus ring on checkbox (`#3B82F6`)
    - Animation: checkbox fill + strikethrough transition ~200ms CSS, `motion-reduce:transition-none`
    - Accessible: `<label htmlFor>` associated with checkbox via id

- [x] Task 7: Add aria-live announcements (AC: 3, 4, 8)
  - [x] Added `aria-live="polite"` region (visually hidden `sr-only`) to App.tsx
  - [x] When toggle succeeds: set announcement text to "Task completed" or "Task restored"
  - [x] Uses `useState` + per-call `onSuccess` callback

- [x] Task 8: Wire toggle through TodoList → App (AC: 3, 4)
  - [x] Updated `apps/frontend/src/components/todo-list/todo-list.tsx`: added `onToggle` prop, passes through to each `<TodoItem>`
  - [x] Updated `apps/frontend/src/App.tsx`: wired `toggleMutation` from `useTodos()`, passes `onToggle={handleToggle}` to `<TodoList>`

- [x] Task 9: Frontend unit tests (AC: 6)
  - [x] Created `apps/frontend/src/components/todo-item/todo-item.test.tsx` with 7 tests
  - [x] Updated `apps/frontend/src/components/todo-list/todo-list.test.tsx`: added `onToggle={noop}` to existing tests + new "passes onToggle" test

- [x] Task 10: E2E tests for toggle (AC: 7, 8)
  - [x] Added `test.describe("Toggle Todo Completion")` to `e2e/tests/todo-crud.spec.ts` with 4 tests
  - [x] Fixed parallel test interference: set `workers: 1, fullyParallel: false` in `e2e/playwright.config.ts`

- [x] Task 11: Verify all tests pass
  - [x] Backend: 23/23 pass
  - [x] Frontend: 18/18 pass
  - [x] E2E: 10/10 pass
  - [x] Lint: 0 errors
  - [x] TypeScript: 0 errors

### Quality Audits (frontend stories)

- [x] Lighthouse a11y audit — scored 100 on accessibility
- [x] Performance trace — LCP 91ms, CLS 0.00 (no regressions)

### API Sync (story modifies backend API)

- [x] Updated `apps/backend/openapi.yaml` with `PATCH /api/todos/{id}` path and full request/response schema
- [x] Synced updated spec to Postman via MCP: `mcp__postman__updateSpecFile` (spec ID: `f2c94d38-22e1-42c3-8a77-07a290aa4dd1`) — synced 2026-03-17

## Dev Notes

### Architecture Constraints (MUST follow)

- **State management**: TanStack Query (`useSuspenseQuery` + `useMutation`) for server state. `useState` only for local UI. No Redux/Zustand.
- **API client**: Native `fetch` wrapped in typed functions in `api/todos.ts`. No axios.
- **Shared types**: Import `Todo`, `ApiResponse<T>`, `ApiError` from `@bmad-todo/shared` — do NOT redeclare.
- **Response envelope**: API returns `{ data: T }` for success, `{ error: { code, message } }` for errors.
- **Module system**: ESM (`"type": "module"`). Use `@/` path alias in frontend (configured in vite.config.ts). Use `.js` extensions in backend imports.
- **Linting**: ESLint with typescript-eslint. Run `pnpm lint` / `pnpm lint:fix`.
- **Component library**: shadcn/ui v4 with Base UI React primitives + CVA. Existing `Button` and `Input` in `components/ui/` show the pattern.
- **Validation**: Fastify JSON Schema validates all inputs. Frontend does UX validation, backend is source of truth.
- **DB mapping**: `snake_case` in database ↔ `camelCase` in JSON. Mapping happens in `db/queries.ts` only.

### File Naming & Conventions (MUST follow)

| Layer | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `todo-item.tsx` |
| React components | PascalCase | `TodoItem` |
| Functions/vars | camelCase | `handleToggle` |
| Types/interfaces | PascalCase | `Todo` |
| Test files | Co-located, `*.test.ts` for unit, `*.integration.test.ts` for integration | `todo-item.test.tsx` |
| Directories | kebab-case | `components/todo-item/` |

### Existing Infrastructure — DO NOT RECREATE

| File | Purpose | Key Detail |
|------|---------|------------|
| `apps/backend/src/routes/todo-routes.ts` | POST + GET handlers | Add PATCH here |
| `apps/backend/src/schemas/todo-schemas.ts` | `todoSchema`, `apiResponseSchema()`, `apiErrorSchema` | Reuse these in PATCH response schemas |
| `apps/backend/src/db/queries.ts` | `createTodo()`, `getAllTodos()`, `deleteAllTodos()` | Add `updateTodo()` here, follow same pattern |
| `apps/backend/src/db/pool.ts` | pg Pool connection | Import for query functions |
| `apps/backend/src/plugins/error-handler.ts` | Global error → `{ error }` envelope | Already handles 500s |
| `apps/frontend/src/api/todos.ts` | `getTodos()`, `createTodo()` | Add `toggleTodo()` here |
| `apps/frontend/src/hooks/use-todos.ts` | `useTodos()` with `useSuspenseQuery` + `createMutation` | Add `toggleMutation` here |
| `apps/frontend/src/components/todo-item/todo-item.tsx` | Display-only todo with completed styling | Add checkbox + `onToggle` prop |
| `apps/frontend/src/components/todo-list/todo-list.tsx` | Maps todos to `<TodoItem>` | Pass through `onToggle` prop |
| `apps/frontend/src/App.tsx` | `TodoApp` uses `useTodos()`, wires `createMutation` | Wire `toggleMutation` to `TodoList` |
| `apps/frontend/src/lib/utils.ts` | `cn()` for merging Tailwind classes | Use in TodoItem checkbox styling |
| `e2e/fixtures.ts` | Playwright fixtures: `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations` | Reuse in toggle E2E tests |
| `e2e/tests/todo-crud.spec.ts` | Existing E2E tests for create + persist + a11y | Add toggle tests here |
| `packages/shared/src/types.ts` | `Todo` (has `completed: boolean`), `ApiResponse<T>`, `ApiError` | Already supports toggle |

### Backend API (already implemented, Story 1.2)

| Method | Endpoint | Status | Request Body | Response |
|--------|----------|--------|-------------|----------|
| GET | `/api/todos` | 200 | — | `{ data: Todo[] }` |
| POST | `/api/todos` | 201 | `{ text: string }` | `{ data: Todo }` |

New endpoint to add:

| Method | Endpoint | Status | Request Body | Response |
|--------|----------|--------|-------------|----------|
| PATCH | `/api/todos/:id` | 200 | `{ completed: boolean }` | `{ data: Todo }` |
| PATCH | `/api/todos/:id` | 404 | — | `{ error: { code: "NOT_FOUND", message } }` |
| PATCH | `/api/todos/:id` | 400 | invalid body | `{ error: { code: "VALIDATION_ERROR", message } }` |

### UX Design Specifics (MUST follow)

- **Checkbox style**: Round, with amber fill (`#F59E0B`) on completion (Direction D: Warm & Friendly)
- **Completed text**: Strikethrough + muted color `#A8A29E` (already implemented in TodoItem)
- **Active text**: Normal color `#292524` (already implemented)
- **Animation**: Checkbox fill + strikethrough ~200ms CSS transition
- **Respect `prefers-reduced-motion`**: Collapse transitions to instant state changes
- **Focus ring**: 2px `#3B82F6` with 2px offset on checkbox
- **Touch target**: Minimum 48px height (already on TodoItem), checkbox area should be easy to tap
- **Screen reader**: aria-live="polite" announcements — "Task completed" / "Task restored"
- **No confirmation dialog**: Toggle is immediately applied, reversible with same gesture

### Previous Story Learnings (from Story 1.3)

- **shadcn/ui pattern**: Components in `components/ui/` are plain elements with Tailwind classes + CVA. `Button` and `Input` already exist — follow the same pattern if creating a Checkbox UI primitive.
- **useTodos hook pattern**: Returns `{ todos, createMutation }`. Extend with `toggleMutation` — same structure.
- **API client pattern**: Each function is a standalone export in `api/todos.ts`. Follow same error-throw pattern.
- **Vitest setup**: `vitest.config.ts` exists with jsdom environment. Test setup at `src/test/setup.ts` imports `@testing-library/jest-dom`.
- **Testing deps installed**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` already in devDeps.
- **ErrorBoundary**: Basic class component in App.tsx — leave as is (detailed ErrorState is Epic 3).
- **Linting**: Biome was removed. ESLint is the linter. Run `pnpm lint`.
- **VITE_API_BASE_URL**: Falls back to `http://localhost:3000` when env var not set.
- **Backend .js extensions**: Backend imports require `.js` extension in import paths (ESM).

### Git Intelligence

Recent commits show consistent patterns:
- Backend integration tests use `app.inject()` with Fastify's test helper
- E2E tests use custom fixtures from `e2e/fixtures.ts` with `resetDb()` and `expectNoA11yViolations()`
- Frontend unit tests use `@testing-library/react` with `render()` + `userEvent`

### Project Structure Notes

Files to create:
```
(none — all modifications to existing files)
```

Files to modify:
```
apps/backend/src/db/queries.ts                          # Add updateTodo()
apps/backend/src/schemas/todo-schemas.ts                # Add updateTodoBodySchema, todoIdParamsSchema
apps/backend/src/routes/todo-routes.ts                  # Add PATCH /:id route
apps/backend/src/routes/todo-routes.integration.test.ts # Add PATCH integration tests
apps/frontend/src/api/todos.ts                          # Add toggleTodo()
apps/frontend/src/hooks/use-todos.ts                    # Add toggleMutation
apps/frontend/src/components/todo-item/todo-item.tsx    # Add checkbox + onToggle prop
apps/frontend/src/components/todo-list/todo-list.tsx    # Pass through onToggle prop
apps/frontend/src/App.tsx                               # Wire toggleMutation, add aria-live region
e2e/tests/todo-crud.spec.ts                             # Add toggle E2E + a11y tests
```

New test file to create:
```
apps/frontend/src/components/todo-item/todo-item.test.tsx  # Unit tests for toggle behavior
```

### Scope Boundaries — What NOT to build

- **No delete**: Delete button/functionality is Story 2.2. Do NOT add delete UI or API.
- **No optimistic UI**: Use simple invalidation-based refetch after toggle. Optimistic updates can be added later if needed for perceived performance.
- **No detailed error state**: Error retry UI for failed toggles is Story 3.3. If toggle fails, the mutation error state is sufficient.
- **No undo toast**: No undo/snackbar for toggle — the action is already reversible with one click.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Patterns, Frontend Patterns, Backend Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Direction D colors, Experience Mechanics §2 Complete, Accessibility §Focus Indicators]
- [Source: _bmad-output/planning-artifacts/prd.md — FR3, FR4, FR6, NFR3, NFR5-NFR9]
- [Source: _bmad-output/implementation-artifacts/1-3-frontend-create-and-display-todos.md — Frontend patterns, existing infrastructure, dev notes]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- CORS error on PATCH: `@fastify/cors` was missing `methods` config — added `["GET", "POST", "PATCH", "DELETE", "OPTIONS"]` to fix preflight failure
- E2E toggle timing: removed intermediate `waitForLoadState("networkidle")` — Playwright's own polling assertions (`expect(...).toHaveClass(...)`) handle the async re-render correctly
- Parallel E2E test interference: `fullyParallel: true` caused `resetDb()` calls to interleave across workers; fixed with `workers: 1, fullyParallel: false`
- WCAG AA color contrast: `#A8A29E` on white is ~3:1 (fails AA for normal text); changed completed text to `#78716C` (~4.8:1)

### Completion Notes List

- All 11 tasks + quality audits + API sync completed on 2026-03-17
- Completed text color changed from spec's `#A8A29E` to `#78716C` to satisfy WCAG 2.1 AA 4.5:1 requirement; still visually muted alongside strikethrough
- Used native `<input type="checkbox">` with `<label htmlFor>` rather than a styled button — semantically correct, zero additional ARIA required
- `useMutation` `onSuccess` wired through `handleToggle` in App.tsx with per-call callback to support aria-live announcements without extra hooks

### File List

- `apps/backend/src/db/queries.ts` — added `updateTodo()`
- `apps/backend/src/schemas/todo-schemas.ts` — added `updateTodoBodySchema`, `todoIdParamsSchema`
- `apps/backend/src/routes/todo-routes.ts` — added `PATCH /:id` route
- `apps/backend/src/routes/todo-routes.integration.test.ts` — added 5 PATCH integration tests
- `apps/backend/src/server.ts` — added `methods` to CORS config
- `apps/backend/openapi.yaml` — added `PATCH /api/todos/{id}` path
- `apps/frontend/src/api/todos.ts` — added `toggleTodo()`
- `apps/frontend/src/hooks/use-todos.ts` — added `toggleMutation`
- `apps/frontend/src/components/todo-item/todo-item.tsx` — added checkbox + `onToggle` prop
- `apps/frontend/src/components/todo-item/todo-item.test.tsx` — created with 7 unit tests
- `apps/frontend/src/components/todo-list/todo-list.tsx` — added `onToggle` prop passthrough
- `apps/frontend/src/components/todo-list/todo-list.test.tsx` — updated with `onToggle` + new test
- `apps/frontend/src/App.tsx` — wired `toggleMutation`, added `handleToggle`, added aria-live region
- `e2e/tests/todo-crud.spec.ts` — added Toggle Todo Completion describe block (4 tests)
- `e2e/playwright.config.ts` — changed to `workers: 1, fullyParallel: false`

### Change Log

| Date | Change |
|------|--------|
| 2026-03-17 | Implemented all backend + frontend toggle functionality |
| 2026-03-17 | Fixed CORS config missing `methods` for PATCH preflight |
| 2026-03-17 | Fixed completed text color `#A8A29E` → `#78716C` for WCAG AA compliance |
| 2026-03-17 | Fixed E2E parallel test interference with `workers: 1` |
| 2026-03-17 | Synced openapi.yaml PATCH endpoint to Postman |
