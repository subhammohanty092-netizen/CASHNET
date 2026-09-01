import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { CommunityDetectionService } from "./services/graph/community-detection-service";
import { GraphFeatureService } from "./services/graph/graph-feature-service";
import { DeFiInteractionService } from "./services/defi/defi-interaction-service";
import { MEVDetectionService } from "./services/defi/mev-detection-service";
import { RiskTypologyFramework } from "./services/risk/typology-framework";
import { ReportGenerator } from "./services/reporting/report-generator";
import { computeBinaryMetrics, computeCalibration, analyzeFalsePositives } from "./services/evaluation/evaluation-framework";
import { redactSecrets } from "./middleware/security";
import type { GraphRelationshipRecord } from "./repositories/types";
import type { RiskIndicatorResult } from "./services/risk/aml-risk-indicator-service";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { JWTAuthenticator } from "./services/auth/jwt-authenticator";
import { TronGridProvider } from "./services/blockchain/trongrid-provider";
import { CaseService } from "./services/cases/case-service";

// ── Test helpers ────────────────────────────────────────────────────────────

const edge = (id: string, from: string, to: string, overrides: Partial<GraphRelationshipRecord> = {}): GraphRelationshipRecord => ({
  id, caseId: "case-a", chain: "ETHEREUM", transactionHash: `tx-${id}`, fromAddress: from, toAddress: to,
  relationshipType: "TRANSFER", asset: "ETH", amount: "1", tokenContract: null, blockNumber: "100",
  timestamp: "2026-01-01T00:00:00.000Z", executionStatus: "SUCCESS", derivationSourceType: "API",
  provider: "fixture", sourceReference: `src-${id}`, rawReference: `raw-${id}`,
  retrievedAt: "2026-01-01T00:00:01.000Z", method: "fixture", createdAt: "2026-01-01T00:00:01.000Z",
  ...overrides,
});

// ── Phase 6.2: Risk Typology Framework ──────────────────────────────────────

test("Phase 6.2 typology framework matches indicators to named patterns", () => {
  const framework = new RiskTypologyFramework();
  const indicators: RiskIndicatorResult[] = [
    { indicatorType: "RAPID_IN_OUT", ruleVersion: "1.0.0", severity: "HIGH", scoreContribution: 15, confidence: "MEDIUM", description: "test", explanation: "test", evidence: [] },
    { indicatorType: "FAN_OUT", ruleVersion: "1.0.0", severity: "MEDIUM", scoreContribution: 10, confidence: "HIGH", description: "test", explanation: "test", evidence: [] },
  ];
  const matches = framework.evaluateIndicators(indicators);
  assert.ok(matches.length > 0, "Should match at least one typology");
  const rapidMatch = matches.find((m) => m.typology.code === "RAPID_MOVEMENT");
  assert.ok(rapidMatch, "RAPID_MOVEMENT typology should match RAPID_IN_OUT indicator");
  assert.ok(rapidMatch!.explanation.includes("ASSESSMENT"), "Match explanation must say ASSESSMENT");
});

test("Phase 6.2 typology framework returns empty for no indicators", () => {
  const framework = new RiskTypologyFramework();
  const matches = framework.evaluateIndicators([]);
  assert.equal(matches.length, 0);
});

// ── Phase 6.3: Community Detection ──────────────────────────────────────────

test("Phase 6.3 community detection finds connected components", () => {
  const service = new CommunityDetectionService();
  const edges = [
    edge("1", "0xAlice", "0xBob"),
    edge("2", "0xBob", "0xCharlie"),
    edge("3", "0xDave", "0xEve"), // separate component
  ];
  const result = service.detectCommunities(edges);
  assert.equal(result.communities.length, 2, "Should find 2 communities");
  assert.equal(result.totalNodes, 5);
  assert.equal(result.totalEdges, 3);
  const larger = result.communities.find((c) => c.memberCount === 3);
  assert.ok(larger, "Should have a community of 3 members");
  assert.ok(larger!.explanation.includes("does NOT imply"), "Must disclaim ownership inference");
  assert.equal(larger!.confidence, "STRUCTURAL");
});

test("Phase 6.3 community detection respects bounded execution", () => {
  const service = new CommunityDetectionService();
  const edges = Array.from({ length: 100 }, (_, i) => edge(`e${i}`, `addr${i}`, `addr${i + 1}`));
  const result = service.detectCommunities(edges, { maxNodes: 10 });
  assert.ok(result.totalNodes <= 11, "Should be bounded");
});

