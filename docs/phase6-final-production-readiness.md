# Phase 6 corrective readiness record

**Date:** 2026-09-01  
**Scope:** corrective work following `v0.6.0-phase6`; no historical tag was changed. Classifications separate source implementation from executable operational evidence.

## Current decision

- `PHASE_6_IMPLEMENTATION = COMPLETE` — the corrective source work, API contracts,
  persistence interfaces, security controls, backup/restore tooling, and regression
  coverage are present and pass the local software validation suite.
- `PHASE_6_OPERATIONAL_VALIDATION = CONDITIONAL` — the running authorised API was
  exercised against PostgreSQL for AML, graph features, communities and historical
  DeFi/MEV analysis. This Codex process still does not inherit the connection string
  or PostgreSQL client needed for direct replay, schema inspection and restore.
- `PHASE_6_PRODUCTION_READINESS = BLOCKED` — production readiness requires evidence
  from clean PostgreSQL replay and persistence flows, audit-trigger immutability,
  backup/restore, container execution, CI, deployment probes, and authorised provider
  validation where configured.
- `PHASE_7 = NOT_STARTED`.

| Component | Status | Actual execution evidence | Remaining limitation |
| --- | --- | --- | --- |
| Migration chain and ledger | IMPLEMENTED_PENDING_DATABASE_VALIDATION | The runner registers every Phase 6 migration, including the additive chain-provenance and case-authorisation repairs; regression coverage verifies the legacy-table evolution and expression-index design. | This process cannot run the direct migration runner because it has no inherited `DATABASE_URL` or PostgreSQL client. |
| PostgreSQL persistence | OPERATIONALLY_CONNECTED | The authorised running API returned real persisted AML run/feature/community records for case `P5-VALID-001`; each carried case/investigation scope and method version. | Direct schema, ledger and transaction inspection remain pending. |
| AML / risk API | OPERATIONALLY_CONNECTED | `POST /api/v1/investigations/{id}/risk-analysis` returned a persisted completed run with zero indicators, explicit `HEURISTIC_SCORE_NOT_PROBABILITY`, and no fabricated finding. | Direct audit/row inspection and a non-empty stored-fact scenario remain pending. |
| Graph / community API | OPERATIONALLY_CONNECTED | Bounded HTTP runs persisted six zero-value graph features and a zero-node community run against the controlled empty graph. | The test exposed empty feature-chain provenance in the running pre-fix process; an additive repair migration and regression test were added, but must be applied/retested. |
| Bitcoin clustering | METHODOLOGY_IMPLEMENTED | Existing clean-room, conservative inference remains Bitcoin-specific and review-required. | No new live Bitcoin collection was available in this task. |
| DeFi / MEV API | OPERATIONALLY_CONNECTED | The authorised API completed a stored-fact analysis with zero interactions/candidates and explicitly returned `historicalOnly: true`. | It does not implement real-time mempool monitoring; non-empty persisted-fact validation is pending. |
| Evaluation / calibration | IMPLEMENTED / INSUFFICIENT_GROUND_TRUTH | Metrics, calibration and false-positive utilities are covered by unit tests without treating heuristic scores as probabilities. | No independent held-out corpus was supplied; no accuracy figures are claimed. |
| Reporting API | OPERATIONALLY_CONNECTED_WITH_RBAC_DENIAL | The route correctly denied the investigator with HTTP 403 because report generation is a separate least-privilege permission. | A legitimate case-member supervisor/admin actor was not available to demonstrate successful generation. |
| Bitcoin / Esplora | IMPLEMENTED_PENDING_LIVE_VALIDATION | Adapter, validation, normalisation and provider routing are covered by tests. | No approved endpoint/configuration was available for read-only collection. |
| Ethereum / Etherscan V2 | IMPLEMENTED_PENDING_LIVE_VALIDATION | Adapter and provider error handling are covered by tests. | No credential was available for read-only validation. |
| TRON / TronGrid | IMPLEMENTED_PENDING_LIVE_VALIDATION | Regression test proves transaction lookup uses the shared resilience client. | No credential was available for read-only validation. |
| BNB Chain / Polygon | IMPLEMENTED_PENDING_LIVE_VALIDATION | EVM-compatible provider paths are registered in the six-chain router. | Endpoint semantics and live collection were not independently executed. |
| Solana | IMPLEMENTED_PENDING_LIVE_VALIDATION | `SOLANA_RPC_URL` is explicit; no public default is treated as production configuration. | No approved RPC endpoint was configured. |
| Address-label dataset | DATASET_PENDING_APPROVAL | The governed approved-dataset boundary remains in place. | No approved manifest, terms, integrity record, freshness policy or operator approval was supplied. |
| JWT / OIDC | IMPLEMENTED | Generated-key regression test proves valid RS256 verification and rejection of altered signatures; production maps only a verified subject to CASHNET database roles. | A deployed OIDC issuer/JWKS rotation exercise remains pending. |
| RBAC / case isolation | OPERATIONALLY_CONNECTED | A non-member supervisor received a non-enumerating HTTP 404 for the known case; direct provider lookup rejected absent investigation scope and a chain mismatch with HTTP 400. | Legitimate supervisor membership assignment requires its database UUID through the protected CaseService path and remains to be exercised. |
| HTTP security | OPERATIONALLY_CONNECTED | The actual Express app passed HTTP tests for request ID propagation, security headers, origin rejection, body-size rejection and rate limiting. | Reverse-proxy/TLS policy requires deployment validation. |
| Audit and provenance | OPERATIONALLY_CONNECTED_IN_SOURCE | Services emit append-only audit events and retain method, source and provenance fields. | Audit-trigger immutability must be exercised against PostgreSQL. |
| Docker / Compose | IMPLEMENTED_PENDING_CONTAINER_VALIDATION | Docker entry point, non-root runtime, port and health paths were corrected in source. | Docker CLI/daemon was unavailable; no image/compose run is claimed. |
| CI/CD | IMPLEMENTED_PENDING_EXTERNAL_EXECUTION | Workflow source exists. | No GitHub Actions execution was available in this task. |
| Observability | OPERATIONALLY_CONNECTED | The authorised API returned `/api/v1/health` 200 (`authorized`), `/api/v1/version` 200, `/api/readyz` 200 with `database: ok`, and Prometheus-style `/api/metrics` 200. The prior isolated production probe also verified HSTS/CSP/CORS/request-ID behavior. | Deployment scrape and secret-content inspection of a long-running metric stream remain pending. |
| Backup / restore | IMPLEMENTED_PENDING_EXECUTION | Guarded PowerShell scripts and a drill procedure exist in [backup-restore.md](backup-restore.md). | No database URL or `pg_dump`/`pg_restore` client was available for a real drill. |
| Performance / bounds | IMPLEMENTED_PENDING_MEASUREMENT | Graph/community limits and repository SQL result limits are implemented and regression tested. | No representative database workload was available for measurement. |

