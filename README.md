# CASHNET

**Evidence-driven multi-chain blockchain investigation and VASP intelligence platform for SIH PS26182/26183.** CASHNET is an investigator-facing TypeScript workspace that preserves a deterministic synthetic demonstration while adding a protected, server-side foundation for authorized Ethereum, Bitcoin, and TRON collection. It records provenance, isolates case data, and separates observed facts from future analytical inference or attribution.

> Current release: **Phase 3 complete with environment-dependent verification pending.** It is not yet a production VASP-attribution, graph-tracing, identity-resolution, or automated enforcement system.

## SIH mapping and current scope

- **PS26182/26183:** case-led financial and blockchain investigation workflows: intake, authorization, evidence, normalized chain facts, audit, and reporting boundaries.
- **Implemented:** synthetic investigator workflow; PostgreSQL persistence, RBAC, case isolation, investigation/evidence/audit records; authorized provider adapters.
- **Planned:** bounded graph tracing, clustering, VASP/entity intelligence, fraud/risk intelligence, PS184, production identity, and institutional integrations.

## Architecture

```text
React investigator UI ── generated React Query client ─┐
                                                        ▼
Legacy /api/* synthetic routes        /api/v1 Express API
  (preserved)                                  │
                                               ▼
                              development authentication + RBAC
                                               │
                                               ▼
                              case authorization + investigation service
                                               │
                                               ▼
                           BlockchainService → ProviderRouter
                                  │       ┌──────┼───────────┐
                                  │       ▼      ▼           ▼
                                  │ Etherscan  Esplora    TronGrid
                                  │     V2      Bitcoin      TRON
                                  ▼
                raw response → normalization → repositories → PostgreSQL
                                                   │
                                                   ▼
                                        evidence/provenance/audit
```