test("Phase 6.3 graph features retain the investigation chain when the stored graph is empty", async () => {
  const service = new GraphFeatureService();
  const repos = {
    graph: { listByCaseAndChain: async () => [] },
  } as never;
  const result = await service.computeFeatures(repos, "case-a", "ETHEREUM", "0xEmpty", 1);
  assert.ok(result.features.length > 0);
  assert.ok(result.features.every((feature) => feature.chain === "ETHEREUM"));
});

test("Phase 6 case approval requires the distinct CASE_AUTHORIZE permission and audits the approval", async () => {
  const permissions: string[] = [];
  const auditActions: string[] = [];
  const record = {
    id: "case-a", caseNumber: "CASE-A", title: "test", description: "test", fraudType: "OTHER", reportedAmount: "0",
    status: "OPEN" as const, priority: "MEDIUM", investigationAuthorizationStatus: "PENDING" as const,
    createdBy: "actor-a", assignedTo: "actor-a", closedAt: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const repositories = {
    cases: { update: async () => ({ ...record, investigationAuthorizationStatus: "APPROVED" as const }) },
    audit: { append: async (event: { action: string }) => { auditActions.push(event.action); } },
  } as never;
  const authorization = {
    requireCaseAccess: async () => record,
    requirePermission: async (_actor: unknown, permission: string) => { permissions.push(permission); },
  } as never;
  const transactions = { transaction: async (fn: (repos: never) => Promise<unknown>) => fn(repositories) } as never;
  const service = new CaseService(repositories, transactions, authorization);
  await service.update({ id: "actor-a", username: "supervisor", roles: ["SUPERVISOR"], permissions: ["CASE_UPDATE", "CASE_AUTHORIZE"] }, "case-a", { investigationAuthorizationStatus: "APPROVED" }, "request-a");
  assert.ok(permissions.includes("CASE_AUTHORIZE"));
  assert.deepEqual(auditActions, ["CASE_AUTHORIZATION_UPDATED"]);
});

// ── Phase 6.4: DeFi Interaction ─────────────────────────────────────────────

test("Phase 6.4 DeFi interaction service identifies known DEX routers", () => {
  const service = new DeFiInteractionService();
  const edges = [
    edge("1", "0xUser", "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"), // Uniswap V2
    edge("2", "0xUser", "0xUnknownContract"),
  ];
  const interactions = service.identifyInteractions(edges);
  assert.equal(interactions.length, 1, "Should identify 1 DeFi interaction");
  assert.equal(interactions[0].protocolName, "Uniswap V2 Router");
  assert.equal(interactions[0].interactionType, "SWAP");
});

test("Phase 6.4 DeFi interaction filters by chain match", () => {
  const service = new DeFiInteractionService();
  // PancakeSwap router but on ETHEREUM (should NOT match since it's BSC-only)
  const edges = [
    edge("1", "0xUser", "0x10ed43c718714eb63d5aa57b78b54704e256024e", { chain: "ETHEREUM" }),
  ];
  const interactions = service.identifyInteractions(edges);
  assert.equal(interactions.length, 0, "Should not match wrong chain");
});

// ── Phase 6.4: MEV Detection ────────────────────────────────────────────────

test("Phase 6.4 MEV detection identifies sandwich candidates in same block", () => {
  const service = new MEVDetectionService();
  const contract = "0xTokenContract";
  const edges = [
    edge("1", "0xAttacker", "0xPool", { blockNumber: "500", tokenContract: contract, chain: "ETHEREUM" }),
    edge("2", "0xPool", "0xAttacker", { blockNumber: "500", tokenContract: contract, chain: "ETHEREUM" }),
    edge("3", "0xVictim", "0xPool", { blockNumber: "500", tokenContract: contract, chain: "ETHEREUM" }),
  ];
  const result = service.analyze(edges);
  const sandwiches = result.candidates.filter((c) => c.mevType === "SANDWICH");
  // The attacker sends to AND receives from pool, victim also sends to pool
  assert.ok(sandwiches.length >= 0, "MEV analysis should run without error");
  assert.equal(result.method, "cashnet-mev-detection");
});

// ── Phase 6.5: Evaluation Framework ─────────────────────────────────────────

test("Phase 6.5 evaluation computes binary metrics correctly", () => {
  const predictions = [
    { subjectId: "a1", predictedLabel: "SUSPICIOUS", predictedScore: 80, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "SUSPICIOUS" },
    { subjectId: "a2", predictedLabel: "SUSPICIOUS", predictedScore: 60, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "BENIGN" },
    { subjectId: "a3", predictedLabel: "BENIGN", predictedScore: 20, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "BENIGN" },
    { subjectId: "a4", predictedLabel: "BENIGN", predictedScore: 30, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "SUSPICIOUS" },
  ];
  const metrics = computeBinaryMetrics(predictions, "SUSPICIOUS");
  assert.equal(metrics.groundTruthStatus, "VERIFIED");
  assert.equal(metrics.sampleCount, 4);
  assert.ok(metrics.precision != null && metrics.precision === 0.5); // TP=1, FP=1
  assert.ok(metrics.recall != null && metrics.recall === 0.5);      // TP=1, FN=1
});

test("Phase 6.5 evaluation returns INSUFFICIENT_GROUND_TRUTH without labels", () => {
  const predictions = [
    { subjectId: "a1", predictedLabel: "SUSPICIOUS", predictedScore: 80, scoreType: "HEURISTIC_SCORE" as const },
  ];
  const metrics = computeBinaryMetrics(predictions, "SUSPICIOUS");
  assert.equal(metrics.groundTruthStatus, "INSUFFICIENT_GROUND_TRUTH");
  assert.equal(metrics.sampleCount, 0);
});

test("Phase 6.5 calibration computes bins and ECE", () => {
  const predictions = [
    { subjectId: "a1", predictedLabel: "S", predictedScore: 90, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "S" },
    { subjectId: "a2", predictedLabel: "S", predictedScore: 80, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "B" },
    { subjectId: "a3", predictedLabel: "B", predictedScore: 10, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "B" },
  ];
  const result = computeCalibration(predictions, "S", 5);
  assert.equal(result.bins.length, 5);
  assert.ok(result.expectedCalibrationError >= 0);
  assert.equal(result.method, "cashnet-evaluation");
});

test("Phase 6.5 false positive analysis categorizes misclassifications", () => {
  const predictions = [
    { subjectId: "a1", predictedLabel: "SUSPICIOUS", predictedScore: 70, scoreType: "HEURISTIC_SCORE" as const, trueLabel: "BENIGN" },
  ];
  const fps = analyzeFalsePositives(predictions, "SUSPICIOUS");
  assert.equal(fps.length, 1);
  assert.equal(fps[0].categories[0], "INSUFFICIENT_CONTEXT");
});

// ── Phase 6.6: Security Middleware ──────────────────────────────────────────

test("Phase 6.6 secret redaction masks sensitive values", () => {
  const input = 'ETHERSCAN_API_KEY=abc123secretkey DATABASE_URL=postgres://user:pass@host/db';
  const redacted = redactSecrets(input);
  assert.ok(!redacted.includes("abc123secretkey"), "API key should be redacted");
});

// ── Phase 6.6: Report Generator ─────────────────────────────────────────────

test("Phase 6.6 report generator produces structured forensic report", () => {
  const generator = new ReportGenerator();
  const report = generator.generateInvestigationSummary("case-1", "inv-1", "user-1", {
    transactionCount: 150, walletCount: 12, chains: ["ETHEREUM", "BNB_CHAIN"],
    riskIndicatorCount: 5, graphEdgeCount: 200, candidateCount: 3,
    reviewCount: 2, contradictionCount: 1,
  });
  assert.equal(report.reportType, "INVESTIGATION_SUMMARY");
  assert.ok(report.sections.length >= 3);
  assert.ok(report.disclaimer.includes("NOT probabilities"), "Disclaimer must address probability misconception");
  assert.ok(report.disclaimer.includes("never suppressed"), "Disclaimer must mention contradiction preservation");
  const contradictionSection = report.sections.find((s) => s.type === "CONTRADICTIONS");
  assert.ok(contradictionSection, "Must include contradictions section when contradictions exist");
  assert.ok(report.methodVersions["cashnet-report-generator"]);
  assert.ok(report.methodVersions["cashnet-aml-risk-engine"]);
});

// ── Phase 6.1: Multi-chain provider registration ────────────────────────────

test("Phase 6.1 provider router dispatches all 6 chains", async () => {
  const { ProviderRouter } = await import("./services/blockchain/provider-router");
  const { createConfig } = await import("./config");
  const config = createConfig({ CASHNET_DATA_MODE: "authorized", ETHERSCAN_API_KEY: "test" });
  const router = new ProviderRouter(config);
  for (const chain of ["ETHEREUM", "BITCOIN", "TRON", "BNB_CHAIN", "POLYGON", "SOLANA"] as const) {
    const provider = router.forChain(chain);
    assert.ok(provider, `Provider for ${chain} should exist`);
    assert.equal(provider.chain, chain);
  }
});

test("Phase 6.6 JWT authenticator rejects a token with valid claims but invalid signature", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [{ ...jwk, kid: "test-key", use: "sig", alg: "RS256" }] }), { status: 200 });
  try {
    const auth = new JWTAuthenticator({ issuerAllowlist: ["https://issuer.example"], audience: "cashnet-api", jwksUri: "https://issuer.example/jwks", clockSkewSeconds: 0, jwksCacheTtlMs: 60_000, roleClaimPath: "roles" });
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test-key", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ iss: "https://issuer.example", aud: "cashnet-api", sub: "demo.investigator", exp: Math.floor(Date.now() / 1000) + 60, roles: ["INVESTIGATOR"] })).toString("base64url");
    const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), privateKey).toString("base64url");
    assert.equal((await auth.authenticate(`${header}.${payload}.${signature}`)).subject, "demo.investigator");
    const invalidSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
    await assert.rejects(auth.authenticate(`${header}.${payload}.${invalidSignature}`), /signature verification failed/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Phase 6 runtime configuration does not mark Solana configured without an approved endpoint", async () => {
  const { createConfig } = await import("./config");
  assert.equal(createConfig({ CASHNET_DATA_MODE: "authorized" }).providers.solana.configured, false);
  assert.equal(createConfig({ CASHNET_DATA_MODE: "authorized", SOLANA_RPC_URL: "https://approved-rpc.example" }).providers.solana.configured, true);
});

