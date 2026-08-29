# CASHNET project status

**Current phase:** 5 — governed address intelligence and candidate attribution

## Completed

- Phase 0 reference-repository analysis and decision record.
- Phase 1 modular backend foundations, normalized schemas, error handling, and legacy synthetic preservation.
- Phase 2 PostgreSQL/Drizzle persistence, ordered migration ledger, cases, investigation/wallet subjects, evidence, RBAC, case isolation, and append-only audit events.
- Phase 3 provider contracts/router, Etherscan V2, Esplora-compatible Bitcoin, TronGrid, normalizers, timeout/retry/rate-limit handling, persistence integration, OpenAPI and generated artifacts.
- Phase 4 derived relationship persistence, graph nodes/edges, bounded BFS, direction/time/amount/asset filters, deterministic ranking, evidence linkage, authorization/audit integration, and graph OpenAPI contract.
- Phase 5 approved local-dataset adapter boundary, source metadata/freshness/conflicts, cautious Bitcoin clustering, service assessment, deterministic VASP-candidate evidence fusion, review model, RBAC, audit, APIs, and generated contracts.
- Typecheck, 25 unit/repository/authorization/provider/migration/graph/intelligence regression tests, and OpenAPI generation in this workspace.

## Environment-dependent pending work

- Run migrations against a clean configured PostgreSQL instance.
- Run authorized live Etherscan, Esplora, and TronGrid smoke tests with server-only credentials/endpoints.
- Start and exercise the persistent API against that database.
- Run migrations and persistent-route validation on a clean configured PostgreSQL database. The API production build passed on 2026-08-29 in the unrestricted local build environment.

## Not implemented

- Chainabuse operational integration, fraud intelligence, ML/GNN, PS184, frontend v1 migration, production identity, Docker/deployment configuration, database RLS policies, and a production-approved address-label dataset.

## Supported provider status

| Chain | Provider | Code status | Operational status |
| --- | --- | --- | --- |
| Ethereum | Etherscan V2 | implemented | credential/smoke test pending |
| Bitcoin | Esplora-compatible | implemented | endpoint/smoke test pending |
| TRON | TronGrid | implemented | credential/smoke test pending |

## Phase 5 source and validation status

| Component | Status |
| --- | --- |
| Address intelligence adapter | implemented; local approved dataset required |
| Bitcoin clustering | implemented as cautious inference; review required |
| VASP/service candidates | implemented; deterministic lead only |
| Chainabuse | optional, not configured |
| Live database/provider/dataset validation | pending environment and source approval |
| Independent accuracy / false-positive evaluation | pending approved held-out ground truth |

Phase 6 is not started. ML/GNN and PS184 remain explicitly out of scope.

This file is consistent with [current-status-report.md](current-status-report.md).
