# Story 1.2: Backend Todo API — Create & Read

Status: ready-for-dev

## Story

As a developer,
I want REST endpoints to create and list todos,
so that the frontend can persist and retrieve tasks.

## Acceptance Criteria

1. **Given** the backend server is running, **When** I send `POST /api/todos` with body `{ "text": "Buy groceries" }`, **Then** I receive a `201` response with `{ data: { id, text, completed: false, createdAt } }` **And** the todo is persisted in the database.

2. **Given** todos exist in the database, **When** I send `GET /api/todos`, **Then** I receive a `200` response with `{ data: [{ id, text, completed, createdAt }, ...] }` **And** todos are returned in consistent creation order.

3. **Given** I send `POST /api/todos` with empty or missing text, **When** the request is validated, **Then** I receive a `400` response with `{ error: { code: "VALIDATION_ERROR", message: "..." } }`.

4. **Given** a database error occurs, **When** any API request is processed, **Then** I receive a `500` response with `{ error: { code: "INTERNAL_ERROR", message: "..." } }` **And** no stack traces are leaked in the response.

5. **Given** route schemas are defined with Fastify JSON Schema, **When** I access `/docs`, **Then** auto-generated OpenAPI docs describe the create and list endpoints.

6. **Given** the API routes are implemented, **When** I run the integration tests, **Then** all tests pass against a real PostgreSQL database using Fastify's `inject()` method.

## Tasks / Subtasks

