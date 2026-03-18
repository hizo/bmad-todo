# Story 2.2: Delete Todo

Status: done

## Story

As a user,
I want to delete a todo,
so that I can remove tasks that are no longer relevant.

## Acceptance Criteria

1. **DELETE endpoint (AC1)**
   - Given the backend server is running
   - When I send `DELETE /api/todos/:id`
   - Then I receive a `200` response with `{ data: { id } }`
   - And the todo is removed from the database

2. **DELETE 404 (AC2)**
   - Given I send `DELETE /api/todos/:id` for a non-existent id
   - When the request is processed
   - Then I receive a `404` response with `{ error: { code: "NOT_FOUND", message: "..." } }`

3. **Delete UI (AC3)**
   - Given a todo is displayed in the list
   - When I click/tap the delete button
   - Then the todo is removed from the list (fade/slide-out animation deferred to Epic 3)
   - And the deletion is persisted via the API

4. **Delete accessibility (AC4)**
   - Given the delete button is present on each todo item
   - When I inspect it for accessibility
   - Then the button has an accessible label (e.g., "Delete [task text]")
   - And the button is keyboard focusable and activatable with Enter/Space
   - And focus indicators are visible

5. **Tests pass (AC5)**
   - Given the DELETE endpoint and delete UI are implemented
   - When I run the backend integration tests and frontend unit tests
   - Then all tests pass, including deletion behavior and list update

6. **E2E tests (AC6)**
   - Given the delete feature is implemented end-to-end
   - When I run the Playwright E2E tests
   - Then tests verify deleting a todo removes it from the list and the deletion persists across refresh

7. **Accessibility audit (AC7)**
   - Given the delete UI is rendered
   - When I run an axe-core accessibility audit via Playwright
   - Then zero WCAG AA violations are reported

## Tasks / Subtasks

- [x] Task 1: Add `deleteTodo` query function (AC: 1, 2)
  - [x] In `apps/backend/src/db/queries.ts`, add `deleteTodo(id: string, queryPool?: Pool): Promise<{ id: string } | null>`
  - [x] SQL: `DELETE FROM todos WHERE id = $1 RETURNING id`
  - [x] Return `null` if no row returned (id not found) — do NOT throw
  - [x] Accept optional `queryPool` parameter for testability (same pattern as `updateTodo`, `createTodo`)

- [x] Task 2: Add DELETE route + JSON Schema (AC: 1, 2)
  - [x] In `apps/backend/src/routes/todo-routes.ts`, add `DELETE /:id` route:
    - Schema: params = `todoIdParamsSchema` (already exists in `todo-schemas.ts`), response 200/400/404/500
    - Response 200 schema: `{ type: "object", properties: { data: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } }`
    - Handler: extract `id` from params → call `deleteTodo(id)`
    - If result is `null` → reply 404 with `{ error: { code: "NOT_FOUND", message: "Todo not found" } }`
    - Otherwise → reply 200 with `{ data: { id: result.id } }`
  - [x] Note: `todoIdParamsSchema` already validates UUID format — reuse it, do NOT recreate
  - [x] Note: No request body needed for DELETE

- [x] Task 3: Backend integration tests (AC: 5)
  - [x] In `apps/backend/src/routes/todo-routes.integration.test.ts`, add `describe("DELETE /api/todos/:id")` block with tests:
    - DELETE with valid id → 200, response body `{ data: { id } }`
    - DELETE with same id again → 404 with `NOT_FOUND` error code (confirms actual deletion)
    - DELETE with non-existent UUID → 404 with `NOT_FOUND`
    - DELETE with non-UUID id → 400 (param validation)
    - Verify GET after DELETE does not include deleted todo
  - [x] Follow existing test patterns: use `app.inject()`, share `app` setup from existing `describe` blocks

- [x] Task 4: Add `deleteTodo` API client function (AC: 1, 3)
  - [x] In `apps/frontend/src/api/todos.ts`, add:
    ```ts
    export async function deleteTodo(id: string): Promise<{ id: string }> {
      const res = await fetch(`${BASE_URL}/api/todos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete todo: ${res.status} ${res.statusText}`);
      const json: ApiResponse<{ id: string }> = await res.json();
      return json.data;
    }
    ```
  - [x] No `Content-Type` header needed (no body)

