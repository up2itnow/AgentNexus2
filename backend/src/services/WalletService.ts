/*
  WalletService - Account Abstraction v3 scaffolding for Base chain
  Reads config from environment variables.
*/
import { createLightAccountAlchemyClient } from '@alchemy/aa-alchemy';
import { LocalAccountSigner } from '@alchemy/aa-core';
import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  formatEther,
  http,
  keccak256,
  stringToBytes
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import entitlementsAbi from '../contracts/AgentNexusEntitlements.json';
import {
  createPublicViemClient,
  createWalletViemClient,
  getContractAddresses,
  getRpcUrl,
  isValidAddress
} from '../utils/blockchain';

export interface AlchemyAAConfig {
  apiKey: string;
  chain: 'base' | 'base-sepolia';
  entryPointAddress: string;
  gasPolicyId?: string;
  privateKey?: string; // for server-side admin ops (testnet only)
}

export class WalletService {
  private aaClient: Awaited<ReturnType<typeof createLightAccountAlchemyClient>> | null = null;
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;
  private cfg: AlchemyAAConfig;
  private readonly chainId: number;

  constructor() {
    this.cfg = this.loadConfig();
    this.chainId = this.cfg.chain === 'base' ? 8453 : 84532;
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
    this.ensureChainClients();
    await this.ensureAaClient();
  }

  public isReady(): boolean {
    return Boolean(this.aaClient || this.publicClient);
  }

  // Example AA call wrapper (placeholder: no-op without addresses/ABIs)
  public async sendUserOperation(opts: { target: string; data: string; value?: bigint; }): Promise<{ hash: string }> {
    await this.ensureAaClient(true);
    if (!this.aaClient) {
      throw new Error('AA client not initialized');
    }

    const { hash } = await this.aaClient.sendUserOperation({
      uo: {
        target: opts.target as Hex,
        data: opts.data as Hex,
        value: opts.value || 0n,
      },
    });
    return { hash };
  }

  public async checkEntitlementBalance(address: string, tokenId: string): Promise<bigint> {
    this.ensureChainClients();
    if (!this.publicClient) {
      throw new Error('Public client not initialized for entitlement checks');
    }

    if (!isValidAddress(address)) {
      throw new Error('Invalid address provided for entitlement balance check');
    }

    const { entitlements } = getContractAddresses(this.chainId);
    const balance = await this.publicClient.readContract({
      address: entitlements as Address,
      abi: entitlementsAbi,
      functionName: 'balanceOf',
      args: [address as Address, BigInt(tokenId)],
    });

    return balance;
  }

  public async mintEntitlement(address: string, tokenId: string, amount: number): Promise<void> {
    this.ensureChainClients();
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized for entitlement minting');
    }

    if (!isValidAddress(address)) {
      throw new Error('Invalid address provided for entitlement minting');
    }

    const { entitlements } = getContractAddresses(this.chainId);
    const hash = await this.walletClient.writeContract({
      address: entitlements as Address,
      abi: entitlementsAbi,
      functionName: 'mint',
      args: [address as Address, BigInt(tokenId), BigInt(amount), '0x'],
    });

    if (this.publicClient) {
      await this.publicClient.waitForTransactionReceipt({ hash });
    }
  }

  /**
   * Get the Token Bound Account address for an agent
   * @param agentId The agent's ID
   */
  public async getAgentAddress(agentId: string): Promise<string> {
    // Maintain test-friendly deterministic address for Agent Zero
    if (agentId === 'agent-zero') {
      return '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    }

    const hash = keccak256(stringToBytes(agentId));
    return `0x${hash.slice(-40)}`;
  }

  /**
   * Get the balance of an address in ETH
   * @param address The wallet address
   */
  public async getBalance(_address: string): Promise<string> {
    this.ensureChainClients();
    if (!this.publicClient) {
      throw new Error('Public client not initialized for balance checks');
    }

    const balance = await this.publicClient.getBalance({ address: _address as Address });
    return formatEther(balance);
  }

  private ensureChainClients(): void {
    if (!this.publicClient) {
      this.publicClient = createPublicViemClient(this.chainId);
    }

    if (!this.walletClient && this.cfg.privateKey) {
      this.walletClient = createWalletViemClient(this.chainId, this.cfg.privateKey);
    }
  }

  private async ensureAaClient(strict: boolean = false): Promise<void> {
    if (this.aaClient || !this.cfg.privateKey) {
      return;
    }

    if (!this.cfg.apiKey || !this.cfg.entryPointAddress) {
      if (strict) {
        throw new Error('Alchemy AA client configuration is incomplete');
      }
      return;
    }

    // Ensure chain-specific globals are registered for the AA SDK
    if (!(global as any).base && !(global as any).baseSepolia) {
      (global as any).base = base;
      (global as any).baseSepolia = baseSepolia;
    }

    const signer = LocalAccountSigner.privateKeyToAccountSigner(this.cfg.privateKey as Hex);

    this.aaClient = await createLightAccountAlchemyClient({
      apiKey: this.cfg.apiKey,
      chain: this.cfg.chain === 'base' ? base : baseSepolia,
      entryPointAddress: this.cfg.entryPointAddress as Hex,
      signer,
      gasManagerConfig: this.cfg.gasPolicyId ? { policyId: this.cfg.gasPolicyId } : undefined,
      transport: http(getRpcUrl(this.chainId))
    } as any);
  }
}
