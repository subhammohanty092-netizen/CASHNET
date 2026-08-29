import { z } from "zod";

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.string().regex(/^\d+$/).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  CASHNET_DATA_MODE: z.enum(["synthetic", "authorized"]).optional(),
  API_VERSION: z.literal("v1").optional(),
  ETHERSCAN_API_KEY: z.string().min(1).optional(),
  ETHERSCAN_CHAIN_ID: z.string().regex(/^\d+$/).optional(),
  BITCOIN_ESPLORA_BASE_URL: z.string().url().optional(),
  TRONGRID_API_KEY: z.string().min(1).optional(),
  TRONGRID_BASE_URL: z.string().url().optional(),
  CASHNET_PROVIDER_TIMEOUT_MS: z.string().regex(/^\d+$/).optional(),
  CASHNET_PROVIDER_MAX_RETRIES: z.string().regex(/^\d+$/).optional(),
  CASHNET_DEV_AUTH_ENABLED: z.enum(["true", "false"]).optional(),
});

export type CashnetConfig = {
  environment: "development" | "test" | "production";
  port?: number;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  dataMode: "synthetic" | "authorized";
  apiVersion: "v1";
  developmentAuthEnabled: boolean;
  providers: {
    etherscan: { configured: boolean; chainId: string };
    bitcoinEsplora: { baseUrl?: string };
    trongrid: { configured: boolean; baseUrl: string };
  };
  providerRequest: { timeoutMs: number; maxRetries: number };
};

export function createConfig(environment: NodeJS.ProcessEnv = process.env): CashnetConfig {
  const parsed = EnvironmentSchema.parse(environment);
  const runtimeEnvironment = parsed.NODE_ENV ?? "development";
  return {
    environment: runtimeEnvironment,
    port: parsed.PORT ? Number(parsed.PORT) : undefined,
    logLevel: parsed.LOG_LEVEL ?? "info",
    dataMode: parsed.CASHNET_DATA_MODE ?? "synthetic",
    apiVersion: parsed.API_VERSION ?? "v1",
    developmentAuthEnabled: runtimeEnvironment !== "production" && parsed.CASHNET_DEV_AUTH_ENABLED === "true",
    providers: {
      etherscan: { configured: Boolean(parsed.ETHERSCAN_API_KEY), chainId: parsed.ETHERSCAN_CHAIN_ID ?? "1" },
      bitcoinEsplora: { baseUrl: parsed.BITCOIN_ESPLORA_BASE_URL },
      trongrid: { configured: Boolean(parsed.TRONGRID_API_KEY), baseUrl: parsed.TRONGRID_BASE_URL ?? "https://api.trongrid.io" },
    },
    providerRequest: { timeoutMs: Number(parsed.CASHNET_PROVIDER_TIMEOUT_MS ?? "10000"), maxRetries: Number(parsed.CASHNET_PROVIDER_MAX_RETRIES ?? "2") },
  };
}

export const config = createConfig();
