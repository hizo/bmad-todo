---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
inputDocuments:
  - prd.md
workflowType: 'architecture'
project_name: 'bmad-todo'
user_name: 'Hizo'
date: '2026-03-16'
lastStep: 8
status: 'complete'
completedAt: '2026-03-16'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
16 functional requirements across 4 domains:
- **Task Management (FR1-FR6):** Single-entity CRUD with toggle completion. No bulk operations, no ordering, no categories in v1.
- **Data Persistence (FR7-FR9):** Every mutation persists immediately via API. State must survive browser refresh and session boundaries.
- **Application States (FR10-FR13):** Explicit empty, loading, and error states with user recovery paths. Error handling is a product requirement, not an afterthought.
- **API (FR14-FR16):** REST CRUD with proper status codes. Todo entity: id, text, completion status, creation timestamp.

**Non-Functional Requirements:**
- **Performance:** 200ms API responses, 2s initial page load, sub-100ms perceived UI interactions, stable with 200 todos
- **Accessibility:** WCAG 2.1 AA — keyboard navigation, focus indicators, 4.5:1 contrast, ARIA live regions for status changes, 200% zoom support
- **Reliability:** Zero data loss on acknowledged writes, graceful backend unavailability handling, correct state after refresh at any point
- **Maintainability:** Clean frontend/backend separation, consistent linting, documented API contract
- **Testability:** Unit + integration tests (backend), unit + E2E via Playwright (frontend), all runnable in CI with single command

**Scale & Complexity:**
- Primary domain: Full-stack web application (SPA + REST API)
- Complexity level: Low
- Estimated architectural components: ~4 (frontend SPA, REST API, data persistence layer, shared types/contract)

### Technical Constraints & Dependencies

- Architecture must not preclude adding authentication and multi-user support in future phases
- No server-side rendering or SEO requirements
- No real-time features — standard HTTP request-response only
- Modern evergreen browsers only — no polyfills needed
- Solo developer scope — architecture must be straightforward to implement and maintain alone

### Cross-Cutting Concerns Identified

- **Error handling strategy:** Consistent approach needed across both frontend (UI states) and backend (status codes/messages) — this is a product-level requirement
- **Accessibility:** Pervasive across all UI components — must be built in from the start, not bolted on
- **Responsive design:** Mobile-first CSS affecting all UI components
- **Future extensibility:** Data model and API design must accommodate auth/multi-user without structural rewrites
- **Testing strategy:** Full coverage approach (unit + integration + E2E) requires testable architecture from day one

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (SPA + REST API) based on project requirements analysis.

### Approach: Composed Monorepo

No single starter template covers this stack. Instead, a composed setup using proven scaffolding tools per layer, organized in a pnpm workspace monorepo.

### Starter Options Considered

| Option | Verdict |
|---|---|
| **FuelStack** (Turborepo + Fastify + Next.js) | Closest match but includes Next.js instead of Vite, and brings unnecessary complexity |
| **T3 Stack** | Next.js-centric, doesn't fit SPA + separate Fastify API model |
| **Connected Repo Starter** | Includes tRPC and OrchidORM — too opinionated for our needs |
| **Composed setup** (individual scaffolding per layer) | Best fit — each tool is current, no unnecessary dependencies, full control |

### Selected Approach: Composed Monorepo Setup

**Rationale:** For a low-complexity project with clear, specific technology choices, composing from individual tools avoids inheriting unwanted opinions from full-stack starters. Each layer uses its official scaffolding, keeping dependencies minimal and versions current.

**Monorepo Structure:**

```
bmad-todo/
├── apps/
│   ├── frontend/          # Vite + React + TypeScript + shadcn
│   └── backend/           # Fastify + TypeScript + pg
├── packages/
│   └── shared/            # Shared TypeScript types (Todo entity, API contract)
├── docker-compose.yml     # PostgreSQL + frontend + backend
├── pnpm-workspace.yaml
├── package.json
├── docs/                  # Existing project docs
└── _bmad-output/          # Existing planning artifacts
```

**Initialization Commands:**

```bash
# Monorepo setup
pnpm init
# Create pnpm-workspace.yaml pointing to apps/* and packages/*

# Frontend
cd apps
npm create vite@latest frontend -- --template react-ts
cd frontend
npx shadcn@latest init

# Backend
mkdir -p apps/backend && cd apps/backend
pnpm init
# Install fastify, pg, @types/pg, typescript, tsx

# Shared types
mkdir -p packages/shared
# TypeScript project with Todo interface and API contract types
```

