import { ProviderFailureError, UnavailableServiceError } from "../../errors/app-error";
import type { CashnetConfig } from "../../config";
import { ProviderHttpClient } from "./http-client";
import { tronTokenTransfer, tronTransaction, tronWallet } from "./normalizers";
import type { BlockchainFactProvider } from "./types";
const pageSize = 100;
type TronResponse = { data?: unknown[]; meta?: { fingerprint?: string } };

export class TronGridProvider implements BlockchainFactProvider {
  readonly name = "trongrid"; readonly chain = "TRON" as const; private readonly client: ProviderHttpClient;
  constructor(private readonly config: CashnetConfig, fetcher?: typeof fetch) { this.client = new ProviderHttpClient(config.providerRequest, fetcher); }
  async validateAddress(address: string) { return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address); }
  async getWalletProfile(address: string) { const response = await this.request(`/v1/accounts/${encodeURIComponent(address)}`); const raw = response.data?.[0] ?? {}; return { status: "SUCCESS" as const, data: tronWallet(address, raw) }; }
  async getTransactions(address: string, page?: string) { const response = await this.request(`/v1/accounts/${encodeURIComponent(address)}/transactions`, page); const rows = response.data ?? []; if (!rows.length) return { status: "EMPTY" as const, data: [] }; return { status: "SUCCESS" as const, data: rows.map(tronTransaction), nextPage: response.meta?.fingerprint }; }
  async getTokenTransfers(address: string, page?: string) { const response = await this.request(`/v1/accounts/${encodeURIComponent(address)}/transactions/trc20`, page); const data = (response.data ?? []).map(tronTokenTransfer).filter((value): value is NonNullable<typeof value> => value !== null); return data.length ? { status: "SUCCESS" as const, data, nextPage: response.meta?.fingerprint } : { status: "EMPTY" as const, data: [] }; }
  async getInternalTransactions(_address: string) { return { status: "UNSUPPORTED_CAPABILITY" as const, capability: "internalTransactions" as const }; }
  async getTransaction(transactionHash: string) { if (!this.config.providers.trongrid.configured) throw new UnavailableServiceError("TronGrid is not configured. Set TRONGRID_API_KEY only in the server environment."); const url = `${this.config.providers.trongrid.baseUrl.replace(/\/$/, "")}/wallet/gettransactionbyid`; const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY ?? "" }, body: JSON.stringify({ value: transactionHash }) }); if (!response.ok) return { status: "EMPTY" as const, data: null }; const raw = await response.json() as Record<string, unknown>; return raw && raw.txID ? { status: "SUCCESS" as const, data: tronTransaction(raw) } : { status: "EMPTY" as const, data: null }; }
  async getBlock(blockReference: string) { const response = await this.request(`/v1/blocks/${encodeURIComponent(blockReference)}`); const raw = response.data?.[0]; return raw ? { status: "SUCCESS" as const, data: raw as Record<string, unknown> } : { status: "EMPTY" as const, data: null }; }
  private async request(path: string, fingerprint?: string): Promise<TronResponse> { if (!this.config.providers.trongrid.configured) throw new UnavailableServiceError("TronGrid is not configured. Set TRONGRID_API_KEY only in the server environment."); const url = new URL(`${this.config.providers.trongrid.baseUrl.replace(/\/$/, "")}${path}`); url.search = new URLSearchParams({ limit: String(pageSize), ...(fingerprint ? { fingerprint } : {}) }).toString(); const value = await this.client.getJson(url.toString(), { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY ?? "" }); if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProviderFailureError("TronGrid returned an unexpected response."); return value as TronResponse; }
}
