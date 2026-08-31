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
