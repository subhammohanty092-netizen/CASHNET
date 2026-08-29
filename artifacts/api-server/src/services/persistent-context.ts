import { getDatabase } from "@workspace/db";
import { CaseAuthorizationService } from "../auth/case-authorization-service";
import { DevelopmentActorAuthenticator } from "../auth/actor-context";
import { PostgresRepositories } from "../repositories/postgres-repositories";
import { CaseService } from "./cases/case-service";
import { EvidenceService } from "./evidence/evidence-service";
import { PersistentInvestigationService } from "./investigation/persistent-investigation-service";
import { BlockchainCollectionService } from "./investigation/blockchain-collection-service";
import { BlockchainService } from "./blockchain/blockchain-service";
import { ProviderRouter } from "./blockchain/provider-router";
import { config } from "../config";

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
    blockchain: new BlockchainService(providers),
    evidence: new EvidenceService(context, authorization),
    authorization,
    audit: context.audit,
  };
}
