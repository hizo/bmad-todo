---
name: Postman API sync setup
description: Postman workspace/spec/collection IDs and MCP sync approach for keeping API docs in sync during development
type: project
---

Postman MCP is configured to sync the OpenAPI spec whenever backend API changes.

**Why:** API documentation must stay current with implementation. Postman collection is the source of truth for API testing.

**How to apply:** When a story modifies backend routes/schemas, the dev should regenerate `apps/backend/openapi.yaml` and sync via `mcp__postman__updateSpecFile`. The story template now includes an "API Sync" section as a reminder. Only applies to stories that touch the backend API.

**IDs (from prior setup):**
- Workspace: `ba2dc389-9807-4c65-baa5-4de2c22c542a`
- Spec: `f2c94d38-22e1-42c3-8a77-07a290aa4dd1`
- Collection: `219516-5ae91c4e-bab8-443e-bb9b-14d96f805d70`
- Source file: `apps/backend/openapi.yaml`
