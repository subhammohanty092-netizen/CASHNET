import { getDatabase } from "@workspace/db";
import { CaseAuthorizationService } from "../auth/case-authorization-service";
import { DevelopmentActorAuthenticator } from "../auth/actor-context";
import { PostgresRepositories } from "../repositories/postgres-repositories";
import { CaseService } from "./cases/case-service";
import { EvidenceService } from "./evidence/evidence-service";
import { PersistentInvestigationService } from "./investigation/persistent-investigation-service";
import { BlockchainCollectionService } from "./investigation/blockchain-collection-service";
import { GraphTracingService } from "./graph/graph-tracing-service";
import { BlockchainService } from "./blockchain/blockchain-service";
import { ProviderRouter } from "./blockchain/provider-router";
import { config } from "../config";
import { ApprovedDatasetAddressIntelligenceProvider } from "./intelligence/approved-dataset-provider";
import { AddressIntelligenceService } from "./intelligence/address-intelligence-service";
import { BitcoinClusterInferenceService } from "./intelligence/bitcoin-cluster-inference-service";
import { VaspCandidateService } from "./intelligence/vasp-candidate-service";

export function getPersistentContext() {
  const repositories = new PostgresRepositories(getDatabase().db);
  const context = repositories.context();
  const authorization = new CaseAuthorizationService(context.cases, context.audit);
  const providers = new ProviderRouter(config);
  return {
    authenticate: new DevelopmentActorAuthenticator(context.users),
    cases: new CaseService(context, repositories, authorization),
    investigations: new PersistentInvestigationService(context, repositories, authorization),
    collection: new BlockchainCollectionService(context, repositories, authorization, providers),
    graphTracing: new GraphTracingService(context, repositories, authorization),
    blockchain: new BlockchainService(providers),
    evidence: new EvidenceService(context, authorization),
    addressIntelligence: new AddressIntelligenceService(context, repositories, authorization, new ApprovedDatasetAddressIntelligenceProvider(config)),
    bitcoinClusters: new BitcoinClusterInferenceService(context, repositories, authorization),
    vaspCandidates: new VaspCandidateService(context, repositories, authorization),
    authorization,
    audit: context.audit,
  };
}
