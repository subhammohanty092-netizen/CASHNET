# CASHNET project status

**Current phase:** 4 — bounded graph tracing

## Completed

- Phase 0 reference-repository analysis and decision record.
- Phase 1 modular backend foundations, normalized schemas, error handling, and legacy synthetic preservation.
- Phase 2 PostgreSQL/Drizzle persistence, ordered migration ledger, cases, investigation/wallet subjects, evidence, RBAC, case isolation, and append-only audit events.
- Phase 3 provider contracts/router, Etherscan V2, Esplora-compatible Bitcoin, TronGrid, normalizers, timeout/retry/rate-limit handling, persistence integration, OpenAPI and generated artifacts.
- Phase 4 derived relationship persistence, graph nodes/edges, bounded BFS, direction/time/amount/asset filters, deterministic ranking, evidence linkage, authorization/audit integration, and graph OpenAPI contract.
- Typecheck, 13 unit/repository/authorization/provider/migration regression tests, OpenAPI generation, API production build, and diff check in this workspace.

## Environment-dependent pending work

- Run migrations against a clean configured PostgreSQL instance.
- Run authorized live Etherscan, Esplora, and TronGrid smoke tests with server-only credentials/endpoints.
- Start and exercise the persistent API against that database.

## Not implemented

- Clustering, VASP attribution, Chainabuse, address/entity intelligence, fraud intelligence, ML/GNN, PS184, frontend v1 migration, production identity, Docker/deployment configuration, and database RLS policies.

## Supported provider status

| Chain | Provider | Code status | Operational status |
| --- | --- | --- | --- |
| Ethereum | Etherscan V2 | implemented | credential/smoke test pending |
| Bitcoin | Esplora-compatible | implemented | endpoint/smoke test pending |
| TRON | TronGrid | implemented | credential/smoke test pending |

## Next phase

**Phase 5 — address/entity intelligence and clustering research.** It requires a separate licensing/provenance decision and is not started by Phase 4.

This file is consistent with [current-status-report.md](current-status-report.md).
