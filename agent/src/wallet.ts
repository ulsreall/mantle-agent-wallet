// SPDX-License-Identifier: MIT
import { ethers } from 'ethers';
import { Logger } from 'pino';

// ═══════════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════════

export interface WalletConfig {
  privateKey: string;
  rpcUrl: string;
  chain: any;
  logger: Logger;
}

export interface TransactionRequest {
  to: string;
  data: string;
  value?: bigint;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  gasUsed?: bigint;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
//                        WALLET MANAGER
// ═══════════════════════════════════════════════════════════════

export class WalletManager {
  private config: WalletConfig;
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private logger: Logger;

  constructor(config: WalletConfig) {
    this.config = config;
    this.logger = config.logger;

    // Validate private key
    if (!config.privateKey || config.privateKey.length !== 64) {
      throw new Error('Invalid private key. Must be 64 hex characters (without 0x prefix)');
    }

    // Create provider and wallet
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(`0x${config.privateKey}`, this.provider);

    this.logger.info(`Wallet manager initialized for ${this.wallet.address}`);
  }

  // ═══════════════════════════════════════════════════════════════
  //                        INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  async initialize() {
    this.logger.info('Initializing wallet manager...');

    // Check if we can connect to the network
    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.logger.info(`Connected to network. Current block: ${blockNumber}`);
    } catch (error) {
      this.logger.error('Failed to connect to network:', error);
      throw error;
    }

    // Log wallet info
    const balance = await this.getBalance();
    this.logger.info(`Wallet address: ${this.wallet.address}`);
    this.logger.info(`Wallet balance: ${ethers.formatEther(balance)} MNT`);

    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  //                        GETTERS
  // ═══════════════════════════════════════════════════════════════

  getAddress(): string {
    return this.wallet.address;
  }

  getChain(): any {
    return this.config.chain;
  }

  // ═══════════════════════════════════════════════════════════════
  //                        BALANCE
  // ═══════════════════════════════════════════════════════════════

  async getBalance(address?: string): Promise<bigint> {
    const target = address || this.wallet.address;
    return this.provider.getBalance(target);
  }

  async getTokenBalance(tokenAddress: string, address?: string): Promise<bigint> {
    const target = address || this.wallet.address;

    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );

      return await contract.balanceOf(target);
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
      const txResponse = await this.wallet.sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value || 0n,
      });

      this.logger.info(`Transaction sent: ${txResponse.hash}`);

      // Wait for receipt
      const receipt = await txResponse.wait();

      const success = receipt?.status === 1;
      const gasUsed = receipt?.gasUsed;

      if (success) {
        this.logger.info(`Transaction successful. Gas used: ${gasUsed}`);
      } else {
        this.logger.error(`Transaction failed. Gas used: ${gasUsed}`);
      }

      return {
        hash: txResponse.hash,
        success,
        gasUsed,
      };
    } catch (error: any) {
      this.logger.error('Transaction failed:', error);
      return {
        hash: '0x',
        success: false,
        error: error.message,
      };
    }
  }

  async callContract(
    address: string,
    abi: any[],
    functionName: string,
    args: any[],
    value?: bigint
  ): Promise<TransactionResult> {
    this.logger.debug(`Calling ${functionName} on ${address}...`);

    try {
      const contract = new ethers.Contract(address, abi, this.wallet);
      const tx = await contract[functionName](...args, { value: value || 0n });
      this.logger.info(`Contract call sent: ${tx.hash}`);

      const receipt = await tx.wait();
      const success = receipt?.status === 1;

      return {
        hash: tx.hash,
        success,
        gasUsed: receipt?.gasUsed,
      };
    } catch (error: any) {
      this.logger.error(`Contract call failed:`, error);
      return {
        hash: '0x',
        success: false,
        error: error.message,
      };
    }
  }

  async readContract(
    address: string,
    abi: any[],
    functionName: string,
    args: any[]
  ): Promise<any> {
    try {
      const contract = new ethers.Contract(address, abi, this.provider);
      return await contract[functionName](...args);
    } catch (error) {
      this.logger.error(`Failed to read contract ${functionName}:`, error);
      throw error;
    }
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    try {
      return await this.provider.estimateGas({
        from: this.wallet.address,
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
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }
}
