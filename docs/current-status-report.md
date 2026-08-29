# CASHNET current implementation status — 2026-08-29

## Overall status

Estimated implementation completion is **72%** of the planned CASHNET roadmap. Phases 0–5 are implemented in code: the newest layer adds governed address observations, cautious Bitcoin clustering inference, service/VASP candidate evidence fusion, review records, APIs, RBAC, and audit. Production database deployment, configured provider smoke tests, a dataset-level approval decision, frontend wiring, and later risk intelligence remain.

## Repository integration

`CASHNET` remains the root repository. The eight repositories requested by the project plan are present under `references/` for read-only architectural and data-format study: Open-Source-Blockchain-Forensics, chainforensics, am-i-exposed, evidencly-platform, crypto-wallet-address-labels, bitcoin-address-clustering, mev-wallet-cluster-analysis, and dtcch-2025-OpenAML. No source code was copied into CASHNET. In particular, the AGPL ChainForensics code was not incorporated.

## Backend pipeline

The backend now provides versioned Phase 2–5 API boundaries alongside untouched legacy synthetic `/api/*` routes. Phase 5 consumes stored facts/graph links and an explicitly approved local label source only; it surfaces freshness/conflicts, classifies service leads, and keeps cluster output review-required. It makes no person-identity claim and has no default external intelligence source.

## Working verification

`pnpm run typecheck`, `pnpm -r --if-present run test`, `git diff --check`, and `pnpm --filter @workspace/api-spec run codegen` pass. The 25 tests cover Phase 1–4 regression plus intelligence scoring, conflicts, staleness, CoinJoin-like ambiguity, cautious change inference, migration, and API boundaries. The API build is pending an unrestricted shell because this sandbox prevents esbuild from traversing its required parent path.

## Environment status

No PostgreSQL runtime, `psql`, Docker, Windows PostgreSQL service, `DATABASE_URL`, provider credentials, or approved dataset manifest were available in this workspace. Therefore migration execution against a clean database, live provider smoke tests, and live label-source validation are pending configuration; they were not represented as successful. The implementation remains safe in its default synthetic mode.

## Next action

Provision an approved PostgreSQL database and server-only provider credentials, set `DATABASE_URL`, `CASHNET_DATA_MODE=authorized`, and the selected provider variables, then run `pnpm --filter @workspace/db run migrate` followed by `pnpm --filter @workspace/api-server run dev` and the controlled investigation collection flow.
