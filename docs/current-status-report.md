# CASHNET current implementation status — 2026-08-29

## Overall status

Estimated implementation completion is **58%** of the planned CASHNET roadmap. Foundation, contracts, Phase 1, Phase 2 persistence/RBAC, and the Phase 3 provider pipeline are implemented. Production database deployment, configured provider smoke tests, frontend wiring, graph work, approved external adapter onboarding, and later intelligence phases remain.

## Repository integration

`CASHNET` remains the root repository. The eight repositories requested by the project plan are present under `references/` for read-only architectural and data-format study: Open-Source-Blockchain-Forensics, chainforensics, am-i-exposed, evidencly-platform, crypto-wallet-address-labels, bitcoin-address-clustering, mev-wallet-cluster-analysis, and dtcch-2025-OpenAML. No source code was copied into CASHNET. In particular, the AGPL ChainForensics code was not incorporated.

## Backend pipeline

The backend now provides versioned Phase 2/3 API boundaries alongside untouched legacy synthetic `/api/*` routes. A development actor boundary, persisted roles/permissions, non-enumerating case access, immutable audit records, provider routing, HTTP failure handling, normalizers, repositories, and PostgreSQL transactions form the backend path. Live blockchain results are never fabricated and only run when authorized mode plus the relevant server configuration is present.

## Working verification

`pnpm run typecheck`, `pnpm -r --if-present run test`, `git diff --check`, `pnpm --filter @workspace/api-spec run codegen`, and `pnpm --filter @workspace/api-server run build` pass in this workspace. The provider tests run deterministic mocked Etherscan V2, Esplora, TronGrid, rate-limit, router, and migration-ledger paths. OpenAPI generation completed through the project’s configured Orval workflow.

## Environment status

No PostgreSQL runtime, `psql`, Docker, Windows PostgreSQL service, `DATABASE_URL`, or provider credentials were available in this workspace. Therefore migration execution against a clean database and live provider smoke tests are pending configuration; they were not represented as successful. The API production bundle has been built successfully. The implementation remains safe in its default synthetic mode.

## Next action

Provision an approved PostgreSQL database and server-only provider credentials, set `DATABASE_URL`, `CASHNET_DATA_MODE=authorized`, and the selected provider variables, then run `pnpm --filter @workspace/db run migrate` followed by `pnpm --filter @workspace/api-server run dev` and the controlled investigation collection flow.