- [x] Task 5: Add `deleteMutation` to `useTodos` hook (AC: 3)
  - [x] In `apps/frontend/src/hooks/use-todos.ts`:
    - Import `deleteTodo` from `@/api/todos`
    - Add `deleteMutation = useMutation({ mutationFn: (id: string) => deleteTodo(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }) })`
    - Return `deleteMutation` alongside existing `todos`, `createMutation`, `toggleMutation`

- [x] Task 6: Add delete button to TodoItem (AC: 3, 4)
  - [x] Modify `apps/frontend/src/components/todo-item/todo-item.tsx`:
    - Add `onDelete: (id: string) => void` prop
    - Add a delete button right-aligned after the todo text
    - Button content: `×` character — minimal, right-aligned
    - Accessible label: `aria-label={`Delete ${todo.text}`}` — dynamic per-item
    - Button is keyboard focusable and activatable with Enter/Space (native `<button>` gets this free)
    - Visible 2px focus ring (`#3B82F6`) with 2px offset — same pattern as checkbox
    - On click: call `onDelete(todo.id)`
    - Button color: muted by default (`text-stone-400`), darker on hover (`text-stone-600`)
    - Changed outer container from `<label>` to `<div>` to avoid nested interactive element conflicts
    - Touch target: 44×44px via `h-11 w-11` button with flex centering

- [x] Task 7: Add fade-out transition for deleted items (AC: 3)
  - [x] Used invalidation-based removal (TanStack Query refetch after deletion). Item disappears cleanly on list re-render. Animation (~200ms fade/slide-out + prefers-reduced-motion handling) deferred to Epic 3.

- [x] Task 8: Add aria-live announcement for delete (AC: 4)
  - [x] In `apps/frontend/src/App.tsx`:
    - Reused the existing aria-live region (already present from Story 2.1)
    - When delete succeeds: set announcement text to "Task deleted"
    - Wired through `handleDelete` with per-call `onSuccess` callback — same `announcementTimer` debounce pattern as `handleToggle`

- [x] Task 9: Wire delete through TodoList → App (AC: 3)
  - [x] Updated `apps/frontend/src/components/todo-list/todo-list.tsx`: added `onDelete` prop, passes through to each `<TodoItem>`
  - [x] Updated `apps/frontend/src/App.tsx`: wired `deleteMutation` from `useTodos()`, passes `onDelete={handleDelete}` to `<TodoList>`

- [x] Task 10: Frontend unit tests (AC: 5)
  - [x] Updated `apps/frontend/src/components/todo-item/todo-item.test.tsx`:
    - Test: delete button renders with accessible label containing todo text ✅
    - Test: clicking delete button calls `onDelete` with correct id ✅
    - Test: delete button is keyboard activatable via Enter ✅
    - Updated all existing tests to pass `onDelete={noop}` prop ✅
  - [x] Updated `apps/frontend/src/components/todo-list/todo-list.test.tsx`:
    - Added `onDelete={noop}` to existing tests ✅
    - Test: passes onDelete callback to TodoItem components ✅

- [x] Task 11: E2E tests for delete (AC: 6, 7)
  - [x] Added `test.describe("Delete Todo")` to `e2e/tests/todo-crud.spec.ts` with 5 tests:
    - Create a todo → click delete → verify removed ✅
    - Delete then refresh → verify persists ✅
    - Delete one of multiple → verify others remain ✅
    - aria-live announces "Task deleted" ✅
    - axe-core a11y audit after delete ✅
  - [x] Reused existing fixtures: `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations`

- [x] Task 12: Update OpenAPI spec + Postman sync (AC: 1)
  - [x] Updated `apps/backend/openapi.yaml`: added `DELETE /api/todos/{id}` path
  - [x] Synced to Postman via MCP:
    1. `mcp__postman__updateSpecFile` — spec ID: `f2c94d38-22e1-42c3-8a77-07a290aa4dd1` ✅
    2. `mcp__postman__syncCollectionWithSpec` — collection ID: `219516-5ae91c4e-bab8-443e-bb9b-14d96f805d70` ✅

- [x] Task 13: Verify all tests pass
  - [x] Backend integration tests: 28/28 pass
  - [x] Frontend unit tests: 22/22 pass
  - [x] E2E tests: 19/19 pass
  - [x] Lint: 0 errors
  - [x] TypeScript: 0 errors

### Quality Audits (frontend stories)

- [x] Run Lighthouse a11y audit (`lighthouse_audit`) — scored **100** on accessibility ✅
- [x] Run performance trace (`performance_start_trace`) — LCP 125ms, CLS 0.00 ✅
- [x] Fix any regressions before marking story complete — no regressions found

