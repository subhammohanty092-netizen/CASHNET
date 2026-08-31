# CASHNET Phase 5 — Final Validation Report

**Date:** 2026-08-31
**Database:** PostgreSQL 18.6 on localhost:5432 (`cashnet`)
**Runtime:** Node.js 24.11.0 / pnpm / Express / Drizzle ORM

## Validation Results

| # | Gate | Status | Evidence |
|---|---|---|---|
| 1 | PostgreSQL bug root cause | ✅ VERIFIED | Stale server process without DATABASE_URL |
| 2 | Fix applied | ✅ VERIFIED | Rebuild + correct env vars |
| 3 | Regression test | ✅ PASS | Test #32 validates auth wiring |
| 4 | Migration ledger | ✅ PASS | 6/6 migrations, all recorded |
| 5 | Migration idempotency | ✅ PASS | Re-run on existing DB — no changes |
| 6 | Clean DB replay | ✅ PASS | Fresh temp DB, 6/6 applied, 33 tables, 52 FKs, 81 indexes |
| 7 | Clean DB idempotency | ✅ PASS | Re-run on clean DB — ledger unchanged |
| 8 | Schema verification | ✅ PASS | Phase 5 tables, partial index, FKs, indexes all verified |
| 9 | PostgreSQL API E2E | ✅ PASS | Case→investigation→evidence→graph→intelligence full chain |
| 10 | Case membership | ✅ PASS | Creator auto-assigned, supervisor isolated |
| 11 | Case CRUD | ✅ PASS | Create, read, list, status transitions |
| 12 | Investigation lifecycle | ✅ PASS | Create, read, graph query |
| 13 | Collection pipeline | ⏳ IMPLEMENTED | Requires INVESTIGATION_EXECUTE permission + provider credentials |
| 14 | Etherscan V2 | ⏳ IMPLEMENTED_PENDING_LIVE_VALIDATION | No API key configured |
| 15 | Esplora | ⏳ IMPLEMENTED_PENDING_LIVE_VALIDATION | No endpoint configured |
| 16 | TronGrid | ⏳ IMPLEMENTED_PENDING_LIVE_VALIDATION | No API key configured |
| 17 | Label dataset | ⏳ DATASET_PENDING_APPROVAL | Adapter implemented, governance required |
| 18 | Bitcoin clustering | ✅ METHODOLOGY_IMPLEMENTED | Clean-room, verified in tests 25-27 |
| 19 | Service assessment | ✅ PASS | Returns INSUFFICIENT_EVIDENCE correctly |
| 20 | Evidence fusion | ✅ PASS | Tested in unit tests 20-24 |
| 21 | VASP candidate | ✅ PASS | Returns INSUFFICIENT_EVIDENCE correctly |
| 22 | Human review | ✅ IMPLEMENTED | Review endpoint requires authorized reviewer |
| 23 | Audit | ✅ PASS | 8 events for E2E case, UPDATE denied (23514) |
| 24 | RBAC | ✅ PASS | 401/403/404 all correct, dual-role verified |
| 25 | Case isolation | ✅ PASS | Supervisor cannot access investigator's case (404) |
| 26 | Phase 4 regression | ✅ PASS | Graph with depth/direction/max_nodes → 200 |
| 27 | Legacy regression | ✅ PASS | /api/healthz, /api/dashboard, /api/cases → 200 |
| 28 | Security (SQL injection) | ✅ PASS | Parameterized queries, actor injection → 401 |
| 29 | Security (malformed UUID) | ✅ PASS | Returns 400 (was 500 — fixed) |
| 30 | Security (error redaction) | ✅ PASS | No secrets in error responses |
| 31 | Ground truth | ⏳ INSUFFICIENT_GROUND_TRUTH | No independent evaluation corpus |
| 32 | Accuracy | ⏳ INSUFFICIENT_GROUND_TRUTH | Blocked by #31 |
| 33 | Typecheck | ✅ PASS | 4/4 workspace projects |
| 34 | Tests | ✅ PASS | 32/32 |
| 35 | OpenAPI codegen | ✅ PASS | orval v8.23.0 |
| 36 | Build | ✅ PASS | 2.1MB bundle |
| 37 | git diff --check | ✅ PASS | Clean |

## Tool/Repository Matrix

| Repository | Classification | Notes |
|---|---|---|
| Etherscan V2 | IMPLEMENTED_PENDING_LIVE_VALIDATION | Provider adapter complete |
| Esplora | IMPLEMENTED_PENDING_LIVE_VALIDATION | Provider adapter complete |
| TronGrid | IMPLEMENTED_PENDING_LIVE_VALIDATION | Provider adapter complete |
| crypto-wallet-address-labels | DATASET_PENDING_APPROVAL | Governed adapter implemented |
| bitcoin-address-clustering | METHODOLOGY_IMPLEMENTED | Clean-room implementation |
| am-i-exposed | REFERENCE_ONLY | |
| Open-Source-Blockchain-Forensics | REFERENCE_ONLY | |
| mev-wallet-cluster-analysis | REFERENCE_ONLY | |
| Evidencly | REFERENCE_ONLY | |
| ChainForensics | REFERENCE_ONLY (AGPL-3.0, NO CODE COPYING) | |
| OpenAML | REFERENCE_ONLY | |
| Chainabuse | OPTIONAL_NOT_CONFIGURED | |

## Security Defects Found and Fixed

| Defect | Severity | Fix |
|---|---|---|
| Malformed UUID causes 500 INTERNAL_ERROR | Medium | Added Zod UUID validation to cases.ts and investigations.ts route params |
| Stale build process lacks error context | Low | Diagnostic middleware now in dist after rebuild |

## Blocked External Dependencies

1. **Provider credentials** — Etherscan API key, Esplora endpoint, TronGrid API key
2. **Address-label dataset** — Requires governance approval before operational use
3. **Ground-truth corpus** — No independent evaluation dataset available

These are not software defects. They require external resources/approvals.
