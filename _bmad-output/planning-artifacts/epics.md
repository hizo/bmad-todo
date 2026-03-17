---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - prd.md
  - architecture.md
---

# bmad-todo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-todo, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a new todo by entering a text description
FR2: User can view all todos in a single list
FR3: User can mark a todo as complete
FR4: User can mark a completed todo as incomplete (toggle)
FR5: User can delete a todo
FR6: User can distinguish between active and completed todos visually
FR7: System persists all todos to the backend on every create, update, and delete action
FR8: System retrieves and displays all persisted todos when the application is loaded
FR9: System preserves todo state (text, completion status, metadata) across browser sessions
FR10: System displays an empty state when no todos exist, guiding the user to create their first task
FR11: System displays a loading state while fetching todos from the backend
FR12: System displays an error state when a backend request fails, with a clear indication of what went wrong
FR13: System allows the user to retry or recover from a failed operation
FR14: Backend exposes a REST API supporting create, read, update, and delete operations for todos
FR15: API returns appropriate status codes and error messages for all operations
FR16: Each todo includes an identifier, text description, completion status, and creation timestamp

### NonFunctional Requirements

NFR1: All API responses must complete within 200ms under normal conditions
NFR2: Initial page load (including fetching todos) must complete within 2 seconds
NFR3: UI interactions (add, complete, delete) must feel instant — perceived response under 100ms
NFR4: The application must remain responsive with up to 200 todos in a single list
NFR5: Application must meet WCAG 2.1 AA compliance
NFR6: All interactive elements must be keyboard navigable with visible focus indicators
NFR7: All content must have sufficient color contrast (minimum 4.5:1 for normal text, 3:1 for large text)
NFR8: All non-decorative images and icons must have appropriate text alternatives
NFR9: Status changes (todo completed/error states) must be announced to screen readers via ARIA live regions
NFR10: Form inputs must have associated labels
NFR11: The application must be usable at 200% browser zoom without loss of content or functionality
NFR12: No data loss — every successfully acknowledged create/update/delete must be persisted durably
NFR13: The application must handle backend unavailability gracefully without crashing or losing client-side state
NFR14: The application must function correctly after a page refresh at any point
NFR15: Clear separation between frontend and backend codebases
NFR16: Consistent code style enforced by linting
NFR17: API contract documented or self-describing
NFR18: Codebase understandable by a new developer without extensive onboarding
NFR19: Backend must have unit test coverage for all API route handlers and business logic
NFR20: Backend must have integration tests validating full request-response cycles against a real database
NFR21: Frontend must have unit test coverage for components and state management logic
NFR22: Frontend must have end-to-end tests via Playwright covering all core user flows (create, complete, delete, empty state, error states)
NFR23: All tests must be runnable in CI with a single command

### Additional Requirements

- Composed monorepo setup using pnpm workspaces (apps/frontend, apps/backend, packages/shared)
- Project initialization via Vite scaffold (frontend), manual Fastify setup (backend), shared TypeScript types package
- Docker Compose for local development with 3 services: frontend (Vite), backend (Fastify), postgres (PostgreSQL 16)
- node-pg-migrate for database schema management
- Biome for linting and formatting (single config at monorepo root)
- Shared types package (packages/shared) for Todo entity, ApiResponse<T>, ApiError — consumed by both frontend and backend
- Fastify JSON Schema validation on all route inputs
- TanStack Query with Suspense integration for frontend data fetching
- @fastify/swagger for auto-generated OpenAPI docs from route schemas
- UUID primary keys for todo entity
- API response envelope: Success { data: T }, Error { error: { code, message } }
- snake_case in database, camelCase in JSON — mapping at route/query boundary
- Co-located tests: *.test.ts for unit, *.integration.test.ts for integration
- Backend testing: node:test runner with Fastify inject() for route testing
- Frontend testing: Vitest for unit/component tests
- E2E testing: Playwright
- Environment config via .env file, backend reads from environment variables (12-factor)
- Pino logging via Fastify built-in (structured JSON)

### UX Design Requirements