### API Sync (story modifies backend API)

- [x] Updated `apps/backend/openapi.yaml` with `DELETE /api/todos/{id}` path
- [x] Synced to Postman via MCP: `mcp__postman__updateSpecFile` + `mcp__postman__syncCollectionWithSpec`

## Dev Notes

### Architecture Constraints (MUST follow)

- **State management**: TanStack Query (`useSuspenseQuery` + `useMutation`) for server state. `useState` only for local UI. No Redux/Zustand.
- **API client**: Native `fetch` wrapped in typed functions in `api/todos.ts`. No axios.
- **Shared types**: Import `Todo`, `ApiResponse<T>`, `ApiError` from `@bmad-todo/shared` — do NOT redeclare.
- **Response envelope**: API returns `{ data: T }` for success, `{ error: { code, message } }` for errors. DELETE returns `{ data: { id } }` (not the full todo).
- **Module system**: ESM (`"type": "module"`). Use `@/` path alias in frontend (configured in vite.config.ts). Use `.js` extensions in backend imports.
- **Linting**: ESLint with typescript-eslint. Run `pnpm lint` / `pnpm lint:fix`.
- **Component library**: shadcn/ui v4 with Base UI React primitives + CVA. Existing `Button`, `Input`, `Checkbox` in `components/ui/` show the pattern.
- **Validation**: Fastify JSON Schema validates all inputs. Frontend does UX validation, backend is source of truth.
- **DB mapping**: `snake_case` in database <-> `camelCase` in JSON. Mapping happens in `db/queries.ts` only.

### File Naming & Conventions (MUST follow)

| Layer | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `todo-item.tsx` |
| React components | PascalCase | `TodoItem` |
| Functions/vars | camelCase | `handleDelete` |
| Types/interfaces | PascalCase | `Todo` |
| Test files | Co-located, `*.test.ts` for unit, `*.integration.test.ts` for integration | `todo-item.test.tsx` |
| Directories | kebab-case | `components/todo-item/` |

### Existing Infrastructure — DO NOT RECREATE

| File | Purpose | Key Detail |
|------|---------|------------|
| `apps/backend/src/routes/todo-routes.ts` | POST + GET + PATCH handlers | Add DELETE here |
| `apps/backend/src/schemas/todo-schemas.ts` | `todoSchema`, `todoIdParamsSchema`, `updateTodoBodySchema`, `apiResponseSchema()`, `apiErrorSchema` | Reuse `todoIdParamsSchema` for DELETE params — already validates UUID |
| `apps/backend/src/db/queries.ts` | `createTodo()`, `getAllTodos()`, `updateTodo()`, `deleteAllTodos()` | Add `deleteTodo()` here. Note: `deleteAllTodos()` already exists for test cleanup — the new function deletes ONE by id |
| `apps/backend/src/db/pool.ts` | pg Pool connection | Import for query functions |
| `apps/backend/src/plugins/error-handler.ts` | Global error -> `{ error }` envelope | Already handles 500s |
| `apps/backend/src/server.ts` | Fastify setup + CORS | CORS `methods` already includes `"DELETE"` — no change needed |
| `apps/frontend/src/api/todos.ts` | `getTodos()`, `createTodo()`, `toggleTodo()` | Add `deleteTodo()` here |
| `apps/frontend/src/hooks/use-todos.ts` | `useTodos()` with `useSuspenseQuery` + `createMutation` + `toggleMutation` | Add `deleteMutation` here |
| `apps/frontend/src/components/todo-item/todo-item.tsx` | Checkbox toggle + completed styling | Add delete button + `onDelete` prop |
| `apps/frontend/src/components/todo-list/todo-list.tsx` | Maps todos to `<TodoItem>`, passes `onToggle` | Pass through `onDelete` prop |
| `apps/frontend/src/App.tsx` | `TodoApp` wires `createMutation` + `toggleMutation`, has aria-live region | Wire `deleteMutation`, add `handleDelete` with aria-live announcement |
| `apps/frontend/src/lib/utils.ts` | `cn()` for merging Tailwind classes | Use in delete button styling |
| `e2e/fixtures.ts` | Playwright fixtures: `resetDb`, `makeAxeBuilder`, `expectNoA11yViolations` | Reuse in delete E2E tests |
| `e2e/tests/todo-crud.spec.ts` | E2E tests: CRUD basics + toggle + a11y | Add Delete Todo describe block here |