- [ ] Task 1: Create database query functions (AC: #1, #2, #4)
  - [ ] Create `apps/backend/src/db/queries.ts` with `createTodo(text)` and `getAllTodos()`
  - [ ] Use parameterized SQL queries via `pg` Pool (from `pool.ts`)
  - [ ] Map snake_case DB columns → camelCase Todo type in query functions
  - [ ] Return typed `Todo` objects using `@bmad-todo/shared`

- [ ] Task 2: Create route handlers (AC: #1, #2, #3, #5)
  - [ ] Create `apps/backend/src/routes/todo-routes.ts` as a Fastify plugin
  - [ ] Implement `POST /api/todos` — validate input via JSON Schema, call `createTodo()`, return `201` with `{ data: todo }`
  - [ ] Implement `GET /api/todos` — call `getAllTodos()`, return `200` with `{ data: todos }`
  - [ ] Add Fastify JSON Schema definitions for request body and response using schemas from `todo-schemas.ts`

- [ ] Task 3: Register routes in server (AC: #1, #2, #5)
  - [ ] Import and register todo routes plugin in `server.ts` with prefix `/api/todos`

- [ ] Task 4: Write integration tests (AC: #6)
  - [ ] Create `apps/backend/src/routes/todo-routes.integration.test.ts`
  - [ ] Test POST with valid body → 201 + correct response shape
  - [ ] Test POST with empty/missing text → 400 + VALIDATION_ERROR
  - [ ] Test GET returns all todos in creation order
  - [ ] Test GET returns empty array when no todos exist
  - [ ] Test error envelope format (no stack traces leaked)
  - [ ] Use Fastify `inject()` against real PostgreSQL (requires Docker)

- [ ] Task 5: Write unit tests for query functions (AC: #1, #2)
  - [ ] Create `apps/backend/src/db/queries.test.ts`
  - [ ] Test `createTodo()` returns correctly shaped Todo
  - [ ] Test `getAllTodos()` returns array of Todo objects
  - [ ] Test snake_case → camelCase mapping is correct

## Dev Notes

### Existing Infrastructure (from Story 1.1)

The following are already implemented and ready to use — do NOT recreate:

| File | What It Provides |
|------|-----------------|
| `apps/backend/src/server.ts` | Fastify app with swagger, swagger-ui (`/docs`), error handler plugin, migration runner, graceful shutdown |
| `apps/backend/src/db/pool.ts` | `pg.Pool` instance connected via `DATABASE_URL` env var |
| `apps/backend/src/plugins/error-handler.ts` | Global error handler: catches all errors → `{ error: { code, message } }` envelope. Maps 400→VALIDATION_ERROR, 404→NOT_FOUND, else→INTERNAL_ERROR |
| `apps/backend/src/schemas/todo-schemas.ts` | `todoSchema`, `apiResponseSchema(itemSchema)`, `apiErrorSchema` — JSON Schema definitions for Fastify validation + OpenAPI docs |
| `apps/backend/src/migrations/001_create-todos.ts` | `todos` table: `id` (UUID, PK, gen_random_uuid), `text` (TEXT, NOT NULL), `completed` (BOOLEAN, default false), `created_at` (TIMESTAMPTZ, default CURRENT_TIMESTAMP). Index: `idx_todos_created_at` |
| `packages/shared/src/types.ts` | `Todo { id: string; text: string; completed: boolean; createdAt: string }`, `ApiResponse<T> { data: T }`, `ApiError { error: { code: string; message: string } }` |

### Architecture Constraints

- **No ORM** — use raw SQL via `pg` with parameterized queries only
- **All SQL goes in `db/queries.ts`** — route handlers must NOT contain SQL
- **snake_case → camelCase mapping happens exclusively in `db/queries.ts`** at the query boundary
- **Response envelope**: Success `{ data: T }`, Error `{ error: { code, message } }`
- **HTTP status codes**: 201 for POST create, 200 for GET list, 400 for validation, 404 for not found, 500 for internal errors
- **Module system**: ESM (`"type": "module"`), imports require `.js` extension in relative paths
- **Biome**: 2 spaces, double quotes, semicolons always. Run `pnpm lint:fix` before finishing

### Route Plugin Pattern

Register as a Fastify plugin with `fastify-plugin` (or plain async function with prefix). Example pattern from server.ts:

```typescript
// In todo-routes.ts — export as async Fastify plugin
import type { FastifyInstance } from "fastify";

async function todoRoutes(fastify: FastifyInstance) {
  // Routes registered here get the prefix from registration
  fastify.post("/", { schema: { ... } }, async (request, reply) => { ... });
  fastify.get("/", { schema: { ... } }, async (request, reply) => { ... });
}
export { todoRoutes };

// In server.ts — register with prefix
app.register(todoRoutes, { prefix: "/api/todos" });
```

### Database Query Pattern

```typescript
// In db/queries.ts
import type { Todo } from "@bmad-todo/shared";
import { pool } from "./pool.js";

export async function createTodo(text: string): Promise<Todo> {
  const result = await pool.query(
    "INSERT INTO todos (text) VALUES ($1) RETURNING id, text, completed, created_at",
    [text],
  );
  const row = result.rows[0];
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at.toISOString(),
  };
}
```

### Testing Pattern

- **Test runner**: `node:test` (built-in) with `--experimental-strip-types`
- **Integration tests**: Use Fastify `inject()` — simulates HTTP requests without starting a server
- **Test file naming**: `*.integration.test.ts` for integration, `*.test.ts` for unit
- **Co-located**: Tests live next to source files
- **Requires Docker**: Integration tests need PostgreSQL running (`docker-compose up postgres`)
- **Test DB cleanup**: Truncate `todos` table between tests to ensure isolation
- **Run command**: `pnpm test:backend` or `node --test --experimental-strip-types src/**/*.test.ts`

### Integration Test Setup Pattern

```typescript
// In todo-routes.integration.test.ts
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
// Build a fresh Fastify instance for testing, register plugins + routes
// Use app.inject({ method, url, payload }) to test endpoints
// Truncate todos table in beforeEach for isolation
```

### Project Structure Notes

Files to create in this story:
```
apps/backend/src/
├── db/
│   ├── pool.ts              # EXISTS — do not modify
│   ├── queries.ts           # CREATE — SQL query functions
│   └── queries.test.ts      # CREATE — unit tests
├── routes/
│   ├── todo-routes.ts       # CREATE — POST + GET route handlers
│   └── todo-routes.integration.test.ts  # CREATE — integration tests
├── schemas/
│   └── todo-schemas.ts      # EXISTS — reuse as-is
├── plugins/
│   └── error-handler.ts     # EXISTS — reuse as-is
└── server.ts                # MODIFY — register todoRoutes with /api/todos prefix
```

### References

- [Source: apps/backend/src/server.ts] — Fastify setup, plugin registration pattern
- [Source: apps/backend/src/plugins/error-handler.ts] — Error envelope format
- [Source: apps/backend/src/schemas/todo-schemas.ts] — JSON Schema definitions for validation + OpenAPI
- [Source: apps/backend/src/db/pool.ts] — Database connection pool
- [Source: apps/backend/src/migrations/001_create-todos.ts] — DB schema (todos table)
- [Source: packages/shared/src/types.ts] — Todo, ApiResponse<T>, ApiError types
- [Source: _bmad-output/planning-artifacts/architecture.md] — API patterns, testing standards, code structure
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria, requirements

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