**Architectural Decisions Provided by Setup:**

**Language & Runtime:**
- TypeScript across all packages (strict mode)
- Node.js runtime for backend
- Vite dev server for frontend

**Styling Solution:**
- Tailwind CSS v4 via shadcn/ui initialization
- shadcn CLI v4 for component scaffolding
- CSS variables for theming

**Build Tooling:**
- Vite 6.3.x for frontend bundling and dev server
- tsx for backend development, tsc for production builds
- pnpm workspaces for monorepo dependency management

**Testing Framework:**
- **Backend:** `node:test` (Node.js built-in test runner) for unit and integration tests, with Fastify's `inject()` / `light-my-request` for route testing. API contracts validated via **Postman MCP**.
- **Frontend:** Vitest for unit and component tests, debugged with **Chrome DevTools MCP**
- **E2E:** Playwright automated via **Playwright MCP**

**Testing Workflow:**
- Component tests: written as you build each component, debugged with Chrome DevTools MCP
- API integration tests: written per endpoint as built, contracts validated via Postman MCP
- E2E tests: browser flows automated via Playwright MCP
- All tests runnable in CI with a single command

**Database Access:**
- `pg` (node-postgres) — direct SQL queries, no ORM
- Manual TypeScript interfaces for data types
- Raw SQL migrations (or a lightweight migration runner)

**Code Organization:**
- pnpm workspaces monorepo (no Turborepo — unnecessary for 2 apps)
- Shared types package for API contract between frontend and backend
- Docker Compose for local development (PostgreSQL + app services)

**Development Experience:**
- Vite HMR for frontend
- tsx watch mode for backend
- Docker Compose for one-command local environment startup

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data model: UUID primary keys, single `todos` table
- Database access: Raw SQL via `pg` with parameterized queries
- API contract: REST CRUD with consistent `{ data }` / `{ error: { code, message } }` envelope
- Migration: `node-pg-migrate` for schema management

**Important Decisions (Shape Architecture):**
- Frontend state: TanStack Query with Suspense via custom `useTodos()` hook
- API client: Native `fetch` in a thin typed wrapper
- Logging: Fastify's built-in Pino (structured JSON)
- Docker Compose: 3 services (frontend, backend, postgres)

**Deferred Decisions (Post-MVP):**
- Production hosting platform (Render free tier, AWS free trial, or similar — decided at end)
- CI/CD pipeline
- Monitoring and alerting
- Authentication provider and strategy

### Data Architecture

- **Database:** PostgreSQL 16+
- **Access pattern:** Raw SQL via `pg` (node-postgres), parameterized queries only
- **ID strategy:** UUIDs — future-proof for multi-user/distributed scenarios
- **Migrations:** `node-pg-migrate` — lightweight, TypeScript support, PostgreSQL-specific
- **Schema:** Single `todos` table (id UUID, text, completed, created_at). Designed to accommodate a `user_id` column addition later without structural rewrites

### Authentication & Security

- **v1:** No authentication — explicitly out of scope per PRD
- **Input safety:** Parameterized SQL queries via `pg` (prevents SQL injection). Basic input validation on backend (non-empty text, valid types)
- **Future-proofing:** API route structure and data model accommodate `user_id` addition without rewrites

### API & Communication Patterns

- **Style:** REST CRUD over HTTP
- **Route namespace:** `/api/todos` — leaves room for versioning later
- **Response envelope:** Success: `{ data: ... }`, Error: `{ error: { code: string, message: string } }`
- **HTTP status codes:** `200` (OK), `201` (Created), `400` (Validation), `404` (Not Found), `500` (Server Error)
- **Validation:** Fastify JSON Schema validation on route inputs
- **Documentation:** `@fastify/swagger` for auto-generated OpenAPI docs from route schemas

### Frontend Architecture

- **State management:** TanStack Query with Suspense integration via custom `useTodos()` hook. React built-in `useState` for local UI state only (form inputs, toggles).
- **Loading states:** `<Suspense fallback={<LoadingState />}>` — no manual loading booleans
- **Error handling:** React Error Boundaries catch query failures → render `ErrorState`. Mutations use `onError` for inline feedback.
- **Component tree:** `App` → `Suspense` + `ErrorBoundary` → `TodoList` → `TodoItem`, plus `AddTodoForm`, `EmptyState`, `LoadingState`, `ErrorState`
- **UI primitives:** shadcn/ui components (Button, Input, Card, etc.)
- **API client:** Native `fetch` wrapped in typed `api/todos.ts` module matching shared contract
- **Styling:** Tailwind CSS v4 with shadcn CSS variables for theming