### Backend API (currently implemented)

| Method | Endpoint | Status | Request Body | Response |
|--------|----------|--------|-------------|----------|
| GET | `/api/todos` | 200 | -- | `{ data: Todo[] }` |
| POST | `/api/todos` | 201 | `{ text: string }` | `{ data: Todo }` |
| PATCH | `/api/todos/:id` | 200 | `{ completed: boolean }` | `{ data: Todo }` |

New endpoint to add:

| Method | Endpoint | Status | Request Body | Response |
|--------|----------|--------|-------------|----------|
| DELETE | `/api/todos/:id` | 200 | -- | `{ data: { id: string } }` |
| DELETE | `/api/todos/:id` | 404 | -- | `{ error: { code: "NOT_FOUND", message } }` |
| DELETE | `/api/todos/:id` | 400 | invalid id | `{ error: { code: "VALIDATION_ERROR", message } }` |

### UX Design Specifics (MUST follow)

- **Delete button position**: Right-aligned on each todo item (UX spec: "Delete button/icon visible on each todo item, right-aligned")
- **Delete interaction**: Single click/tap. No confirmation dialog (UX anti-pattern: "Modal delete confirmations — unnecessary friction for a low-stakes action")
- **Delete animation**: Brief fade/slide-out ~200ms (UX spec: "Todo fades/slides out ~200ms. No confirmation modal. List reflows.")
- **Delete button style**: Subtle/muted by default to avoid visual competition with the core capture->complete loop. More visible on hover/focus.
- **Focus ring**: 2px `#3B82F6` with 2px offset on delete button (same as checkbox)
- **Touch target**: Minimum 44x44px tap area
- **Screen reader**: aria-live announcement "Task deleted" after successful deletion
- **Respect `prefers-reduced-motion`**: Collapse fade transition to instant removal
- **Delete is lightweight**: UX spec says "Deleting a stale task → Lightness — cleaning up feels good, not scary"

### Previous Story Learnings (from Story 2.1)

