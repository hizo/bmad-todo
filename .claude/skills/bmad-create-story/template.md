# Story {{epic_num}}.{{story_num}}: {{story_title}}

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a {{role}},
I want {{action}},
so that {{benefit}}.

## Acceptance Criteria

1. [Add acceptance criteria from epics/PRD]

## Tasks / Subtasks

- [ ] Task 1 (AC: #)
  - [ ] Subtask 1.1
- [ ] Task 2 (AC: #)
  - [ ] Subtask 2.1

## Dev Notes

- Relevant architecture patterns and constraints
- Source tree components to touch
- Testing standards summary

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### Quality Audits (frontend stories)

<!-- Run these via Chrome DevTools MCP after implementation is functional -->
- [ ] Run Lighthouse a11y audit (`lighthouse_audit`) — must score 100 on accessibility
- [ ] Run performance trace (`performance_start_trace`) — check LCP, CLS, and network dependency insights
- [ ] Fix any regressions before marking story complete

### API Sync (if story modifies backend API)

<!-- Include this task in the story if any backend routes, schemas, or endpoints are added/modified -->
- [ ] Regenerate or update `apps/backend/openapi.yaml` (via @fastify/swagger export or manual edit)
- [ ] Sync updated spec to Postman via MCP: `mcp__postman__updateSpecFile`

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
