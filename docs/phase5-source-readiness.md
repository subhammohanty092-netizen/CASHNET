# Phase 5 source readiness

Status terms: the provider implementations are `IMPLEMENTED_PENDING_LIVE_VALIDATION`;
the label source is `DATASET_PENDING_APPROVAL`; no source in this document is
`LIVE_VALIDATED`. External methodology repositories remain `REFERENCE_ONLY` as
recorded in [phase5-tool-integration-matrix.md](phase5-tool-integration-matrix.md).

## Address intelligence: crypto-wallet-address-labels

The checkout is a candidate, not an approved operational dataset. Its repository
contains an MIT licence, but that licence does not establish rights, freshness,
or provenance for every aggregated label. CASHNET will only read a local JSON
array when `CASHNET_DATA_MODE=authorized`, `CASHNET_LABEL_DATASET_APPROVED=true`,
and path, name, version, and licence configuration are all supplied.

Before approval, an operator must record dataset source and upstream terms,
version, retrieval time, integrity hash where appropriate, supported chains,
inclusion/exclusion policy, retention decision, duplicate/conflict policy, and
last-verification/freshness policy. No dataset path, manifest, or approved
record is configured in this environment; status is `DATASET_PENDING_APPROVAL`.

## Provider readiness

Etherscan V2, Esplora-compatible Bitcoin, and TronGrid are server-side adapters
with address validation, timeout, retry, rate-limit handling, normalization,
raw-reference/provenance retention, and transactional persistence paths. No
authorized live configuration was available during this validation, so each is
`IMPLEMENTED_PENDING_LIVE_VALIDATION` rather than live-validated.

## Evaluation readiness

`evaluate-phase5` accepts a governed independent held-out data set. No such
ground truth, with provenance and an independent source from rule development,
has been supplied. Accuracy and false-positive metrics are therefore
`INSUFFICIENT_GROUND_TRUTH`, not zero or an invented percentage.