## Validation evidence

- `pnpm run typecheck` — PASS in this corrective branch.
- `pnpm --filter @workspace/api-server run test` — PASS, **56 tests / 0 failed**: actual Express security middleware, production readiness fail-closed behavior, JWT signature rejection, Solana configuration, TronGrid resilience, migration compatibility, provider scope contract, graph-chain provenance and case-approval permission separation.
- `pnpm --filter @workspace/api-spec run codegen` — PASS after the Phase 6 contract was added.
- `pnpm run typecheck` — PASS.
- `pnpm --filter @workspace/api-server run build` — PASS (production bundle built in 577 ms).
- `git diff --check` — PASS.
- Local production HTTP probe — PASS for HSTS, CSP, X-Request-ID, CORS allowlist and safe metrics; `/api/readyz` correctly failed closed with HTTP 503 when this Codex process had no `DATABASE_URL`.
- Authorised runtime HTTP E2E — PASS for case/investigation reads, AML, graph features, communities, historical DeFi/MEV, readiness and metrics. Controlled empty inputs produced zero findings rather than fabricated intelligence.

## Final component distinctions

| Component | Status | Actual execution evidence | Remaining limitation |
| --- | --- | --- | --- |
| Community detection | OPERATIONALLY_CONNECTED_IN_SOURCE | Bounded persisted route and unit coverage are present. | PostgreSQL route execution remains unavailable to this process. |
| BNB Chain | IMPLEMENTED_PENDING_LIVE_VALIDATION | Six-chain router test passed. | No approved endpoint/credential was inherited. |
| Polygon | IMPLEMENTED_PENDING_LIVE_VALIDATION | Six-chain router test passed. | No approved endpoint/credential was inherited. |
| OIDC deployment | IMPLEMENTED_PENDING_EXTERNAL_VALIDATION | JWT verifier performs JWKS `kid` lookup and cryptographic verification in source/tests. | No issuer/JWKS deployment exercise was available. |
| Compose | IMPLEMENTED_PENDING_CONTAINER_VALIDATION | Compose source was reviewed with corrected API entry point and health paths. | Docker CLI/daemon is unavailable. |
| CI/CD | IMPLEMENTED_PENDING_EXTERNAL_EXECUTION | Workflow declares migration replay/idempotency, tests, build, audit and container scan. | No GitHub Actions run was triggered or inspected. |
| Audit immutability | IMPLEMENTED_PENDING_DATABASE_VALIDATION | Migration/trigger source and service audit calls are present. | `UPDATE`/`DELETE` rejection could not be attempted without the configured database connection. |
| Provenance | OPERATIONALLY_CONNECTED_IN_SOURCE | Provider/analytical repositories persist method/version/source fields; regression tests cover normalisation. | Real provider-to-PostgreSQL path remains pending. |
| Tests | PASS | Full workspace API suite: 54 passed, 0 failed. | PostgreSQL integration suite requires the missing inherited connection environment. |
| Build | PASS | API production bundle built successfully. | Container build is separately pending. |

## Release decision

`v0.6.0-phase6` remains a protected historical checkpoint. No corrective release tag has been created. Phase 6 cannot be called production-ready until clean PostgreSQL replay/idempotency and real persistence flows, audit-trigger exercise, container execution, provider validation where authorised configuration exists, backup/restore drill, CI run, deployment probes, and representative performance measurement have actual evidence. Phase 7 remains **NOT_STARTED**.