### Infrastructure & Deployment

- **Local development:** Docker Compose with 3 services — `frontend` (Vite), `backend` (Fastify), `postgres` (PostgreSQL 16)
- **One-command startup:** `docker-compose up` runs the full stack
- **Data persistence:** Docker volume for PostgreSQL data across restarts
- **Environment config:** `.env` file at repo root (in `.gitignore`), backend reads from environment variables (12-factor)
- **Logging:** Fastify's built-in Pino logger — structured JSON, zero config
- **Production hosting:** Deferred — container images are portable to Render, AWS, GCP, or any Docker-capable platform

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo scaffolding + Docker Compose + PostgreSQL
2. Shared types package (Todo entity, API contract)
3. Backend: Fastify + routes + `pg` + migrations
4. Frontend: Vite + React + shadcn + API client
5. E2E tests + polish
6. Production deployment (hosting decision)

**Cross-Component Dependencies:**
- Shared types package consumed by both frontend and backend
- API response envelope shape must be consistent — defined once in shared package
- Docker Compose networking connects frontend → backend → postgres
- Migration must run before backend starts accepting requests

## Implementation Patterns & Consistency Rules

### Naming Conventions

**Database:**
- Tables: `snake_case`, plural → `todos`
- Columns: `snake_case` → `created_at`, `is_completed`
- Indexes: `idx_{table}_{column}` → `idx_todos_created_at`

**API:**
- Endpoints: plural nouns → `/api/todos`, `/api/todos/:id`
- Route params: `:id` (Fastify convention)
- JSON fields: `camelCase` → `createdAt`, `isCompleted`
- Backend maps `snake_case` DB columns ↔ `camelCase` JSON

**Code:**
- Files: `kebab-case` → `todo-list.tsx`, `todo-routes.ts`
- React components: `PascalCase` → `TodoList`, `AddTodoForm`
- Functions/variables: `camelCase` → `getTodos`, `isCompleted`
- Types/interfaces: `PascalCase` → `Todo`, `ApiResponse<T>`, `ApiError`

### Structure Conventions

**Test location:** Co-located → `todo-routes.ts` + `todo-routes.test.ts` in same directory. E2E tests in `e2e/` at monorepo root.

**Component organization:** By feature, flat where possible. `components/todo-list/` contains the component, its tests, and sub-components.

**Backend layout:**
```
apps/backend/src/
├── routes/          # Route handlers (todo-routes.ts)
├── db/              # Database queries + connection (queries.ts, pool.ts)
├── migrations/      # node-pg-migrate migration files
├── schemas/         # Fastify JSON Schema definitions
├── plugins/         # Fastify plugins (error-handler, etc.)
└── server.ts        # App setup and configuration
```

**Frontend layout:**
```
apps/frontend/src/
├── components/      # React components by feature
├── hooks/           # Custom hooks (use-todos.ts)
├── api/             # API client (todos.ts)
├── types/           # Frontend-specific types (if any beyond shared)
└── App.tsx          # Root component
```

### API Response Format

**Success:** `{ data: T }`
**Error:** `{ error: { code: string, message: string } }`

**HTTP status codes:** `200` OK, `201` Created, `400` Validation, `404` Not Found, `500` Internal Error

**Date/time:** ISO 8601 strings in JSON, stored as `TIMESTAMPTZ` in PostgreSQL

**DB ↔ API mapping:** `snake_case` in database → `camelCase` in JSON. Mapping in the route/query layer.

**Null handling:** Omit null fields from responses.

### Frontend Patterns

**Server state:** TanStack Query with Suspense integration
- `useSuspenseQuery()` for data fetching in `useTodos()` hook
- `useMutation()` for create, toggle, delete operations
- Query invalidation after successful mutations

**Loading states:** `<Suspense fallback={<LoadingState />}>` — no manual loading booleans

**Error handling:** React Error Boundaries catch query failures → render `ErrorState`. Mutations use `onError` for inline feedback with retry option.

**Accessibility:** Status changes (todo completed, error states) must use `aria-live="polite"` regions for screen reader announcements. Completion toggles and error/success feedback must be announced.

**Local UI state:** React built-in `useState` only — for form inputs, UI toggles, etc.

### Backend Patterns

**Error handling:** Fastify error handler plugin catches all errors → consistent `{ error }` envelope with appropriate status code. Never leak stack traces.

**Validation:** Fastify JSON Schema validates all inputs at route level. Frontend does basic UX validation (non-empty text) but backend is source of truth.