N/A — UX Design Specification excluded from input documents per user request.

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Create todo |
| FR2 | Epic 1 | View all todos |
| FR7 | Epic 1 | Persist on mutation |
| FR8 | Epic 1 | Retrieve on load |
| FR9 | Epic 1 | Preserve across sessions |
| FR14 | Epic 1 | REST CRUD API |
| FR15 | Epic 1 | Status codes & error messages |
| FR16 | Epic 1 | Todo entity schema (id, text, completed, created_at) |
| FR3 | Epic 2 | Mark todo complete |
| FR4 | Epic 2 | Toggle todo incomplete |
| FR5 | Epic 2 | Delete todo |
| FR6 | Epic 2 | Visual distinction active vs completed |
| FR10 | Epic 3 | Empty state |
| FR11 | Epic 3 | Loading state |
| FR12 | Epic 3 | Error state |
| FR13 | Epic 3 | Retry/recovery from failed operations |

**NFR Integration:** Testing (NFR19-23), accessibility (NFR5-11), performance (NFR1-4), reliability (NFR12-14), maintainability (NFR15-18), and code quality (NFR16) are woven into every story's acceptance criteria across all epics — not a separate epic.

## Epic List

### Epic 1: Create and View Todos
Users can add todos and see them in a persistent list across sessions. This epic includes all necessary project scaffolding (monorepo, Docker, database, API, frontend) as implementation stories, culminating in a working end-to-end create + view flow. Tests, accessibility, and code quality are built into every story from the start.
**FRs covered:** FR1, FR2, FR7, FR8, FR9, FR14, FR15, FR16

### Epic 2: Complete Task Lifecycle
Users can mark todos complete/incomplete and delete them, with clear visual distinction between active and completed items. Each story includes tests and accessibility requirements.
**FRs covered:** FR3, FR4, FR5, FR6

### Epic 3: Polished Experience & Error Resilience
The app handles empty, loading, and error states gracefully with clear recovery paths. Includes E2E tests covering all core user journeys.
**FRs covered:** FR10, FR11, FR12, FR13

## Epic 1: Create and View Todos

Users can add todos and see them in a persistent list across sessions. This epic includes all necessary project scaffolding (monorepo, Docker, database, API, frontend) as implementation stories, culminating in a working end-to-end create + view flow. Tests, accessibility, and code quality are built into every story from the start.

### Story 1.1: Project Scaffolding & Dev Environment

As a developer,
I want a fully configured monorepo with Docker Compose and database,
So that I can start building features with a single command.

**Acceptance Criteria:**

**Given** the repository is cloned and pnpm is installed
**When** I run `pnpm install`
**Then** all workspace dependencies are installed for apps/frontend, apps/backend, and packages/shared

**Given** Docker and Docker Compose are installed
**When** I run `docker-compose up`
**Then** three services start: frontend (Vite dev server), backend (Fastify), and postgres (PostgreSQL 16)
**And** the frontend is accessible on its configured port
**And** the backend is accessible on its configured port
**And** PostgreSQL is accessible and accepting connections

**Given** the backend service is running
**When** the database migrations execute
**Then** a `todos` table exists with columns: `id` (UUID, primary key), `text` (VARCHAR, NOT NULL), `completed` (BOOLEAN, default false), `created_at` (TIMESTAMPTZ, default now)

**Given** the shared types package exists at packages/shared
**When** I import from `@bmad-todo/shared` in frontend or backend
**Then** I have access to `Todo`, `ApiResponse<T>`, and `ApiError` TypeScript types

**Given** Biome is configured at the monorepo root
**When** I run `biome check .`
**Then** all files pass linting and formatting rules

**Given** an `.env.example` file exists at the repo root
**When** I copy it to `.env`
**Then** the backend reads database connection config from environment variables

### Story 1.2: Backend Todo API — Create & Read

As a developer,
I want REST endpoints to create and list todos,
So that the frontend can persist and retrieve tasks.

**Acceptance Criteria:**

