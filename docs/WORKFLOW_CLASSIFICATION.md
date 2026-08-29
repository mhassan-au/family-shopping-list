# Workflow classification

Classify every implementation request before acting and post one short line, for example:

> **Classification:** UI change · Economy mode · Low risk — proceeding with targeted checks.

If approval is required, replace the final phrase with a concise reason and wait. Otherwise proceed without asking.

## Execution modes

### Economy

For isolated, reversible work. Search for affected symbols, inspect only affected files and routed documentation, then run `npx tsc --noEmit` (when TypeScript changed) plus targeted ESLint or tests. Documentation-only changes require Markdown and diff validation, not application tests.

### Standard

For features, connected behavior, scheduling, persistence, or work crossing multiple application boundaries. Inspect the relevant flow and data model, then run `npx tsc --noEmit`, `npx eslint app components hooks lib --no-cache`, and any focused behavioral checks. Run `npm run build` when routing, server/client boundaries, or production behavior is affected.

### Release

For production builds, permissions, native or framework configuration, dependencies, authentication, cloud services, security, billing exposure, or release readiness. Read all routed security/operations material, run TypeScript, full ESLint, `npm run build`, and applicable dependency/configuration/rules audits. Deployment and Firestore Rules publication remain explicit external actions.

## Change routing

| Change type | Default mode | Risk | Required documents | Relevant verification | Approval |
|---|---|---:|---|---|---|
| Bug fix | Economy | Low | `docs/ARCHITECTURE.md` only when the affected flow is unclear; routed domain doc if persistence/security is involved | TypeScript plus targeted ESLint/test; escalate for connected behavior | No, unless escalated by impact |
| UI change | Economy | Low | `docs/ARCHITECTURE.md` only for navigation/composition; use `lib/uiText.ts` for visible copy | TypeScript plus targeted component lint; visual/local check when useful | No |
| New feature | Standard | Medium | `docs/ARCHITECTURE.md`; add `docs/FIREBASE.md` for stored data and `docs/SECURITY.md` for protected/external data | TypeScript, full ESLint, focused behavior checks; build for routes/server boundaries | No, unless it introduces a listed approval trigger |
| Feature change | Standard | Medium | Existing feature section in `docs/ARCHITECTURE.md`; routed Firebase/security docs as applicable | TypeScript, full ESLint, focused regression checks | No, unless materially broader or destructive |
| Scheduling/database or persistence | Standard | Medium | `docs/ARCHITECTURE.md`, `docs/FIREBASE.md`, and relevant `docs/OPERATIONS.md`; add `docs/SECURITY.md` for access changes | TypeScript, full ESLint, build when server behavior changes, rules/data-shape validation | Only for deletion, irreversible migration, new backend/cost, or Release escalation |
| Documentation/copy | Economy | Low | Only the document being changed; `lib/uiText.ts` for application copy | Markdown/diff validation; targeted lint only if code copy changed | No |
| Future idea/brainstorm | Economy | Low | None by default; inspect only enough context to ground suggestions | No code checks | No; ask only when choices materially differ and implementation is requested |
| Release/security/permissions | Release | High | `docs/SECURITY.md`, `docs/FIREBASE.md`, `docs/OPERATIONS.md`, relevant architecture and installed Next.js guide | TypeScript, full ESLint, production build, rules/config/dependency audit, explicit deployment checklist | Yes when triggered from a routine request or when permissions, services, cost, destructive changes, or locked boundaries change |

## Automatic escalation

- UI-only presentation stays Economy.
- UI that changes stored data or business logic becomes Standard.
- Database, migration, scheduling, and persistence work uses Standard.
- Permissions, native manifests, authentication, analytics, cloud services, security dependencies, and store or production releases use Release.
- Any work that can expose credentials, household data, quota, or billing is at least Release/high risk.

## Approval policy

Proceed automatically for clear low- and medium-risk work. Ask before proceeding when:

- A routine request unexpectedly requires Release mode.
- Existing data may be deleted, replaced, or irreversibly migrated.
- A production dependency, permission, backend, recurring service, or recurring cost is introduced.
- Work crosses a locked product or security boundary in `AGENTS.md`.
- The safe implementation is materially broader than requested.
- Multiple product choices have significantly different outcomes.

Do not request approval for ordinary in-scope coding, inspection, or testing.

## Context-saving rules

- Search for affected symbols before opening large files.
- Read only documentation routed by the classification table.
- Do not reread files already read in the same logical task unless they changed.
- Use targeted tests for Economy work.
- Bundle related inspections and checks where practical.
- Keep classification and progress messages concise.

## Project command reference

- Targeted type check: `npx tsc --noEmit`
- Targeted lint: `npx eslint <affected-files> --no-cache`
- Full application lint: `npx eslint app components hooks lib --no-cache`
- Production build: `npm run build`
- Development server: `npm run dev`

The repository has no automated test script. Prefer focused manual/local verification for behavior and do not substitute a production deployment for local checks.
