# CASHNET project status

**Current phase:** 5 — governed address intelligence and candidate attribution

**Status vocabulary:** `IMPLEMENTED` describes a CASHNET capability;
`OPERATIONALLY_CONNECTED` means its CASHNET runtime path is reachable;
`LIVE_VALIDATED` requires an executed authorized external/database validation;
`PENDING_VALIDATION` identifies an unexecuted gate;
`DATASET_PENDING_APPROVAL` identifies an unapproved intelligence source;
`METHODOLOGY_IMPLEMENTED` identifies a clean-room CASHNET method;
`REFERENCE_ONLY` identifies no runtime import; and
`OPTIONAL_NOT_CONFIGURED` identifies no operational adapter. No external source
is currently `LIVE_VALIDATED`.

## Completed

- Phase 0 reference-repository analysis and decision record.
- Phase 1 modular backend foundations, normalized schemas, error handling, and legacy synthetic preservation.
- Phase 2 PostgreSQL/Drizzle persistence, ordered migration ledger, cases, investigation/wallet subjects, evidence, RBAC, case isolation, and append-only audit events.
- Phase 3 provider contracts/router, Etherscan V2, Esplora-compatible Bitcoin, TronGrid, normalizers, timeout/retry/rate-limit handling, persistence integration, OpenAPI and generated artifacts.
- Phase 4 derived relationship persistence, graph nodes/edges, bounded BFS, direction/time/amount/asset filters, deterministic ranking, evidence linkage, authorization/audit integration, and graph OpenAPI contract.
- Phase 5 approved local-dataset adapter boundary, source metadata/freshness/conflicts, cautious Bitcoin clustering, service assessment, deterministic VASP-candidate evidence fusion, review model, RBAC, audit, APIs, and generated contracts.
- Typecheck, 31 unit/repository/authorization/provider/migration/graph/intelligence regression tests, OpenAPI generation, the API production build (673 ms), and the whitespace diff check in this workspace on 2026-08-30.

## Environment-dependent pending work

- Run migrations against a clean configured PostgreSQL instance.
- Run authorized live Etherscan, Esplora, and TronGrid smoke tests with server-only credentials/endpoints.
- Start and exercise the persistent API against that database.
- Restart the authorized API with the diagnostic repair, reproduce the actor-lookup failure, and repair the exact reported PostgreSQL schema/query mismatch. Then re-run ledger and persistent-route validation from an authorized task-level PostgreSQL connection. The task process has no `DATABASE_URL` to inspect or restart the live database itself.
- Apply and verify the corrected Phase 5 VASP-table evolution. The previous migration collided with the legacy Phase 1 `vasp_candidates` table; see [phase5-migration-fix.md](phase5-migration-fix.md). Live repair is pending a configured local database connection.
- Approve a versioned address-label dataset and validate live providers before calling the Phase 5 runtime pipeline operational. The precise source/runtime audit is in [phase5-tool-integration-matrix.md](phase5-tool-integration-matrix.md).

## Not implemented

- Chainabuse operational integration, fraud intelligence, ML/GNN, PS184, frontend v1 migration, production identity, Docker/deployment configuration, database RLS policies, and a production-approved address-label dataset.

## Supported provider status

| Chain | Provider | Code status | Operational status |
| --- | --- | --- | --- |
| Ethereum | Etherscan V2 | IMPLEMENTED | IMPLEMENTED_PENDING_LIVE_VALIDATION |
| Bitcoin | Esplora-compatible | IMPLEMENTED | IMPLEMENTED_PENDING_LIVE_VALIDATION |
| TRON | TronGrid | IMPLEMENTED | IMPLEMENTED_PENDING_LIVE_VALIDATION |

## Phase 5 source and validation status

| Component | Status |
| --- | --- |
| CASHNET runtime pipeline / Phase 4 graph | OPERATIONALLY_CONNECTED |
| Address intelligence adapter | IMPLEMENTED; source is DATASET_PENDING_APPROVAL |
| Bitcoin clustering | METHODOLOGY_IMPLEMENTED; review-required inference |
| VASP/service candidates | IMPLEMENTED; deterministic lead only |
| Chainabuse | OPTIONAL_NOT_CONFIGURED |
| Live database/provider/dataset validation | PENDING_VALIDATION |
| Independent accuracy / false-positive evaluation | pending approved held-out ground truth |

Phase 6 is not started. ML/GNN and PS184 remain explicitly out of scope.

The authoritative Phase 5 release-gate outcome is
[phase5-final-validation.md](phase5-final-validation.md): `PHASE_5_FINAL_VALIDATION = BLOCKED`.

This file is consistent with [current-status-report.md](current-status-report.md).