**Given** the backend server is running
**When** I send `POST /api/todos` with body `{ "text": "Buy groceries" }`
**Then** I receive a `201` response with `{ data: { id, text, completed: false, createdAt } }`
**And** the todo is persisted in the database

**Given** todos exist in the database
**When** I send `GET /api/todos`
**Then** I receive a `200` response with `{ data: [{ id, text, completed, createdAt }, ...] }`
**And** todos are returned in creation order (newest first or oldest first — consistent)

**Given** I send `POST /api/todos` with empty or missing text
**When** the request is validated
**Then** I receive a `400` response with `{ error: { code: "VALIDATION_ERROR", message: "..." } }`

**Given** a database error occurs
**When** any API request is processed
**Then** I receive a `500` response with `{ error: { code: "INTERNAL_ERROR", message: "..." } }`
**And** no stack traces are leaked in the response

**Given** route schemas are defined with Fastify JSON Schema
**When** I access the Swagger endpoint
**Then** auto-generated OpenAPI docs describe the create and list endpoints

**Given** the API routes are implemented
**When** I run the integration tests
**Then** all tests pass against a real PostgreSQL database using Fastify's `inject()` method

### Story 1.3: Frontend — Create and Display Todos

As a user,
I want to create todos and see them in a list,
So that I can capture and review my tasks.

**Acceptance Criteria:**

**Given** I open the application
**When** the page loads
**Then** I see an always-visible text input at the top with placeholder text
**And** all existing todos are fetched from the API and displayed in a list below

**Given** the input field is visible
**When** I type a task description and press Enter
**Then** a new todo appears in the list
**And** the input field clears, ready for the next task
**And** the todo is persisted via the API

**Given** I have created todos in a previous session
**When** I close and reopen the browser
**Then** all previously created todos are displayed (FR9: persistence across sessions)

**Given** the frontend uses TanStack Query with Suspense
**When** data is being fetched
**Then** the Suspense fallback is shown (placeholder for loading state — detailed in Epic 3)

**Given** the AddTodoForm component is rendered
**When** I inspect it for accessibility
**Then** the input has an associated label (visible or aria-label)
**And** the form is keyboard navigable (Tab to focus, Enter to submit)
**And** focus indicators are visible on all interactive elements

**Given** the frontend components are implemented
**When** I run the Vitest unit tests
**Then** tests pass for AddTodoForm (submit behavior, input clearing) and TodoList (rendering items)

**Given** the frontend is functional
**When** I run a Lighthouse audit via Chrome DevTools MCP
**Then** the accessibility score is 100 and zero WCAG AA violations are reported

**Given** the frontend is functional
**When** I run a performance trace via Chrome DevTools MCP
**Then** LCP is under 2.5s, CLS is under 0.1, and no critical network dependency issues are flagged

## Epic 2: Complete Task Lifecycle

Users can mark todos complete/incomplete and delete them, with clear visual distinction between active and completed items. Each story includes tests and accessibility requirements.

### Story 2.1: Toggle Todo Completion

As a user,
I want to mark a todo as complete or incomplete,
So that I can track what's done and what's left.

**Acceptance Criteria:**

**Given** the backend server is running
**When** I send `PATCH /api/todos/:id` with body `{ "completed": true }`
**Then** I receive a `200` response with the updated todo `{ data: { id, text, completed: true, createdAt } }`
**And** the change is persisted in the database

**Given** I send `PATCH /api/todos/:id` for a non-existent id
**When** the request is processed
**Then** I receive a `404` response with `{ error: { code: "NOT_FOUND", message: "..." } }`

**Given** a todo is displayed in the list
**When** I click/tap the checkbox on an active todo
**Then** the todo is visually marked as complete (strikethrough text + muted color)
**And** the completion state is persisted via the API
**And** a screen reader announcement is triggered via aria-live region ("Task completed")

**Given** a todo is marked as complete
**When** I click/tap the checkbox again
**Then** the todo visually reverts to active state (normal text, full color)
**And** the state change is persisted via the API
**And** a screen reader announcement is triggered ("Task restored")

**Given** the toggle interaction
**When** the user clicks the checkbox
**Then** the visual change occurs immediately (under 100ms perceived response)

