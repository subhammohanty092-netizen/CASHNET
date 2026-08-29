export type PermissionCode =
  | "CASE_CREATE" | "CASE_READ" | "CASE_UPDATE" | "CASE_CLOSE" | "CASE_ASSIGN"
  | "INVESTIGATION_CREATE" | "INVESTIGATION_READ" | "INVESTIGATION_EXECUTE"
  | "EVIDENCE_CREATE" | "EVIDENCE_READ" | "EVIDENCE_EXPORT"
  | "REPORT_READ" | "REPORT_CREATE" | "REPORT_EXPORT" | "AUDIT_READ" | "USER_MANAGE" | "ROLE_MANAGE";

export type Actor = { id: string; username: string; roles: string[]; permissions: PermissionCode[] };
export type CaseStatus = "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "CLOSED" | "ARCHIVED";
export type InvestigationStatus = "CREATED" | "AUTHORIZED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED";
export type CaseRecord = { id: string; caseNumber: string; title: string; description: string; fraudType: string; reportedAmount: string; status: CaseStatus; priority: string; investigationAuthorizationStatus: "PENDING" | "APPROVED" | "REJECTED"; createdBy: string | null; assignedTo: string | null; closedAt: string | null; createdAt: string; updatedAt: string };
export type InvestigationRecord = { id: string; caseId: string; status: InvestigationStatus; chain: string | null; walletAddress: string | null; investigationDepth: number; startTime: string | null; endTime: string | null; createdBy: string | null; createdAt: string; updatedAt: string };
export type WalletSubjectRecord = { id: string; caseId: string; investigationId: string; chain: string; walletAddress: string; label: "REPORTED" | "SUSPECT" | "SUBJECT" | "OBSERVED" | "UNKNOWN"; createdAt: string };
export type EvidenceRecord = { id: string; caseId: string | null; investigationId: string | null; subjectType: string; subjectId: string; evidenceType: string; sourceType: string; provider: string | null; sourceReference: string | null; sourceUrl: string | null; observedAt: string | null; collectedAt: string | null; method: string | null; confidence: number | null; rawReference: string | null; contentHash: string | null; description: string | null; createdBy: string | null; createdAt: string };
export type AuditEventRecord = { id: string; caseId: string | null; actorId: string | null; action: string; resourceType: string; resourceId: string | null; requestId: string | null; result: "SUCCESS" | "DENIED" | "FAILURE"; metadata: Record<string, unknown>; createdAt: string };
export type GraphRelationshipType = "TRANSFER" | "TOKEN_TRANSFER" | "INTERNAL_TRANSFER" | "CONTRACT_INTERACTION" | "UTXO_SPEND";
export type GraphRelationshipRecord = { id: string; caseId: string; chain: string; transactionHash: string; fromAddress: string; toAddress: string; relationshipType: GraphRelationshipType; asset: string; amount: string; tokenContract: string | null; blockNumber: string | null; timestamp: string | null; executionStatus: string | null; derivationSourceType: "API" | "INFERENCE"; provider: string | null; sourceReference: string | null; rawReference: string | null; retrievedAt: string | null; method: string; createdAt: string };
export type GraphRelationshipInput = Omit<GraphRelationshipRecord, "id" | "caseId" | "createdAt">;
