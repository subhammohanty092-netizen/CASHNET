# CASHNET current architecture — Phase 4

This is the implemented Phase 4 architecture. It preserves Phase 3 collection and adds bounded graph tracing over stored facts only; attribution remains deferred.

## 1. Overall system

```text
                         ┌────────────────────────────────────┐
                         │ artifacts/cashnet React investigator│
                         │ legacy synthetic UI workflow        │
                         └──────────────┬─────────────────────┘
                                        │ generated client
                    ┌───────────────────▼───────────────────────┐
                    │ Express API                               │
                    │ /api legacy     │ /api/v1 persistent      │
                    └────────┬────────┴─────────────┬───────────┘
                             │                      │
                    synthetic case service   actor/RBAC/case gate
                             │                      │
                             ▼                      ▼
                    deterministic fixtures   investigation services
                                                     │
                                                     ▼
                                             provider router
                                      ┌────────┼────────┐
                                      ▼        ▼        ▼
                                  Etherscan  Esplora  TronGrid
                                      │        │        │
                                      └────────┴────────┘
                                               │ raw facts
                                               ▼
                                 normalizers → repositories → PostgreSQL
                                                        │
                                                        ▼
                            derived graph relationships → bounded BFS
                                                        │
                                                        ▼
                                            provenance/evidence/audit
```

## 2. API and authorization flow

```text
request → pino request ID/log redaction → route validation
        → development actor authentication (v1 only)
        → role permission check → case-membership scoped lookup
        → service → repository transaction → response

No active/authorized actor, disabled development auth, or missing actor
  → standardized authentication/unavailable error.
Insufficient permission → 403 and audit event.
Missing or inaccessible case → 404 and denied-access audit event.
```

## 3. Database flow

```text
database/schema.sql
        │
        ├── 20260827_phase1_foundation.sql
        ├── 20260828_phase2_persistence_rbac.sql
        └── 20260829_phase3_provider_persistence.sql
                    │
                    ▼
         cashnet_schema_migrations ledger
                    │
                    ▼
   Drizzle/pg transaction → PostgreSQL repositories
                    │
  cases/users/roles/case_memberships/investigations/wallet_subjects
                    │
  wallets/transactions/inputs/outputs/transfers/interactions/evidence/audit
```

## 4. Provider flow

```text
BlockchainService or BlockchainCollectionService
                    │
                    ▼
             ProviderRouter
                    │ CASHNET_DATA_MODE must be authorized
        ┌───────────┼────────────┐
        ▼           ▼            ▼
  Ethereum adapter  Bitcoin      TRON adapter
  Etherscan V2      Esplora      TronGrid
        │           │            │
        └────────── ProviderHttpClient ─────────┘
                    │ timeout/retry/backoff/429 handling
                    ▼
       raw payload → normalizer → typed provider result
```

Unsupported chains and unsupported capabilities are explicit typed outcomes. Synthetic mode does not silently select a live provider.

## 5. Ethereum pipeline

```text
authorized investigation
 → EtherscanEthereumProvider
 → account balance / txlist / tokentx / txlistinternal / proxy lookups
 → EVM normalizer
 → normalized transaction, transfer, interaction and provenance
 → atomic wallet/transaction child-record persistence
 → collection audit event
```

## 6. Bitcoin pipeline

```text
authorized investigation
 → EsploraBitcoinProvider
 → address profile/history or transaction lookup
 → Bitcoin normalizer
 → txid, vin(previous outpoint), vout, fee, confirmation/block fields
 → atomic persistence of wallet, transaction, inputs and outputs
 → collection audit event
```

Bitcoin facts retain UTXO semantics; they are not flattened into an account-only model.

## 7. TRON pipeline

```text
authorized investigation
 → TronGridProvider
 → account activity / transaction / TRC-20 history
 → TRON normalizer
 → transaction and token-transfer records with provenance
 → atomic persistence and collection audit event
```

## 8. Evidence and provenance flow

```text
provider raw payload
 → provider/source/reference/retrieved-at/method/raw-reference
 → normalized fact (API source type)
 → case-scoped persistence
 → audit event

Observed blockchain fact ≠ analytical inference ≠ entity label ≠ VASP candidate ≠ real-world identity.
```

## 9. Graph tracing flow

```text
stored normalized facts → deterministic relationship extractor
                       → investigation_graph_relationships (derived)
                       → case-authorized bounded BFS → evidence-backed graph response
```

The graph service never calls external providers. It supports direction, time, exact-decimal amount and asset filters, reports limits/truncation, and keeps Bitcoin UTXO projections explicitly inferred.