**Logging:** Pino via Fastify — `error` for failures, `info` for requests, `debug` for development. Never log sensitive data.

### Linting & Formatting

**Tool:** Biome — single tool for both linting and formatting. One config file (`biome.json`) at monorepo root, shared across all packages.
- TypeScript + React rules enabled out of the box
- Replaces ESLint + Prettier with a single dependency
- Runs in CI as part of the test command

### Enforcement Guidelines

**All AI agents MUST:**
- Follow naming conventions exactly as specified — no variations
- Use the API response envelope for every endpoint — no exceptions
- Co-locate tests with source files
- Map `snake_case` ↔ `camelCase` at the route/query boundary, nowhere else
- Use Fastify JSON Schema for all input validation
- Use TanStack Query + Suspense for all data fetching — no raw `useEffect` fetch patterns
- Use naming convention: `*.test.ts` for unit tests, `*.integration.test.ts` for integration tests

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-todo/
├── .env.example                    # Environment variable template
├── .env                            # Local env vars (in .gitignore)
├── .gitignore
├── docker-compose.yml              # PostgreSQL + backend + frontend
├── pnpm-workspace.yaml             # Workspace: apps/*, packages/*
├── package.json                    # Root package.json
│
├── apps/
│   ├── frontend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── components.json          # shadcn config
│   │   ├── index.html
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── App.tsx              # Root: QueryClientProvider + Suspense + ErrorBoundary
│   │   │   ├── main.tsx             # Entry point
│   │   │   ├── index.css            # Tailwind base styles
│   │   │   ├── api/
│   │   │   │   └── todos.ts         # Typed fetch wrapper (FR14-FR16)
│   │   │   ├── hooks/
│   │   │   │   └── use-todos.ts     # useSuspenseQuery + useMutation (FR1-FR9)
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn primitives (Button, Input, Card, etc.)
│   │   │   │   ├── todo-list/
│   │   │   │   │   ├── todo-list.tsx       # List container (FR2, FR6)
│   │   │   │   │   └── todo-list.test.tsx
│   │   │   │   ├── todo-item/
│   │   │   │   │   ├── todo-item.tsx       # Single todo: toggle + delete (FR3-FR5)
│   │   │   │   │   └── todo-item.test.tsx
│   │   │   │   ├── add-todo-form/
│   │   │   │   │   ├── add-todo-form.tsx   # Create input (FR1)
│   │   │   │   │   └── add-todo-form.test.tsx
│   │   │   │   ├── empty-state/
│   │   │   │   │   └── empty-state.tsx     # No todos view (FR10)
│   │   │   │   ├── loading-state/
│   │   │   │   │   └── loading-state.tsx   # Suspense fallback (FR11)
│   │   │   │   └── error-state/
│   │   │   │       └── error-state.tsx     # ErrorBoundary fallback (FR12, FR13)
│   │   │   └── types/               # Frontend-specific types (if any)
│   │   └── e2e/                     # Playwright tests
│   │       ├── todo-crud.spec.ts    # Core CRUD flows (Journey 1, 2)
│   │       └── error-handling.spec.ts  # Error/recovery flows (Journey 3)
│   │
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── src/
│           ├── server.ts             # Fastify app setup + plugin registration
│           ├── routes/
│           │   ├── todo-routes.ts                    # CRUD route handlers (FR14-FR16)
│           │   └── todo-routes.integration.test.ts   # Integration tests via inject() (needs PostgreSQL)
│           ├── db/
│           │   ├── pool.ts               # pg Pool connection setup
│           │   ├── queries.ts            # Raw SQL query functions (FR7-FR9)
│           │   └── queries.test.ts       # Unit tests (no DB needed)
│           ├── migrations/
│           │   └── 001_create-todos.ts    # Initial schema: todos table
│           ├── schemas/
│           │   └── todo-schemas.ts        # Fastify JSON Schema definitions
│           └── plugins/
│               └── error-handler.ts       # Global error → { error: { code, message } }
│
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types.ts              # Todo, ApiResponse<T>, ApiError
│           └── index.ts              # Package exports
│
├── e2e/                              # Monorepo-level E2E config
│   └── playwright.config.ts
│
├── docs/                             # Project documentation
└── _bmad-output/                     # Planning artifacts
```

### Architectural Boundaries

**API Boundary:**
- Single REST boundary at `/api/todos` — all frontend ↔ backend communication goes through this
- Frontend never accesses the database directly
- Backend never serves UI — only JSON responses

**Component Boundaries:**
- `packages/shared` is the contract between frontend and backend — types defined once, consumed by both
- Frontend components communicate via props down, callbacks up — no global event system
- TanStack Query manages all server state — components don't fetch directly

**Data Boundary:**
- `db/pool.ts` owns the database connection — nothing else creates connections
- `db/queries.ts` is the only file that writes SQL — routes call query functions, never raw SQL
- `snake_case` ↔ `camelCase` mapping happens exclusively in `db/queries.ts`

### Requirements to Structure Mapping

| Requirement | Frontend | Backend | Shared |
|---|---|---|---|
| FR1: Create todo | `add-todo-form/` | `routes/todo-routes.ts` | `types.ts` |
| FR2: View all todos | `todo-list/` | `routes/todo-routes.ts` | `types.ts` |
| FR3-FR4: Toggle complete | `todo-item/` | `routes/todo-routes.ts` | `types.ts` |
| FR5: Delete todo | `todo-item/` | `routes/todo-routes.ts` | `types.ts` |
| FR6: Visual distinction | `todo-item/` (CSS) | — | — |
| FR7-FR9: Persistence | `hooks/use-todos.ts` | `db/queries.ts` | — |
| FR10: Empty state | `empty-state/` | — | — |
| FR11: Loading state | `loading-state/` (Suspense) | — | — |
| FR12-FR13: Error/recovery | `error-state/` (ErrorBoundary) | `plugins/error-handler.ts` | `types.ts` (ApiError) |
| FR14-FR16: REST API | `api/todos.ts` | `routes/`, `schemas/` | `types.ts` |

### Data Flow

```
User Action → React Component → useTodos() hook → api/todos.ts (fetch)
    → HTTP → Fastify route → JSON Schema validation → db/queries.ts (SQL)
    → PostgreSQL → response → camelCase mapping → { data: T } envelope
    → HTTP response → TanStack Query cache → React re-render