**Given** the PATCH endpoint and toggle UI are implemented
**When** I run the backend integration tests and frontend unit tests
**Then** all tests pass, including toggle behavior and visual state changes

**Given** the toggle feature is implemented end-to-end
**When** I run the Playwright E2E tests
**Then** tests verify toggling a todo complete/incomplete with visual change and persistence across refresh

**Given** the toggle feature is rendered
**When** I run an axe-core accessibility audit via Playwright
**Then** zero WCAG AA violations are reported

**Given** the toggle feature is functional
**When** I run a Lighthouse audit and performance trace via Chrome DevTools MCP
**Then** accessibility score is 100, LCP is under 2.5s, CLS is under 0.1

**Given** the PATCH endpoint is implemented
**When** I sync the Postman collection via MCP
**Then** the PATCH /api/todos/:id endpoint is documented with request/response examples

### Story 2.2: Delete Todo

As a user,
I want to delete a todo,
So that I can remove tasks that are no longer relevant.

**Acceptance Criteria:**

**Given** the backend server is running
**When** I send `DELETE /api/todos/:id`
**Then** I receive a `200` response with `{ data: { id } }`
**And** the todo is removed from the database

**Given** I send `DELETE /api/todos/:id` for a non-existent id
**When** the request is processed
**Then** I receive a `404` response with `{ error: { code: "NOT_FOUND", message: "..." } }`

**Given** a todo is displayed in the list
**When** I click/tap the delete button
**Then** the todo is removed from the list with a brief fade/slide-out transition (~200ms)
**And** the deletion is persisted via the API

**Given** the delete button is present on each todo item
**When** I inspect it for accessibility
**Then** the button has an accessible label (e.g., "Delete [task text]")
**And** the button is keyboard focusable and activatable with Enter/Space
**And** focus indicators are visible

**Given** the DELETE endpoint and delete UI are implemented
**When** I run the backend integration tests and frontend unit tests
**Then** all tests pass, including deletion behavior and list update

**Given** the delete feature is implemented end-to-end
**When** I run the Playwright E2E tests
**Then** tests verify deleting a todo removes it from the list and the deletion persists across refresh

**Given** the delete UI is rendered
**When** I run an axe-core accessibility audit via Playwright
**Then** zero WCAG AA violations are reported

**Given** the delete feature is functional
**When** I run a Lighthouse audit and performance trace via Chrome DevTools MCP
**Then** accessibility score is 100, LCP is under 2.5s, CLS is under 0.1

**Given** the DELETE endpoint is implemented
**When** I sync the Postman collection via MCP
**Then** the DELETE /api/todos/:id endpoint is documented with request/response examples

## Epic 3: Polished Experience & Error Resilience

The app handles empty, loading, and error states gracefully with clear recovery paths. Includes E2E tests covering all core user journeys.

### Story 3.1: Empty State

As a user,
I want to see a helpful prompt when I have no todos,
So that I know how to get started.

**Acceptance Criteria:**

**Given** I open the application with no todos in the database
**When** the page loads and the API returns an empty list
**Then** I see a friendly empty state message guiding me to create my first task (e.g., heading + brief description)
**And** the input field is autofocused, ready for text entry

**Given** I am viewing the empty state
**When** I create my first todo
**Then** the empty state disappears and the todo list appears with the new item

**Given** I have todos and delete them all
**When** the last todo is removed
**Then** the empty state reappears

**Given** the empty state component is rendered
**When** I inspect it for accessibility
**Then** all text meets WCAG AA contrast requirements
**And** the layout remains usable at 200% browser zoom

**Given** the EmptyState component is implemented
**When** I run the Vitest unit tests
**Then** tests pass for rendering the empty state and transitioning to/from it

**Given** the empty state is implemented
**When** I run the Playwright E2E tests
**Then** tests verify the empty state displays when no todos exist and transitions correctly when a todo is added

**Given** the empty state is rendered
**When** I run an axe-core accessibility audit via Playwright
**Then** zero WCAG AA violations are reported

