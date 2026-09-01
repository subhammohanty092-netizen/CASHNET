# CASHNET current implementation status — 2026-09-01

## Overall status

Phases 0–5 remain historical implementation/release checkpoints. Phase 6 has post-tag corrective work for migration compatibility, persistent analytics, guarded APIs, JWT verification, middleware, observability, and container/runtime configuration. Its authoritative current state is [phase6-final-production-readiness.md](phase6-final-production-readiness.md): it is conditional, not production-ready.

## Repository integration

`CASHNET` remains the root repository. The eight repositories requested by the project plan are present under `references/` for read-only architectural and data-format study: Open-Source-Blockchain-Forensics, chainforensics, am-i-exposed, evidencly-platform, crypto-wallet-address-labels, bitcoin-address-clustering, mev-wallet-cluster-analysis, and dtcch-2025-OpenAML. No source code was copied into CASHNET. In particular, the AGPL ChainForensics code was not incorporated.

## Backend pipeline

The backend now provides versioned Phase 2–5 API boundaries alongside untouched legacy synthetic `/api/*` routes. Phase 5 consumes stored facts/graph links and an explicitly approved local label source only; it surfaces freshness/conflicts, classifies service leads, and keeps cluster output review-required. It makes no person-identity claim and has no default external intelligence source.

## Working verification

The current corrective branch passes TypeScript checking, OpenAPI generation, **54 API/unit tests**, production API build, and `git diff --check`. A local production-mode HTTP probe verified HSTS, CSP, request IDs, CORS allowlisting, safe metrics, and fail-closed readiness without a database configuration.

## Environment status

PostgreSQL 18 is running locally, but this Codex process has no `DATABASE_URL` and therefore cannot safely select a database/user for replay or destructive restore testing. No provider credentials/endpoints, Docker CLI, approved dataset, or independent ground-truth corpus was inherited. These gates remain pending rather than claimed as passed.

## Next action

Provision an approved PostgreSQL database and server-only provider credentials, set `DATABASE_URL`, `CASHNET_DATA_MODE=authorized`, and the selected provider variables, then run `pnpm --filter @workspace/db run migrate` followed by `pnpm --filter @workspace/api-server run dev` and the controlled investigation collection flow.
