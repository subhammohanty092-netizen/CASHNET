import { ProviderFailureError, RateLimitError, UnavailableServiceError } from "../../errors/app-error";
import type { CashnetConfig } from "../../config";
import { ProviderHttpClient } from "./http-client";
import { bnbWallet, bnbTransaction, bnbTokenTransfer } from "./normalizers";
import type { BlockchainFactProvider, NormalizedTransactionBundle, ProviderResult } from "./types";
import type { TokenTransfer, Wallet } from "../../schemas/models";

type BscScanResponse = { status?: string; message?: string; result?: unknown };
const pageSize = 100;
const bscScanDelay = () => new Promise<void>((r) => setTimeout(r, 250));

/**
 * BNB Chain provider via BscScan API.
 *
 * BscScan uses the Etherscan API contract but endpoint base, chain semantics,
 * and rate limits are independently verified per phase6-provider-matrix.md.
 *
 * Key BNB-specific differences from Etherscan:
 * - API base: https://api.bscscan.com/api (NOT Etherscan V2 multi-chain)
 * - Native asset: BNB (not ETH), balance in wei (18 decimals)
 * - Chain ID: 56 (BSC mainnet)
 * - Rate limit: 5 req/s on free tier (same as Etherscan free)
 * - Token standard: BEP-20 (uses same tokentx action)
 */
export class BscScanBnbProvider implements BlockchainFactProvider {
  readonly name = "bscscan";
  readonly chain = "BNB_CHAIN" as const;
  private readonly client: ProviderHttpClient;

  constructor(private readonly config: CashnetConfig, fetcher?: typeof fetch) {
    this.client = new ProviderHttpClient(config.providerRequest, fetcher);
  }

  async validateAddress(address: string): Promise<boolean> {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  async getWalletProfile(address: string): Promise<ProviderResult<Wallet | null>> {
    this.requireConfigured();
    const response = await this.request({ module: "account", action: "balance", address, tag: "latest" });
    return { status: "SUCCESS", data: bnbWallet(address, response.result, response) };
  }

  async getTransactions(address: string, page = "1"): Promise<ProviderResult<NormalizedTransactionBundle[]>> {
    await bscScanDelay();
    const response = await this.request({
      module: "account", action: "txlist", address,
      startblock: "0", endblock: "999999999",
      page, offset: String(pageSize), sort: "desc",
    });
    return this.parseTransactions(response, "normal", page);
  }

  async getTokenTransfers(address: string, page = "1"): Promise<ProviderResult<TokenTransfer[]>> {
    await bscScanDelay();
    const response = await this.request({
      module: "account", action: "tokentx", address,
      page, offset: String(pageSize), sort: "desc",
    });
    if (!Array.isArray(response.result) || response.result.length === 0) {
      return { status: "EMPTY", data: [] };
    }
    return {
      status: "SUCCESS",
      data: response.result.map((entry) => bnbTokenTransfer(entry)).filter((t): t is TokenTransfer => t !== null),
      nextPage: response.result.length === pageSize ? String(Number(page) + 1) : undefined,
    };
  }

  async getInternalTransactions(address: string, page = "1"): Promise<ProviderResult<NormalizedTransactionBundle[]>> {
    await bscScanDelay();
    const response = await this.request({
      module: "account", action: "txlistinternal", address,
      startblock: "0", endblock: "999999999",
      page, offset: String(pageSize), sort: "desc",
    });
    return this.parseTransactions(response, "internal", page);
  }

  async getTransaction(transactionHash: string): Promise<ProviderResult<NormalizedTransactionBundle | null>> {
    await bscScanDelay();
    const response = await this.request({ module: "proxy", action: "eth_getTransactionByHash", txhash: transactionHash });
    if (!response.result || typeof response.result !== "object") return { status: "EMPTY", data: null };
    return { status: "SUCCESS", data: bnbTransaction(response.result, "transaction") };
  }

  async getBlock(blockReference: string): Promise<ProviderResult<Record<string, unknown> | null>> {
    await bscScanDelay();
    const tag = /^\d+$/.test(blockReference) ? `0x${BigInt(blockReference).toString(16)}` : blockReference;
    const response = await this.request({ module: "proxy", action: "eth_getBlockByNumber", tag, boolean: "false" });
    return response.result && typeof response.result === "object"
      ? { status: "SUCCESS", data: response.result as Record<string, unknown> }
      : { status: "EMPTY", data: null };
  }

  private parseTransactions(response: BscScanResponse, kind: string, page: string): ProviderResult<NormalizedTransactionBundle[]> {
    if (!Array.isArray(response.result) || response.result.length === 0) return { status: "EMPTY", data: [] };
    return {
      status: "SUCCESS",
      data: response.result.map((entry) => bnbTransaction(entry, kind)),
      nextPage: response.result.length === pageSize ? String(Number(page) + 1) : undefined,
    };
  }

  private requireConfigured(): void {
    if (!this.config.providers.bscscan.configured) {
      throw new UnavailableServiceError("BscScan is not configured. Set BSCSCAN_API_KEY only in the server environment.");
    }
  }

  private async request(query: Record<string, string>): Promise<BscScanResponse> {
    this.requireConfigured();
    const url = new URL("https://api.bscscan.com/api");
    url.search = new URLSearchParams({ apikey: process.env.BSCSCAN_API_KEY ?? "", ...query }).toString();
    const response = await this.client.getJson(url.toString());
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new ProviderFailureError("BscScan returned an unexpected response.");
    }
    const parsed = response as BscScanResponse;
    if (parsed.status === "0" && !Array.isArray(parsed.result) && parsed.result !== "0") {
      if (typeof parsed.result === "string" && parsed.result.toLowerCase().includes("rate limit")) {
        throw new RateLimitError("BscScan rate limit reached.");
      }
      throw new ProviderFailureError(`BscScan rejected the request: ${typeof parsed.result === "string" ? parsed.result : parsed.message ?? "unknown"}`);
    }
    return parsed;
  }
}
