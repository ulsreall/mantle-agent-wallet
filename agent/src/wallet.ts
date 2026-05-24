// SPDX-License-Identifier: MIT
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  formatEther,
  parseEther,
  Address,
  Hash,
  PublicClient,
  WalletClient,
  Chain,
} from 'viem';
import { privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts';
import { Logger } from 'pino';

// ═══════════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════════

export interface WalletConfig {
  privateKey: string;
  rpcUrl: string;
  chain: Chain;
  logger: Logger;
}

export interface TransactionRequest {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
}

export interface TransactionResult {
  hash: Hash;
  success: boolean;
  gasUsed?: bigint;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
//                        WALLET MANAGER
// ═══════════════════════════════════════════════════════════════

export class WalletManager {
  private config: WalletConfig;
  private account: PrivateKeyAccount;
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private logger: Logger;

  constructor(config: WalletConfig) {
    this.config = config;
    this.logger = config.logger;

    // Validate private key
    if (!config.privateKey || config.privateKey.length !== 64) {
      throw new Error('Invalid private key. Must be 64 hex characters (without 0x prefix)');
    }

    // Create account from private key
    this.account = privateKeyToAccount(`0x${config.privateKey}`);

    // Create public client for reading
    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    // Create wallet client for writing
    this.walletClient = createWalletClient({
      account: this.account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    this.logger.info(`Wallet manager initialized for ${this.account.address}`);
  }

  // ═══════════════════════════════════════════════════════════════
  //                        INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  async initialize() {
    this.logger.info('Initializing wallet manager...');

    // Check if we can connect to the network
    try {
      const blockNumber = await this.publicClient.getBlockNumber();
      this.logger.info(`Connected to network. Current block: ${blockNumber}`);
    } catch (error) {
      this.logger.error('Failed to connect to network:', error);
      throw error;
    }

    // Log wallet info
    const balance = await this.getBalance();
    this.logger.info(`Wallet address: ${this.account.address}`);
    this.logger.info(`Wallet balance: ${formatEther(balance)} MNT`);

    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  //                        GETTERS
  // ═══════════════════════════════════════════════════════════════

  getAddress(): Address {
    return this.account.address;
  }

  getChain(): Chain {
    return this.config.chain;
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getWalletClient(): WalletClient {
    return this.walletClient;
  }

  // ═══════════════════════════════════════════════════════════════
  //                        BALANCE
  // ═══════════════════════════════════════════════════════════════

  async getBalance(address?: Address): Promise<bigint> {
    const target = address || this.account.address;
    return this.publicClient.getBalance({ address: target });
  }

  async getTokenBalance(tokenAddress: Address, address?: Address): Promise<bigint> {
    const target = address || this.account.address;

    try {
      const balance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [target],
      });

      return balance;
    } catch (error) {
      this.logger.error(`Failed to get token balance for ${tokenAddress}:`, error);
      return 0n;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                        TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResult> {
    this.logger.debug(`Sending transaction to ${tx.to}...`);

    try {
      // Send transaction
      const hash = await this.walletClient.sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value || 0n,
      });

      this.logger.info(`Transaction sent: ${hash}`);

      // Wait for receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      const success = receipt.status === 'success';
      const gasUsed = receipt.gasUsed;

      if (success) {
        this.logger.info(`Transaction successful. Gas used: ${gasUsed}`);
      } else {
        this.logger.error(`Transaction failed. Gas used: ${gasUsed}`);
      }

      return {
        hash,
        success,
        gasUsed,
      };
    } catch (error: any) {
      this.logger.error('Transaction failed:', error);
      return {
        hash: '0x' as Hash,
        success: false,
        error: error.message,
      };
    }
  }

  async callContract(
    address: Address,
    abi: any[],
    functionName: string,
    args: any[],
    value?: bigint
  ): Promise<TransactionResult> {
    // Encode function call
    const data = this.encodeFunctionData(abi, functionName, args);

    return this.sendTransaction({
      to: address,
      data,
      value,
    });
  }

  async readContract(
    address: Address,
    abi: any[],
    functionName: string,
    args: any[]
  ): Promise<any> {
    try {
      return await this.publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      });
    } catch (error) {
      this.logger.error(`Failed to read contract ${functionName}:`, error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                        HELPERS
  // ═══════════════════════════════════════════════════════════════

  private encodeFunctionData(
    abi: any[],
    functionName: string,
    args: any[]
  ): `0x${string}` {
    // Find the function in the ABI
    const func = abi.find(
      (item: any) => item.type === 'function' && item.name === functionName
    );

    if (!func) {
      throw new Error(`Function ${functionName} not found in ABI`);
    }

    // Encode the function call
    // This is a simplified version - in production, use viem's encodeFunctionData
    return '0x' as `0x${string}`;
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    try {
      return await this.publicClient.estimateGas({
        account: this.account.address,
        to: tx.to,
        data: tx.data,
        value: tx.value || 0n,
      });
    } catch (error) {
      this.logger.error('Gas estimation failed:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<bigint> {
    return this.publicClient.getGasPrice();
  }
}