See [docs/architecture-current.md](docs/architecture-current.md) for the full diagrams and [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for status.

## Supported chains and providers

| Chain | Provider | Status | Current facts |
| --- | --- | --- | --- |
| Ethereum | Etherscan V2 | Implemented; live credentials pending | profile, normal/internal transactions, ERC-20 transfers, transaction/block lookup, contract-call metadata where supplied |
| Bitcoin | Blockstream Esplora-compatible endpoint | Implemented; endpoint pending | profile/history, transaction details, vin/vout, fee, confirmation and UTXO semantics |
| TRON | TronGrid | Implemented; live credentials pending | account activity, transaction lookup, TRX fields and TRC-20 transfers |
| BNB Chain, Polygon, Solana | — | Explicitly unsupported placeholders | no fabricated fallback |

## Modules and structure

| Path | Responsibility |
| --- | --- |
| `artifacts/cashnet` | Existing React/TypeScript investigator UI; currently uses legacy synthetic APIs. |
| `artifacts/api-server` | Express API, services, RBAC, adapters, repositories, normalized schemas, and tests. |
| `lib/api-spec` | OpenAPI source and Orval generation configuration. |
| `lib/api-client-react` / `lib/api-zod` | Generated React Query client and Zod contracts. |
| `lib/db` / `database` | Drizzle exports, migration runner, baseline schema, and additive migrations. |
| `docs` | Architecture, decisions, status, provider, and reference-repository records. |

```text
CASHNET/
├── artifacts/                 # UI and Express API applications
├── database/                  # portable baseline + Phase 1–3 migrations
├── docs/                      # architecture and operational documentation
├── lib/                       # OpenAPI, generated contracts, Drizzle package
├── .github/                   # CI and repository templates
├── CASHNET_COMPLETE_PROJECT_HISTORY.txt
└── .env.example
```

The eight reference checkouts are local, ignored `references/` directories. They are not vendored code, packages, or Git submodules.

## Setup

Requirements: Node.js 24, pnpm 11.19.0, and an approved PostgreSQL instance for persistent routes. Docker configuration is not currently provided.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm -r --if-present run test
```

### Synthetic mode

Synthetic mode is the default and needs no database or provider credential.

```bash
cp .env.example .env
pnpm --filter @workspace/api-server run dev
# separately:
pnpm --filter @workspace/cashnet run dev
```

### PostgreSQL and migrations

Set a server-only `DATABASE_URL` for an approved PostgreSQL database, then apply the ledger-backed migrations:

```bash
pnpm --filter @workspace/db run migrate
```

For local v1 testing only, enable `CASHNET_DEV_AUTH_ENABLED=true` outside production and send `X-Cashnet-Dev-Actor` for a seeded development user. This is deliberately disabled in production.

### Authorized provider mode

Only an approved server environment may use `CASHNET_DATA_MODE=authorized`, `ETHERSCAN_API_KEY`, `ETHERSCAN_CHAIN_ID`, `BITCOIN_ESPLORA_BASE_URL`, `TRONGRID_API_KEY`, `TRONGRID_BASE_URL`, `CASHNET_PROVIDER_TIMEOUT_MS`, and `CASHNET_PROVIDER_MAX_RETRIES`. Values are documented in [.env.example](.env.example); provider keys are server-only secrets.

## API

### Legacy `/api/*`

The unchanged synthetic workflow provides dashboard, cases, complaint intake, synthetic analysis/fund-flow, wallets, predictions, interventions, and reports. It is deterministic demo material, not live intelligence.

### Persistent `/api/v1/*`

- `GET /api/v1/health`, `GET /api/v1/version`
- case, investigation, evidence, and case-audit routes
- `POST /api/v1/investigations/:id/collect` for approved, authorized collection
- `GET /api/v1/wallets/:chain/:address`
- `GET /api/v1/transactions/:chain/:txHash`

The v1 boundary never trusts client-supplied roles or case ownership. The OpenAPI source is [lib/api-spec/openapi.yaml](lib/api-spec/openapi.yaml).

## Security and provenance

- Central case authorization combines active roles, permissions, and case memberships. Missing/inaccessible cases return the same non-enumerating `NOT_FOUND` outcome and denial attempts are audited.
- Normalized facts retain source type, provider, source/reference, retrieval time, method, optional confidence, and raw-response reference/data. Facts are not identity, entity, or VASP attribution claims.
- `synthetic` is the default; `authorized` is explicit. Empty/failing/unsupported provider calls never become synthetic substitutions.
- CASHNET does not accept private keys, seed phrases, transaction signing material, or browser-side provider credentials.

## Testing and verification

```bash
pnpm run typecheck
pnpm -r --if-present run test
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server run build
git diff --check
```

Current local results: typecheck, 13 tests, OpenAPI generation, API build, and diff check pass. Clean-PostgreSQL migration execution and live Etherscan/Esplora/TronGrid smoke tests are pending because this workspace has no configured database or provider credentials.

## References, licensing, and roadmap

The eight research/reference checkouts are documented in [docs/reference-repository-analysis.md](docs/reference-repository-analysis.md). No code or datasets were copied into CASHNET. In particular, `manic-startup/chainforensics` is AGPL-3.0 and remains reference-only. Third-party data and provider payloads require independent terms, authorization, and provenance review.

`package.json` declares MIT, but no root `LICENSE` text file is currently present; do not infer rights over third-party references or data from that declaration.

Not implemented: graph traversal/BFS, clustering, VASP/entity attribution, Chainabuse, fraud/risk intelligence, ML/GNN, PS184, production identity, frontend v1 migration, Docker deployment, RLS policy implementation, or live provider validation. The next approved step is **Phase 4: transaction graph and bounded BFS tracing**, after Phase 3 operational validation. Read [docs/backend-roadmap.md](docs/backend-roadmap.md), [docs/current-status-report.md](docs/current-status-report.md), and `CASHNET_COMPLETE_PROJECT_HISTORY.txt` before continuing.
