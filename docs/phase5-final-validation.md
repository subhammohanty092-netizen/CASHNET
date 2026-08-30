# Phase 5 final validation — authoritative current state

**Current phase:** 5 — implemented, release validation blocked.  
**Phase 6:** not started.  
**Release tag:** `v0.5.0-phase5` not created.

## Validation gate

| Gate | Status | Actual result |
| --- | --- | --- |
| Existing PostgreSQL migration | BLOCKED | The user reports a successful local migration, but this task process has no `DATABASE_URL` or `pgpass`; an independent passwordless `psql` check fails with `fe_sendauth: no password supplied`. The migration cannot be re-executed or its ledger inspected from this task. |
| Existing migration idempotency / ledger | BLOCKED | Requires the same PostgreSQL connection. |
| Clean database replay / idempotency | BLOCKED | Requires a separate authorized PostgreSQL database connection. |
| Phase 5 schema catalog inspection | BLOCKED | Requires PostgreSQL access. |
| Legacy VASP preservation / partial-index compatibility | IMPLEMENTED | Additive SQL and matching repository conflict predicate have deterministic regression coverage. |
| Persistent API startup / health | PASS | The existing `http://127.0.0.1:5000` process returned `{"status":"ok","dataMode":"authorized"}` and version `{"apiVersion":"v1","dataMode":"authorized"}`. |
| PostgreSQL-backed API/persistence/review/audit flow | BLOCKED | Authenticated reads return sanitized HTTP 500. An unauthenticated read returns HTTP 401, while an unknown actor returns 500: this isolates the live failure to `DevelopmentActorAuthenticator → PostgresUserRepository.findActorByUsername` before case/investigation mapping. The running process must be restarted with the diagnostic repair to capture its exact PostgreSQL code safely. |
| Etherscan / Esplora / TronGrid live read | PENDING_VALIDATION | No authorized provider configuration is present. |
| Approved label dataset execution | DATASET_PENDING_APPROVAL | No approved source manifest/path/licence is configured. |
| Bitcoin clustering / service assessment / evidence fusion | IMPLEMENTED | Deterministic clean-room tests preserve UNKNOWN and review-required behavior. |
| RBAC, case isolation, audit, Phase 4 and legacy `/api/*` regression | IMPLEMENTED | Covered by the 30-test workspace suite. |
| Independent accuracy / false-positive analysis | INSUFFICIENT_GROUND_TRUTH | No independent, governed held-out corpus is available. |
| Typecheck, tests, OpenAPI generation, API bundle, diff check | PASS | On 2026-08-30: typecheck passed; 31/31 tests passed; code generation passed; the elevated local API bundle build passed in 673 ms; and the whitespace diff check passed. |
| Legacy `/api/*` regression / local performance | PASS (bounded) | `GET /api/healthz` and `GET /api/dashboard` returned HTTP 200. Twenty local v1-health requests took 155.56 ms total. This is not a production throughput claim. |
| Dependency advisory query | BLOCKED | `pnpm audit --prod --offline` attempted the npm advisory bulk endpoint and failed with `EACCES`; no advisory result is claimed. |
| Documentation and tool/repository classification | PASS | Current documentation uses the approved status taxonomy. |

`PHASE_5_FINAL_VALIDATION = BLOCKED`.

## Runtime diagnostic repair

The error middleware previously replaced an unknown server exception with a
new generic `AppError` *before* logging it. This prevented the PostgreSQL
`code` and relation diagnostics needed to repair the failing actor lookup.
It now logs a redacted server-only diagnostic (error type, PostgreSQL code and
schema/table/column/constraint when present) while retaining the same generic
client response. For an unexpected error it also runs `SELECT
current_database(), current_user, inet_server_addr(), inet_server_port(),
version()` through the same singleton `CashnetDatabase` Drizzle executor used
by the repository. The focused regression test verifies that a PostgreSQL-style
error preserves `42703` and column context while redacting a password value.

This is an observability repair, not a claim that the as-yet-unseen live
PostgreSQL error has been resolved. The port-5000 process predates this build
and cannot be restarted by this task without its authorized connection
environment.

## Release decision

`PHASE_5_RELEASE_COMMIT = NOT_CREATED`, `V0.5.0_PHASE5 = NOT_CREATED`, and
`GITHUB_PUBLICATION = BLOCKED`. Creating or publishing either release artifact
would overstate unexecuted database and external validation. Publication was not
attempted because the required release commit and tag do not exist.
The historical `v0.3.0-phase3` and `v0.4.0-phase4` tags remain unchanged.

## Tool/repository status

- CASHNET and its bounded Phase 4 graph are `OPERATIONALLY_CONNECTED`.
- Etherscan V2, Esplora-compatible Bitcoin, and TronGrid are
  `IMPLEMENTED_PENDING_LIVE_VALIDATION`.
- `crypto-wallet-address-labels` is `DATASET_PENDING_APPROVAL`.
- CASHNET's clean-room Bitcoin clustering is `METHODOLOGY_IMPLEMENTED`; the
  external repository is `REFERENCE_ONLY`.
- am-i-exposed, Open-Source-Blockchain-Forensics, mev-wallet-cluster-analysis,
  Evidencly, ChainForensics, and OpenAML are `REFERENCE_ONLY`.
- Chainabuse is `OPTIONAL_NOT_CONFIGURED`.

See [phase5-tool-integration-matrix.md](phase5-tool-integration-matrix.md) for
the source-to-service-to-persistence traceability matrix.
