# Security Review Report

**Project:** BMad Todo
**Date:** 2026-03-18
**Scope:** Full-stack security audit (frontend, backend, database, infrastructure)

---

## Executive Summary

The BMad Todo application demonstrates **solid security fundamentals** for a development-stage project. No critical exploitable vulnerabilities were found. The codebase follows best practices for SQL injection prevention, XSS protection, and input validation. Three medium-priority gaps were identified related to production hardening (HTTP security headers, rate limiting, and Swagger exposure).

**Risk Rating:** LOW (for current development scope)

---

## Findings

### 1. XSS (Cross-Site Scripting)

**Status:** PASS — No vulnerabilities found

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` | Not used anywhere |
| `innerHTML` / `document.write` | Not used |
| `eval()` / `new Function()` | Not used |
| React JSX escaping | Properly used — `{todo.text}` rendered safely |
| `aria-live` regions | Use textContent, not innerHTML |

**Notes:** React's default JSX escaping handles all user-supplied text (todo titles). No raw HTML rendering paths exist.

---

### 2. SQL Injection

**Status:** PASS — All queries use parameterized statements

**File:** `apps/backend/src/db/queries.ts`

All four database operations use `$1`, `$2` parameter placeholders:

```sql
INSERT INTO todos (text) VALUES ($1) RETURNING ...
SELECT id, text, completed, created_at FROM todos ORDER BY created_at ASC
UPDATE todos SET completed = $2 WHERE id = $1 RETURNING ...
DELETE FROM todos WHERE id = $1 RETURNING id
```

**Verification:** Backend unit test (`queries.test.ts:60-75`) explicitly asserts parameterized placeholders are used, preventing future regressions.

---

### 3. Input Validation

**Status:** PASS — Validated at both frontend and backend

**Backend (Fastify JSON Schema):**

| Endpoint | Validation |
|----------|-----------|
| `POST /api/todos` | `text`: string, minLength: 1, maxLength: 500, pattern: `\S` (rejects whitespace-only) |
| `PATCH /api/todos/:id` | `completed`: boolean, `additionalProperties: false` |
| `DELETE /api/todos/:id` | `id`: UUID format enforced |

**Frontend:**
- `add-todo-form.tsx:22-23` — Trims input, rejects empty strings before API call

**Note:** Backend validation is authoritative. Frontend validation is UX-only, which is correct.

---

### 4. CORS Configuration

**Status:** PASS — Properly configured

**File:** `apps/backend/src/server.ts:19-22`

```typescript
await app.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
});
```

- Origin is not `*` (wildcard) — configurable via environment variable
- Methods explicitly whitelisted
- Preflight (OPTIONS) handled

---

### 5. Error Information Leakage

**Status:** PASS — Errors are sanitized

**File:** `apps/backend/src/plugins/error-handler.ts`

- Errors are logged server-side (`request.log.error(error)`)
- Client receives only: `{ error: { code, message } }`
- No stack traces, no internal paths, no database details exposed
- Error codes are generic: `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`
- Integration test (`todo-routes.integration.test.ts:89-92`) verifies no stack trace leakage

---

### 6. Sensitive Data Exposure

**Status:** PASS — .env files are properly gitignored

- `.gitignore` includes `.env` and `.env.*` patterns (lines 3-4)
- `git ls-files` confirms no .env files are tracked in version control
- `.env.example` exists for developer onboarding with placeholder values
- Frontend uses `import.meta.env.VITE_API_BASE_URL` (Vite's secure env system — only `VITE_`-prefixed vars are exposed to client)

---

### 7. Test-Only Endpoints

**Status:** PASS — Properly guarded

**File:** `apps/backend/src/server.ts:47-53`

```typescript
if (process.env.NODE_ENV !== "production") {
  app.delete("/test/reset", async (_request, reply) => { ... });
}
```

The database reset endpoint is conditionally registered only in non-production environments.

---

### 8. HTTP Security Headers

**Status:** FINDING — Not implemented

**Severity:** MEDIUM
**Risk:** Clickjacking, MIME-type sniffing, missing HSTS in production

No security headers middleware is configured:
- No `@fastify/helmet` (or equivalent)
- No Content-Security-Policy
- No X-Frame-Options
- No X-Content-Type-Options: nosniff
- No Strict-Transport-Security
- No Referrer-Policy

**Remediation:**

```bash
pnpm --filter @bmad-todo/backend add @fastify/helmet
```

```typescript
// server.ts
import helmet from "@fastify/helmet";
await app.register(helmet);
```

---

### 9. Rate Limiting

**Status:** FINDING — Not implemented

**Severity:** MEDIUM
**Risk:** API abuse, denial-of-service against the backend/database

No rate limiting on any endpoint. A malicious client could flood `POST /api/todos` to fill the database.

**Remediation:**

```bash
pnpm --filter @bmad-todo/backend add @fastify/rate-limit
```

```typescript
// server.ts
import rateLimit from "@fastify/rate-limit";
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
```

---

### 10. Swagger/OpenAPI Exposure

**Status:** FINDING — Docs accessible in all environments

**Severity:** LOW
**Risk:** API documentation visible in production, aiding reconnaissance

**File:** `apps/backend/src/server.ts:24-35`

Swagger UI is registered unconditionally at `/docs`. Consider restricting to non-production:

```typescript
if (process.env.NODE_ENV !== "production") {
  await app.register(fastifySwagger, { ... });
  await app.register(fastifySwaggerUi, { routePrefix: "/docs" });
}
```

---

### 11. Authentication / Authorization

**Status:** N/A — Not in scope

This is a single-user, public todo app with no auth requirements by design. All endpoints are intentionally public. If multi-user support is added, this becomes a critical area.

---

### 12. Dependency Security

**Status:** PASS — Modern, well-maintained dependencies

| Package | Version | Notes |
|---------|---------|-------|
| fastify | ^5.0.0 | Current major, actively maintained |
| react | ^19.0.0 | Latest major |
| pg | ^8.13.0 | Stable PostgreSQL driver |
| vite | ^6.0.0 | Current major |
| @tanstack/react-query | ^5.60.0 | Current major |

No known vulnerable packages detected. All dependencies are recent releases.

---

## Summary Table

| Category | Status | Severity | Action Required |
|----------|--------|----------|-----------------|
| XSS Prevention | PASS | — | None |
| SQL Injection Prevention | PASS | — | None |
| Input Validation | PASS | — | None |
| CORS Configuration | PASS | — | None |
| Error Sanitization | PASS | — | None |
| Sensitive Data Exposure | PASS | — | None |
| Test Endpoint Guarding | PASS | — | None |
| HTTP Security Headers | FINDING | Medium | Add `@fastify/helmet` |
| Rate Limiting | FINDING | Medium | Add `@fastify/rate-limit` |
| Swagger Exposure | FINDING | Low | Gate behind NODE_ENV |
| Authentication | N/A | — | Not in scope |
| Dependencies | PASS | — | None |

---

## Remediation Priority

1. **Before production deployment:** Add `@fastify/helmet` for security headers
2. **Before production deployment:** Add `@fastify/rate-limit` for API protection
3. **Before production deployment:** Gate Swagger UI behind `NODE_ENV !== "production"`

All three findings are production-hardening items. The application is secure for its current development usage.
