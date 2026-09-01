# Backup and restore procedure

This procedure protects investigative data and the append-only audit trail. It is for an authorised operator with PostgreSQL client tooling. It has not been exercised from the current restricted validation environment.

## Backup

1. Supply `DATABASE_URL` only through the operator's secure environment; never place it in a command history, script, ticket, or repository.
2. Run `scripts/backup-cashnet.ps1 -OutputPath <approved-encrypted-location>/cashnet-<utc>.dump`.
3. Retain the generated `.manifest.json` beside the dump. It contains the SHA-256 integrity value, not credentials.
4. Encrypt stored backups, restrict access to the authorised evidence/operations group, and record custody according to the organisation's approved retention schedule.

## Restore drill

1. Create a separately named temporary PostgreSQL database. Do not use `cashnet`.
2. Run `scripts/restore-cashnet.ps1 -BackupPath <dump> -TargetDatabaseUrl <isolated-url> -ConfirmIsolatedTarget`.
3. Verify the migration ledger, foreign keys, selected counts for cases/investigations/facts/relationships/evidence/intelligence/risk/audit, and audit `UPDATE`/`DELETE` rejection.
4. Record the UTC time, operator, backup manifest hash, target, validation result, and any discrepancies in the controlled operations record. Destroy the temporary database under the approved test-data procedure when the drill is complete.

## Recovery objectives

RPO and RTO are organisational policy decisions, not properties demonstrated by source code. Before production, the accountable operator must define and test an approved backup cadence, encryption/key-management policy, off-site replication, retention/deletion schedule, recovery ownership, RPO, and RTO. A successful restore drill is required before claiming restore readiness.

## Safety boundaries

The restore script verifies the manifest when supplied and refuses a target URL that appears to select the primary `cashnet` database. This is a guardrail, not a substitute for peer review of the target or least-privilege database credentials.
