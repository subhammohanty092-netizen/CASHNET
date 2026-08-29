# Phase 5 operational validation roadmap

## Reconciled execution flow

```text
Phase 3 stored provider facts
  → Phase 4 bounded case graph
  → discovered address
  → approved local address-label observation
  → Bitcoin-only cautious cluster inference
  → service-address assessment
  → deterministic evidence fusion
  → VASP/service candidate
  → human review
  → append-only audit and reproducible evaluation
```

The repository matrix supplies the inputs and legal boundaries; the operational-validation brief supplies the quality gate. CASHNET consumes stored facts and never makes the candidate engine rescan a provider.

## Current validation status

| Gate | Status | Evidence |
| --- | --- | --- |
| PostgreSQL migration/persistence | PENDING_VALIDATION | No `DATABASE_URL` or local PostgreSQL runtime is configured. |
| Etherscan V2 / Esplora / TronGrid live read | PENDING_VALIDATION | No authorized provider configuration is present. |
| Approved address-label dataset | PENDING_VALIDATION | Adapter is implemented but no dataset manifest/path/licence approval is configured. |
| Controlled rule/metric regression | IMPLEMENTED | Deterministic tests plus `evaluate-phase5` held-out metric utility. |
| Human review | IMPLEMENTED | `POST /api/v1/investigations/:id/vasp-candidates/:candidateId/review`. |
| Phase 5 production-like quality gate | VALIDATION_INCOMPLETE | Live database/source/ground-truth evidence is required. |

The API production build passed on 2026-08-29 when the project’s existing esbuild command was allowed to resolve its local dependencies outside the sandbox. This does not satisfy the live-data quality gates.

## Required tool and repository status

| Tool / repository | Status | Actual use |
| --- | --- | --- |
| CASHNET Phase 4 graph | IMPLEMENTED | Case-scoped stored relationship input to Phase 5. |
| Etherscan V2 | PENDING_VALIDATION | Existing Phase 3 adapter; no live credentials validated here. |
| Esplora-compatible API | PENDING_VALIDATION | Existing Phase 3 adapter; no approved live endpoint validated here. |
| TronGrid | PENDING_VALIDATION | Existing Phase 3 adapter; no live credentials validated here. |
| `crypto-wallet-address-labels` | PENDING_VALIDATION | Local approved-dataset adapter exists; no dataset was approved/imported. |
| `bitcoin-address-clustering` | IMPLEMENTED | Clean-room common-input/cautious-change methodology only. |
| `am-i-exposed` | REFERENCE_ONLY | Bitcoin tracing methodology. |
| Open-Source-Blockchain-Forensics | REFERENCE_ONLY | Forensic/evidence methodology. |
| `mev-wallet-cluster-analysis` | REFERENCE_ONLY | Ethereum relationship/evidence methodology. |
| Evidencly | REFERENCE_ONLY | Case/evidence workflow methodology. |
| ChainForensics | REFERENCE_ONLY | AGPL-3.0; no code copied. |
| OpenAML | REFERENCE_ONLY | Later AML/risk evaluation concepts. |
| Chainabuse | OPTIONAL | Interface only; no request, data, or dependency. |

## Controlled validation procedure

1. Provision an isolated PostgreSQL database and run the complete migration ledger.
2. Configure one approved read-only provider and collect a public address into an authorized case.
3. Register an approved, versioned local dataset manifest; do not point the adapter at a repository directory.
4. Exercise lookup, cluster, candidate, review, audit, and cross-case denial paths.
5. Keep a held-out ground-truth JSON set outside the source dataset. Run:

```powershell
pnpm --filter @workspace/scripts run evaluate-phase5 <held-out-evaluation.json>
```

6. Record environment, source versions, method versions, retrieval times, and resulting metrics. Do not create a release tag until all quality gates pass.
