# CASHNET Phase 5 plan — address intelligence, clustering, and VASP attribution

## Status and boundary

**This is a design plan only. No Phase 5 code, data import, provider call, clustering, entity label, VASP result, or Chainabuse integration is implemented by this document.** Phase 4 graph relationships remain evidence-backed blockchain observations or explicitly marked UTXO projections, not ownership claims.

## Goal

```text
Phase 4 graph → discovered address → reviewed address intelligence
  → entity-label evidence → separately-scored cluster evidence
  → exchange/deposit-pattern evidence → VASP candidate
  → evidence fusion → UNKNOWN / POSSIBLE / LIKELY / CONFIRMED
```

The output must never turn an address into a real-world person. It must remain a reviewable candidate with source, retrieval time, method, confidence, contradiction handling, and links to the Phase 4 path evidence.

## Inputs and source governance

| Source | Intended use | Required gate before use |
| --- | --- | --- |
| `crypto-wallet-address-labels` | Public address/entity/VASP label candidate | Dataset-level licence, freshness, provenance, normalization, and conflict review |
| `bitcoin-address-clustering` | Common-input/change/consolidation research | Treat as heuristic methodology; historical-data and false-positive evaluation |
| `mev-wallet-cluster-analysis` | Ethereum relationship and evidence-discipline methodology | Case-study review; no automatic CEX/VASP conclusion |
| Chainabuse | Future public abuse-report evidence | Terms, API authorization, source reliability, retention, and human-review policy |
| `am-i-exposed` | Bitcoin tracing concepts | Methodology only; no direct operational import |
| ChainForensics | UTXO and temporal methodology | **AGPL-3.0 reference only; no source copying without an explicit licence decision** |
| OpenAML | Later governed AML/risk research | Separate model/data/evaluation governance |

No source becomes production truth merely because it is public or present in `references/`. Import jobs must preserve source URL/reference, dataset version, licence, retrieval date, hash, transformation method, and reviewer decision.

## Proposed architecture

1. Define ports such as `AddressIntelligenceProvider`, `ClusterInferenceService`, and `VaspCandidateService`; Phase 4 already reserves empty intelligence-provider interfaces.
2. Store source-labelled observations separately from normalized blockchain facts and derived relationships.
3. Require a case-authorized investigation and `INTELLIGENCE_READ`/`INTELLIGENCE_EXECUTE`-style permissions proposed through a Phase 5 RBAC migration.
4. Produce immutable evidence records and audit each lookup/import/scoring action.
5. Keep a human decision state distinct from an automated confidence score.

## Explainable first algorithms

### Address intelligence

Input: `(chain, address)`. Lookup only approved sources. Output: zero or more source observations with label text, source identity, provenance, confidence, and expiry/freshness status. Exact address matching is not entity verification.

### Bitcoin clustering

Store heuristic outputs as **inferences**, not facts. Common-input and change-address signals must include exclusions for CoinJoin-like structures, ambiguous change outputs, multi-party transactions, and insufficient data. A cluster should have a stable versioned method, member evidence, score, and reviewer status. No direct link from a Bitcoin cluster to a person is allowed.

### VASP candidate scoring

Use deterministic, explainable evidence fusion only: approved public label match, Phase 4 graph proximity, bounded trace path, observed deposit-like behavior, source agreement, and approved abuse-report evidence. Penalize stale, conflicting, ambiguous, or inferred-only evidence. Map the result to `UNKNOWN`, `POSSIBLE`, `LIKELY`, or `CONFIRMED`; `CONFIRMED` must require an explicit institutional evidence policy and human review.

### Deferred algorithms

Community detection, Louvain, Leiden, graph ML, and GNN are explicitly deferred until deterministic evidence, data governance, evaluation datasets, and false-positive controls are established.

## Delivery sequence

1. Licence/provenance and retention decision record.
2. Phase 5 schema, migration ledger entry, repository ports, authorization permissions, and audited import/run model.
3. Read-only approved label-source adapter with fixtures and conflict/freshness handling.
4. Explainable Bitcoin inference model with negative/CoinJoin/ambiguous tests.
5. Deterministic VASP-candidate scorer with evidence links, review state, and export-safe APIs.
6. Integration, case-isolation, migration, source-provenance, false-positive, and regression tests.
7. Only after governance review: operational source onboarding and controlled real-data validation.

## Non-goals

No private-key handling, wallet control, transaction broadcast, real-person attribution, hidden surveillance, unreviewed dataset import, automatic enforcement, ML/GNN, or PS184 belongs in the first Phase 5 release.
