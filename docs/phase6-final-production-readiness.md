# Phase 6 corrective readiness record

**Date:** 2026-09-01  
**Scope:** corrective work following `v0.6.0-phase6`; no historical tag was changed.

| Component | Status | Actual evidence | Remaining limitation |
| --- | --- | --- | --- |
| Migration compatibility | IMPLEMENTED_PENDING_DATABASE_VALIDATION | Legacy `risk_indicators` is evolved additively; graph case-insensitive uniqueness is a separate expression index; runner includes the compatibility migration. | A database URL was not available to replay the chain or inspect the ledger. |
| Phase 6 analytics persistence | IMPLEMENTED | Repository port/adapter persists risk runs/indicators/evidence, graph features, community runs, DeFi interactions, MEV candidates, and reports under case/investigation scope. | Requires PostgreSQL integration testing. |
| AML API | OPERATIONALLY_CONNECTED_IN_SOURCE | Bounded `/api/v1/investigations/{id}/risk-analysis` and read routes use authentication, case authorization, service, repository, transaction, and audit. | Runtime PostgreSQL validation pending. |
| Graph/community API | OPERATIONALLY_CONNECTED_IN_SOURCE | Feature/community routes enforce 10,000-edge/node and 5-second limits, persist results, and audit actions. | Runtime PostgreSQL validation pending. |
| DeFi/MEV API | OPERATIONALLY_CONNECTED_IN_SOURCE | Stored-graph-only historical analysis is persisted and audited; it explicitly rejects a real-time mempool claim. | Runtime PostgreSQL validation pending. |
| Reporting API | OPERATIONALLY_CONNECTED_IN_SOURCE | Case-scoped reports preserve facts/assessments/contradictions/provenance disclaimer and audit access. | Runtime PostgreSQL validation pending. |
| JWT/OIDC | IMPLEMENTED_PENDING_INTEGRATION_TEST | RS256/ES256 JWKS key selection and `crypto.subtle.verify` are implemented; production maps verified subject to active CASHNET DB roles. | Generated-key integration tests and a real OIDC deployment configuration remain required. |
| Development authentication | IMPLEMENTED | Development actor header is selected only outside production. | PostgreSQL multi-actor execution pending. |
| HTTP security controls | OPERATIONALLY_CONNECTED_IN_SOURCE | Request ID, headers, CORS allowlist, rate limiting, request-size guard, and structured metrics middleware are registered before routes. | End-to-end HTTP tests and deployment-specific proxy policy remain required. |
| Provider lookup scope | OPERATIONALLY_CONNECTED_IN_SOURCE | Wallet/transaction lookup routes now require an accessible matching investigation and write an audit event. | Provider live validation is credential-dependent. |
| TronGrid resilience | IMPLEMENTED | Transaction lookup now uses the shared timeout/retry/rate-limit HTTP abstraction. | Live validation pending. |
| Solana configuration | IMPLEMENTED | Explicit `SOLANA_RPC_URL` controls configured state; no silent public endpoint default remains. | Approved endpoint/live validation pending. |
| Docker / Compose | IMPLEMENTED_PENDING_CONTAINER_VALIDATION | Entrypoint targets `dist/index.mjs`; PORT and health URLs are consistent; compose requires an untracked development password. | Docker was unavailable in this audit environment. |
| `/healthz`, `/readyz`, `/metrics` | OPERATIONALLY_CONNECTED_IN_SOURCE | Readiness performs a DB probe when configured; metrics contain no request body, credentials, case identifiers, or evidence. | Requires deployment/runtime probe validation. |
| Backup and restore | DOCUMENTED_PENDING_EXECUTION | Use `pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL"` and restore only into an isolated database with `pg_restore --clean --if-exists --no-owner --no-privileges`. Verify ledger, counts, foreign keys, and audit immutability before promotion. | No database URL or PostgreSQL tooling was available to execute a restore. |
| Providers | IMPLEMENTED_PENDING_LIVE_VALIDATION | Ethereum, Esplora, TronGrid, BNB, Polygon and Solana adapters remain source-connected through collection. | No authorised credentials/endpoints were supplied. |
| Dataset / accuracy | DATASET_PENDING_APPROVAL / INSUFFICIENT_GROUND_TRUTH | Approved-dataset boundary and evaluation utilities remain present. | No approved dataset or independent held-out corpus exists in this task. |

## Validation evidence

- `pnpm run typecheck` — PASS.
- `pnpm --filter @workspace/api-server run test` — PASS, 46 passed / 0 failed.
- `pnpm --filter @workspace/api-spec run codegen` — PASS.
- `git diff --check` — PASS.
- API production bundle: blocked in this process by sandbox filesystem access to installed pnpm dependencies. The same build passed before the permission policy changed; this is not treated as current independent build evidence.

## Release decision

`v0.6.0-phase6` remains protected historical history. No corrective release tag has been created. Phase 6 is **CONDITIONAL**, not production-ready, until clean PostgreSQL replay/idempotency, PostgreSQL API integration, generated-key JWT tests, container execution, provider live validation where credentials exist, backup/restore execution, and deployment security tests are completed.
