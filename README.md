# BMad Todo

A full-stack todo application built with React, Fastify, and PostgreSQL. Features WCAG 2.1 AA accessibility, optimistic UI updates, and comprehensive test coverage.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack React Query, shadcn/ui |
| Backend | Fastify 5, TypeScript, PostgreSQL 16, node-pg-migrate |
| Testing | Playwright (E2E + a11y), Vitest (frontend unit), Node.js test runner (backend) |
| Infrastructure | Docker Compose, pnpm workspaces |

## Project Structure

```
bmad-todo/
├── apps/
│   ├── backend/          # Fastify REST API
│   └── frontend/         # React SPA
├── packages/
│   └── shared/           # Shared TypeScript types
├── e2e/                  # Playwright E2E + accessibility tests
├── docker-compose.yml
└── package.json          # pnpm workspace root
```

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Docker](https://www.docker.com/) and Docker Compose

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> bmad-todo
cd bmad-todo
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The defaults work out of the box for local development. See `.env.example` for available variables.

### 3. Start with Docker Compose

```bash
docker-compose up
```

This starts three services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:3000/docs |
| PostgreSQL | localhost:5432 |

Database migrations run automatically on backend startup.

### Local development (without Docker)

If you prefer running services directly:

```bash
# Terminal 1 — Start PostgreSQL (Docker still needed for the database)
docker-compose up postgres

# Terminal 2 — Start backend (watches for changes)
pnpm --filter @bmad-todo/backend dev

# Terminal 3 — Start frontend (watches for changes)
pnpm --filter @bmad-todo/frontend dev
```

## Testing

### Unit and integration tests

Requires a running PostgreSQL instance (backend tests hit a real database).

```bash
# Run all unit + integration tests
pnpm test

# Frontend only
pnpm test:frontend

# Backend only (requires Postgres)
pnpm test:backend
```

### Code coverage

```bash
# Run all with coverage
pnpm test:coverage

# Frontend only — HTML report at apps/frontend/coverage/
pnpm --filter @bmad-todo/frontend test:coverage

# Backend only — HTML report at apps/backend/coverage/
pnpm --filter @bmad-todo/backend test:coverage
```

Frontend coverage is enforced at 70% minimum for statements, branches, functions, and lines.

### E2E tests

Requires Docker Compose (Playwright starts the full stack automatically).

```bash
pnpm test:e2e
```

E2E tests include axe-core accessibility audits on every major application state.

### Full test suite

```bash
# Unit + integration
pnpm test

# E2E (separate command — requires Docker)
pnpm test:e2e
```

### Test summary

| Layer | Tests | Framework |
|-------|-------|-----------|
| Frontend unit | 54 | Vitest + Testing Library |
| Backend unit + integration | 28 | Node.js test runner + Fastify inject |
| E2E + accessibility | 36+ | Playwright + axe-core |
| **Total** | **118+** | |

## API

Four REST endpoints under `/api/todos`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | List all todos |
| `POST` | `/api/todos` | Create a todo (`{ "text": "..." }`) |
| `PATCH` | `/api/todos/:id` | Toggle completion (`{ "completed": true }`) |
| `DELETE` | `/api/todos/:id` | Delete a todo |

All responses use the envelope format `{ "data": ... }` or `{ "error": { "code", "message" } }`.

Full OpenAPI documentation is available at http://localhost:3000/docs when the backend is running.

## Linting

```bash
pnpm lint        # Check
pnpm lint:fix    # Auto-fix
```

## Available Scripts

| Script | Scope | Description |
|--------|-------|-------------|
| `pnpm test` | All | Run unit + integration tests |
| `pnpm test:coverage` | All | Run tests with coverage reporting |
| `pnpm test:frontend` | Frontend | Frontend unit tests only |
| `pnpm test:backend` | Backend | Backend tests only (requires Postgres) |
| `pnpm test:e2e` | E2E | Playwright tests (requires Docker) |
| `pnpm lint` | All | Lint all packages |
| `pnpm lint:fix` | All | Auto-fix lint issues |

## Documentation

- [AI Integration Log](./ai-integration-log.md) — documents AI agent usage, MCP servers, test generation, debugging, and limitations throughout the project
- [Security Review](./_bmad-output/test-artifacts/security-review.md) — OWASP-based security audit findings
- [QA Report](./_bmad-output/test-artifacts/qa-report.md) — test coverage, accessibility compliance, and quality metrics
- [API Docs](http://localhost:3000/docs) — interactive Swagger UI (requires running backend)
