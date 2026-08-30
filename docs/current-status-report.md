# CASHNET current implementation status — 2026-08-30

## Overall status

Phases 0–5 are implemented in code: the newest layer adds governed address observations, cautious Bitcoin clustering inference, service/VASP candidate evidence fusion, review records, APIs, RBAC, and audit. Phase 5 is not released: PostgreSQL replay/persistence, provider smoke tests, a dataset-level approval decision, and independent evaluation remain blocked or pending. The authoritative gate is [phase5-final-validation.md](phase5-final-validation.md).

## Repository integration

`CASHNET` remains the root repository. The eight repositories requested by the project plan are present under `references/` for read-only architectural and data-format study: Open-Source-Blockchain-Forensics, chainforensics, am-i-exposed, evidencly-platform, crypto-wallet-address-labels, bitcoin-address-clustering, mev-wallet-cluster-analysis, and dtcch-2025-OpenAML. No source code was copied into CASHNET. In particular, the AGPL ChainForensics code was not incorporated.

## Backend pipeline

The backend now provides versioned Phase 2–5 API boundaries alongside untouched legacy synthetic `/api/*` routes. Phase 5 consumes stored facts/graph links and an explicitly approved local label source only; it surfaces freshness/conflicts, classifies service leads, and keeps cluster output review-required. It makes no person-identity claim and has no default external intelligence source.

## Working verification

`pnpm run typecheck`, `pnpm -r --if-present run test`, `git diff --check`, `pnpm --filter @workspace/api-spec run codegen`, and `pnpm --filter @workspace/api-server run build` pass on 2026-08-30; the build took 673 ms. The 31 tests cover Phase 1–4 regression plus intelligence scoring, candidate-address graph scope, conflicts, staleness, CoinJoin-like ambiguity, cautious change inference, migration/API boundaries, review confirmation policy, held-out metric calculation, cross-platform development-script behavior, and safe logging of unexpected PostgreSQL diagnostics.

## Environment status

PostgreSQL 18.6 and `psql` are installed locally. The reachable port-5000 API reports authorized mode, and its health/version endpoints pass; legacy `/api/healthz` and `/api/dashboard` also return HTTP 200. This task has no `DATABASE_URL` and passwordless `psql` fails with `fe_sendauth: no password supplied`. Authenticated persistent case/investigation reads return sanitized HTTP 500 responses; behavioral isolation places the fault in actor lookup before the requested records are read. On the next authorized restart, the error middleware will preserve the original redacted PostgreSQL diagnostic and query the database name/user/server identity through the same singleton Drizzle executor. Migration execution, ledger/schema inspection, clean replay, provider smoke tests, and live label-source validation remain blocked or pending and are not represented as successful.

## Next action

Provision an approved PostgreSQL database and server-only provider credentials, set `DATABASE_URL`, `CASHNET_DATA_MODE=authorized`, and the selected provider variables, then run `pnpm --filter @workspace/db run migrate` followed by `pnpm --filter @workspace/api-server run dev` and the controlled investigation collection flow.