```

### Development Workflow

- **Start everything:** `docker-compose up` (PostgreSQL + backend + frontend)
- **Backend dev:** `tsx watch src/server.ts` — auto-restart on changes
- **Frontend dev:** `vite` — HMR in browser
- **Run backend unit tests:** `node --test 'src/**/*.test.ts'`
- **Run backend integration tests:** `node --test 'src/**/*.integration.test.ts'` (needs PostgreSQL)
- **Run all backend tests:** `node --test 'src/**/*.{test,integration.test}.ts'`
- **Run frontend tests:** `vitest`
- **Run E2E tests:** `playwright test`
- **Run migrations:** `node-pg-migrate up`
- **Lint & format:** `biome check .` (or `biome check --write .` to auto-fix)

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** Pass
All technology choices are compatible and well-established together. No version conflicts. pnpm workspaces cleanly connects frontend, backend, and shared packages.

**Pattern Consistency:** Pass
Naming, structure, format, and process patterns all align with the chosen stack. No contradictions.

**Structure Alignment:** Pass
Project tree maps directly to all architectural decisions. Boundaries are clear and enforceable.

### Requirements Coverage

**Functional Requirements:** 16/16 covered
Every FR maps to specific files in the project structure (see Requirements to Structure Mapping).

**Non-Functional Requirements:** All covered
- Performance: Vite (fast builds), Fastify (fast API), raw SQL (minimal overhead), TanStack Query (caching)
- Accessibility: shadcn accessible primitives + ARIA live regions for status changes
- Reliability: Parameterized queries, Error Boundaries, TanStack Query client state preservation
- Maintainability: Clean separation, shared types, Biome for consistent code style
- Testability: `node:test` + Vitest + Playwright, co-located tests, naming convention

### Implementation Readiness

**Decision Completeness:** All critical and important decisions documented with versions.
**Structure Completeness:** Full project tree with every file mapped to requirements.
**Pattern Completeness:** All conflict points addressed with concrete examples.

### Gap Analysis Results

**No critical or important gaps found.**

**Minor items addressed during validation:**
1. Added ARIA live region guidance — status changes (todo completed, error states) must use `aria-live="polite"` regions for screen reader announcements
2. Added Biome as the linting/formatting tool — single config, fast, TypeScript + React support out of the box

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Minimal, proven stack with no unnecessary abstractions
- Every requirement maps to a specific file and pattern
- Clear boundaries prevent AI agent conflicts
- Docker Compose enables one-command local development
- Testing strategy covers all layers with clear separation

**Areas for Future Enhancement:**
- Production hosting decision (deferred — end of project)
- CI/CD pipeline (post-MVP)
- Authentication architecture (Phase 2)
- Monitoring and observability (post-MVP)
