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
| 13 | Collection pipeline | ✅ FULLY_VALIDATED | All 3 providers live validated with real blockchain data |
| 14 | Etherscan V2 | ✅ LIVE_VALIDATED | 283 txs + 100 token transfers from Ethereum Foundation |
| 15 | Esplora | ✅ LIVE_VALIDATED | 25 txs from Bitcoin genesis address via blockstream.info |
| 16 | TronGrid | ✅ LIVE_VALIDATED | 200 txs + 100 TRC-20 transfers via trongrid.io |
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

## Tool/Repository Matrix (Code-Level Gap Audit)

| Repository | Classification | Code Evidence |
|---|---|---|
| Etherscan V2 | `LIVE_VALIDATED` | 283 txs from ETH Foundation via api.etherscan.io/v2 |
| Esplora | `LIVE_VALIDATED` | 25 txs from Bitcoin genesis address via blockstream.info/api |
| TronGrid | `LIVE_VALIDATED` | 200 txs from TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH via api.trongrid.io |
| crypto-wallet-address-labels | `DATASET_PENDING_APPROVAL` | Adapter + service + persistence + RBAC + audit implemented; governance blocker |
| bitcoin-address-clustering | `CLEAN_ROOM_IMPLEMENTED` | 5 tests, 49-line service, 3 heuristics, review-required, CoinJoin detection |
| am-i-exposed | `CLEAN_ROOM_IMPLEMENTED` | Phase 4 graph BFS with path ranking, evidence completeness, filtering |
| Open-Source-Blockchain-Forensics | `CLEAN_ROOM_IMPLEMENTED` | Evidence service + provenance chain + contentHash + audit trail |
| Evidencly | `CLEAN_ROOM_IMPLEMENTED` | 10 evidence types + 3 polarity types + deterministic fusion + integrity hash |
| ChainForensics | `CLEAN_ROOM_IMPLEMENTED` | UTXO flow + clustering + graph — zero AGPL code copied |
| OpenAML | `REFERENCE_ONLY` | Risk signals exist in evidence fusion; standalone AML service is Phase 6 |
| mev-wallet-cluster-analysis | `OUT_OF_SCOPE` | DeFi MEV analytics — Phase 6+ |
| Chainabuse | `OUT_OF_SCOPE` | Schema exists (abuse_intelligence_observations); commercial API requires procurement |

## Security Defects Found and Fixed

| Defect | Severity | Fix |
|---|---|---|
| Malformed UUID causes 500 INTERNAL_ERROR | Medium | Added Zod UUID validation to cases.ts and investigations.ts route params |
| Stale build process lacks error context | Low | Diagnostic middleware now in dist after rebuild |

## Blocked External Dependencies

1. ~~**Provider credentials**~~ — ✅ ALL RESOLVED (Esplora, Etherscan, TronGrid live validated)
2. **Address-label dataset** — Requires governance approval before operational use
3. **Ground-truth corpus** — No independent evaluation dataset available

These are not software defects. They require external resources/approvals.