**Given** the empty state is functional
**When** I run a Lighthouse audit and performance trace via Chrome DevTools MCP
**Then** accessibility score is 100, LCP is under 2.5s, CLS is under 0.1

### Story 3.2: Loading State

As a user,
I want to see a visual indicator while todos are being fetched,
So that I know the app is working.

**Acceptance Criteria:**

**Given** I open the application
**When** todos are being fetched from the API
**Then** a loading indicator (Suspense fallback) is displayed in the list area
**And** the layout remains stable (no content shift when data arrives)

**Given** the API responds quickly (under ~200ms)
**When** the loading state is shown
**Then** the transition to the loaded list is smooth and not jarring

**Given** the loading state is visible
**When** I inspect it for accessibility
**Then** the loading state has appropriate ARIA attributes (e.g., aria-busy, role="status")
**And** the layout remains usable at 200% browser zoom

**Given** the LoadingState component is implemented
**When** I run the Vitest unit tests
**Then** tests pass for rendering the Suspense fallback correctly

**Given** the loading state is rendered
**When** I run an axe-core accessibility audit via Playwright
**Then** zero WCAG AA violations are reported

**Given** the loading state is functional
**When** I run a Lighthouse audit and performance trace via Chrome DevTools MCP
**Then** accessibility score is 100, LCP is under 2.5s, CLS is under 0.1

### Story 3.3: Error State & Retry

As a user,
I want to see clear error messages when something goes wrong and be able to retry,
So that I can recover without confusion.

**Acceptance Criteria:**

**Given** the API is unreachable when the app loads
**When** the initial fetch fails
**Then** a full-screen error state is displayed with a friendly message (e.g., "Having trouble connecting")
**And** a retry button is visible and functional
**And** the error message does not expose technical details

**Given** an error state is displayed
**When** I click the retry button
**Then** the app attempts to fetch todos again
**And** if successful, the error state is replaced with the todo list

**Given** I create a todo and the API request fails
**When** the save fails
**Then** an inline error indicator appears near the failed item
**And** a retry option is available

**Given** I toggle a todo's completion and the API request fails
**When** the update fails
**Then** the visual state reverts to the previous state (no false progress)
**And** a brief inline error is shown

**Given** the error state is displayed
**When** I inspect it for accessibility
**Then** error messages are announced via aria-live region
**And** the retry button is keyboard accessible
**And** all text meets WCAG AA contrast requirements

**Given** the ErrorState component and error handling are implemented
**When** I run the Vitest unit tests
**Then** tests pass for rendering error states, retry behavior, and mutation error rollback

**Given** error handling is implemented end-to-end
**When** I run the Playwright E2E tests
**Then** tests verify error state on API failure, retry button functionality, and inline error recovery

**Given** the error state is rendered
**When** I run an axe-core accessibility audit via Playwright
**Then** zero WCAG AA violations are reported

**Given** the error state is functional
**When** I run a Lighthouse audit and performance trace via Chrome DevTools MCP
**Then** accessibility score is 100, LCP is under 2.5s, CLS is under 0.1

### Story 3.4: E2E Test Suite Finalization & CI Integration

As a developer,
I want to verify all E2E tests (written per-story) run together and integrate with CI,
So that the full test suite is reliable and automated.

**Acceptance Criteria:**

**Given** E2E tests have been written per-story throughout Epics 1-3
**When** I run `playwright test`
**Then** all E2E test suites execute together against the running application

**Given** the full E2E suite exists
**When** I review test coverage
**Then** all core user journeys are covered: create, view, toggle, delete, empty state, loading state, error state + retry, and persistence across refresh

**Given** test coverage gaps exist
**When** I identify missing scenarios
**Then** I write additional E2E tests to fill gaps

**Given** all tests exist (unit, integration, E2E)
**When** I run the full test suite with a single command
**Then** backend tests (unit + integration), frontend tests (unit), and E2E tests all pass (NFR23)

**Given** the test suite is complete
**When** I configure CI (GitHub Actions)
**Then** all tests run automatically on push/PR with proper reporting and artifact capture
