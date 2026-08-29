/** Phase 4 extension points only. No intelligence dataset, VASP, or abuse service is invoked. */
export interface AddressIntelligenceProvider { lookup(input: { chain: string; address: string }): Promise<never>; }
export interface AbuseIntelligenceProvider { lookup(input: { chain: string; address: string }): Promise<never>; }
