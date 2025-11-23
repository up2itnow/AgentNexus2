/*
  WalletService - Account Abstraction v3 scaffolding for Base chain
  Reads config from environment variables.
*/
import { createLightAccountAlchemyClient } from '@alchemy/aa-alchemy';
import { LocalAccountSigner } from '@alchemy/aa-core';
import { type Hex } from 'viem';

export interface AlchemyAAConfig {
  apiKey: string;
  chain: 'base' | 'base-sepolia';
  entryPointAddress: string;
  gasPolicyId?: string;
  privateKey?: string; // for server-side admin ops (testnet only)
}

export class WalletService {
  private client: any | null = null;
  private cfg: AlchemyAAConfig;

  constructor() {
    this.cfg = this.loadConfig();
  }

  private loadConfig(): AlchemyAAConfig {
    const apiKey = process.env.ALCHEMY_API_KEY || '';
    const chain = (process.env.AA_CHAIN as any) || 'base-sepolia';
    const entryPointAddress = process.env.ENTRY_POINT_ADDRESS || '';
    const gasPolicyId = process.env.PAYMASTER_POLICY_ID || undefined;
    const privateKey = process.env.PRIVATE_KEY || undefined;
    if (!apiKey || !entryPointAddress) {
      // Leave uninitialized; app should boot but endpoints depending on AA should 503.
      // Logging handled by caller.
    }
    return { apiKey, chain, entryPointAddress, gasPolicyId, privateKey };
  }

  public async init(): Promise<void> {
    if (this.client) return;
    if (!this.cfg.apiKey || !this.cfg.entryPointAddress || !this.cfg.privateKey) return; // not fully configured

    const signer = LocalAccountSigner.privateKeyToAccountSigner(this.cfg.privateKey as Hex);

    this.client = await createLightAccountAlchemyClient({
      apiKey: this.cfg.apiKey,
      chain: this.cfg.chain === 'base' ? (global as any).base : (global as any).baseSepolia,
      entryPointAddress: this.cfg.entryPointAddress as Hex,
      signer,
      gasManagerConfig: this.cfg.gasPolicyId ? { policyId: this.cfg.gasPolicyId } : undefined,
    } as any);
  }

  public isReady(): boolean {
    return !!this.client;
  }

  // Example AA call wrapper (placeholder: no-op without addresses/ABIs)
  public async sendUserOperation(opts: { target: string; data: string; value?: bigint; }): Promise<{ hash: string }> {
    if (!this.client) throw new Error('AA client not initialized');
    const { hash } = await this.client.sendUserOperation({
      uo: {
        target: opts.target as Hex,
        data: opts.data as Hex,
        value: opts.value || 0n,
      },
    });
    return { hash };
  }

  public async checkEntitlementBalance(address: string, tokenId: string): Promise<bigint> {
    // Placeholder: In real implementation, read from Entitlements contract
    console.log(`Checking balance of ${tokenId} for ${address}`);
    return 0n;
  }

  public async mintEntitlement(address: string, tokenId: string, amount: number): Promise<void> {
    // Placeholder: In real implementation, send UserOperation to mint
    console.log(`Minting ${amount} of ${tokenId} to ${address}`);
  }
}