- **CORS already configured**: `methods` array in `server.ts` already includes `"DELETE"` — no change needed
- **`todoIdParamsSchema` exists**: Reuse for DELETE `:id` param validation — validates UUID format
- **aria-live region exists**: In `App.tsx`, reuse the existing `<div aria-live="polite">` region. Just set announcement text on delete success.
- **Mutation pattern**: `useMutation` with per-call `onSuccess` callback works for aria-live announcements — same pattern used in `handleToggle`
- **E2E test config**: `workers: 1, fullyParallel: false` in `e2e/playwright.config.ts` — tests run sequentially to avoid `resetDb()` interference
- **Completed text color**: Was changed from `#A8A29E` to `#78716C` for WCAG AA compliance — existing todo-item styling is correct
- **Testing deps**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` already installed
- **ESLint is the linter** (not Biome): Run `pnpm lint`
- **Backend .js extensions**: Backend imports require `.js` extension in import paths (ESM)

### Git Intelligence

Recent commit patterns:
- Backend integration tests use `app.inject()` with shared Fastify test setup
- E2E tests use custom fixtures from `e2e/fixtures.ts` with `resetDb()` and `expectNoA11yViolations()`
- Frontend unit tests use `@testing-library/react` with `render()` + `userEvent`
- OpenAPI spec is manually maintained in `apps/backend/openapi.yaml`
- Postman sync is done via MCP after spec update (both `updateSpecFile` AND `syncCollectionWithSpec`)

### Project Structure Notes

Files to create:
```
(none — all modifications to existing files)
```

Files to modify:
```
apps/backend/src/db/queries.ts                          # Add deleteTodo()
apps/backend/src/routes/todo-routes.ts                  # Add DELETE /:id route
apps/backend/src/routes/todo-routes.integration.test.ts # Add DELETE integration tests
apps/backend/openapi.yaml                               # Add DELETE endpoint spec
apps/frontend/src/api/todos.ts                          # Add deleteTodo()
apps/frontend/src/hooks/use-todos.ts                    # Add deleteMutation
apps/frontend/src/components/todo-item/todo-item.tsx    # Add delete button + onDelete prop
apps/frontend/src/components/todo-item/todo-item.test.tsx # Add delete button tests, update existing
apps/frontend/src/components/todo-list/todo-list.tsx    # Pass through onDelete prop
apps/frontend/src/components/todo-list/todo-list.test.tsx # Add onDelete prop to existing tests
apps/frontend/src/App.tsx                               # Wire deleteMutation, add handleDelete
e2e/tests/todo-crud.spec.ts                             # Add Delete Todo E2E tests
```

### Scope Boundaries — What NOT to build

- **No delete animation (Epic 3)**: Fade/slide-out transition (~200ms) and `prefers-reduced-motion` handling deferred to Epic 3 polish stories.
- **No undo/snackbar**: No undo toast after deletion. The UX spec explicitly avoids "Toast notification overload." If the network fails, the error handling in Epic 3 (Story 3.3) will address retry/recovery.
- **No confirmation dialog**: UX anti-pattern per spec. Delete is a low-stakes action in a personal todo app.
- **No optimistic delete**: Use invalidation-based refetch after delete (same approach as toggle). The item disappears on successful API response + query refetch.
- **No bulk delete**: Only single-item delete. No "delete all completed" or multi-select.
- **No detailed error recovery for failed delete**: Error retry UI is Story 3.3. If delete fails, the mutation error state is sufficient for now.

### References

- [Source: _bmad-output/planning-artifacts/epics.md -- Epic 2, Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md -- API Patterns, Frontend Patterns, Backend Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md -- Experience Mechanics section 3 Delete, Anti-Patterns section (no modals), Direction D colors]
- [Source: _bmad-output/planning-artifacts/prd.md -- FR5, NFR3, NFR5-NFR9]
- [Source: _bmad-output/implementation-artifacts/2-1-toggle-todo-completion.md -- CORS config, todoIdParamsSchema, aria-live, E2E patterns, dev notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Changed TodoItem outer container from `<label>` to `<div>`: the original `<label>` wrapped a Base UI Checkbox (rendered as `<button>`). Adding a second `<button>` (delete) inside a label risks click event conflicts where clicking the delete button could also trigger the toggle. Switching to `<div>` eliminates the ambiguity. The `aria-labelledby` on the checkbox already provides accessible naming — no accessibility regression.

### Completion Notes List

- All 13 tasks + quality audits + API sync completed 2026-03-17
- Backend: `deleteTodo()` follows exact pattern of `updateTodo()` — optional `queryPool`, null-return on not-found, no throw
- Frontend: `deleteMutation` wired end-to-end with `handleDelete` in App.tsx using same `announcementTimer` debounce pattern as toggle
- TodoItem container changed from `<label>` to `<div>` to safely support two interactive children (checkbox + delete button)
- Invalidation-based removal (no optimistic delete) — item disappears after API success + query refetch, consistent with toggle pattern
- E2E: 5 new delete tests in existing `todo-crud.spec.ts` describe block; aria-live "Task deleted" confirmed end-to-end
- Lighthouse a11y: 100; LCP: 125ms; CLS: 0.00 — no regressions from Story 2.1 baseline

### File List

- `apps/backend/src/db/queries.ts` — added `deleteTodo()`
- `apps/backend/src/routes/todo-routes.ts` — added `DELETE /:id` route
- `apps/backend/src/routes/todo-routes.integration.test.ts` — added 5 DELETE integration tests
- `apps/backend/openapi.yaml` — added `DELETE /api/todos/{id}` path
- `apps/frontend/src/api/todos.ts` — added `deleteTodo()`
- `apps/frontend/src/hooks/use-todos.ts` — added `deleteMutation`
- `apps/frontend/src/components/todo-item/todo-item.tsx` — added delete button + `onDelete` prop; changed container from `<label>` to `<div>`
- `apps/frontend/src/components/todo-item/todo-item.test.tsx` — added 3 delete tests; updated all existing tests with `onDelete` prop
- `apps/frontend/src/components/todo-list/todo-list.tsx` — added `onDelete` prop passthrough
- `apps/frontend/src/components/todo-list/todo-list.test.tsx` — added `onDelete` to existing tests + new passthrough test
- `apps/frontend/src/App.tsx` — added `handleDelete`, wired `deleteMutation`, aria-live "Task deleted"
- `e2e/tests/todo-crud.spec.ts` — added Delete Todo describe block (5 tests)

### Change Log

| Date | Change |
|------|--------|
| 2026-03-17 | Implemented all backend + frontend delete functionality |
| 2026-03-17 | Changed TodoItem container from `<label>` to `<div>` for safe dual-button layout |
| 2026-03-17 | Synced openapi.yaml DELETE endpoint to Postman |