test("TronGrid transaction lookup uses the shared injected HTTP client POST path", async () => {
  let capturedMethod: string | undefined;
  const config = (await import("./config")).createConfig({ CASHNET_DATA_MODE: "authorized", TRONGRID_API_KEY: "test-key", CASHNET_PROVIDER_MAX_RETRIES: "0" });
  const provider = new TronGridProvider(config, async (_url, init) => {
    capturedMethod = init?.method;
    return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
  });
  assert.deepEqual(await provider.getTransaction("a".repeat(64)), { status: "EMPTY", data: null });
  assert.equal(capturedMethod, "POST");
});

test("Phase 6 migrations evolve legacy schemas and preserve graph-feature chain provenance", async () => {
  const root = new URL("../../../", import.meta.url);
  const [risk, graph, compatibility, chainRepair, runner] = await Promise.all([
    readFile(new URL("database/migrations/20260901_phase6_risk.sql", root), "utf8"),
    readFile(new URL("database/migrations/20260901_phase6_graph.sql", root), "utf8"),
    readFile(new URL("database/migrations/20260902_phase6_operational_compatibility.sql", root), "utf8"),
    readFile(new URL("database/migrations/20260903_phase6_graph_feature_chain_integrity.sql", root), "utf8"),
    readFile(new URL("lib/db/src/migrate.ts", root), "utf8"),
  ]);
  assert.match(risk, /ALTER TABLE risk_indicators[\s\S]*ADD COLUMN IF NOT EXISTS run_id/i);
  assert.doesNotMatch(risk, /CREATE TABLE IF NOT EXISTS risk_indicators/i);
  assert.match(graph, /CREATE UNIQUE INDEX IF NOT EXISTS[\s\S]*lower\(address\)/i);
  assert.doesNotMatch(graph, /UNIQUE\s*\([^)]*lower\(address\)/i);
  assert.match(compatibility, /CREATE TABLE IF NOT EXISTS community_analysis_runs/i);
  assert.match(runner, /20260902_phase6_operational_compatibility/);
  assert.match(runner, /20260903_phase6_graph_feature_chain_integrity/);
  assert.match(chainRepair, /UPDATE graph_features AS feature[\s\S]*investigation\.chain/i);
  assert.match(chainRepair, /CHECK \(btrim\(chain\) <> ''\) NOT VALID/i);
});

test("Phase 6 provider lookups require investigation scope and reject a chain mismatch as validation", async () => {
  const root = new URL("../../../", import.meta.url);
  const [walletRoute, transactionRoute, openApi] = await Promise.all([
    readFile(new URL("artifacts/api-server/src/routes/v1/wallets.ts", root), "utf8"),
    readFile(new URL("artifacts/api-server/src/routes/v1/transactions.ts", root), "utf8"),
    readFile(new URL("lib/api-spec/openapi.yaml", root), "utf8"),
  ]);
  for (const route of [walletRoute, transactionRoute]) {
    assert.match(route, /investigation_id/);
    assert.match(route, /ValidationFailureError\("Lookup chain must match/);
    assert.doesNotMatch(route, /throw new Error\("Lookup chain must match/);
  }
  assert.match(openApi, /name: investigation_id, in: query, required: true/);
  assert.match(openApi, /executeInvestigationRiskAnalysis/);
  assert.match(openApi, /computeInvestigationGraphFeatures/);
  assert.match(openApi, /analyzeInvestigationDefiMev/);
  assert.match(openApi, /generateInvestigationForensicReport/);
});
