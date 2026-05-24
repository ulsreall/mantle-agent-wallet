// SPDX-License-Identifier: MIT
import { createPublicClient, createWalletClient, http, parseAbi, formatEther, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantle, mantleTestnet } from 'viem/chains';
import { config } from 'dotenv';
import pino from 'pino';
import { WalletManager } from './wallet';
import { StrategyEngine } from './strategies/engine';
import { MCPServer } from './mcp/server';

// Load environment variables
config();

// ═══════════════════════════════════════════════════════════════
//                        CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Determine chain based on environment
// Default to mainnet for hackathon
const useTestnet = process.env.USE_TESTNET === 'true';
const chain = useTestnet ? mantleTestnet : mantle;
const rpcUrl = useTestnet
  ? process.env.MANTLE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.mantle.xyz'
  : process.env.MANTLE_RPC_URL || 'https://rpc.mantle.xyz';

// ═══════════════════════════════════════════════════════════════
//                        CONTRACT ABIS
// ═══════════════════════════════════════════════════════════════

const AgenticWalletABI = parseAbi([
  'function execute(address target, bytes data, uint256 value) returns (bool success, bytes result)',
  'function batchExecute(address[] targets, bytes[] datas, uint256[] values) returns (bool[] successes, bytes[] results)',
  'function setStrategy(bytes32 strategyId)',
  'function agentId() view returns (uint256)',
  'function owner() view returns (address)',
  'function activeStrategy() view returns (bytes32)',
  'function getBalance() view returns (uint256)',
  'function withdraw(address to, uint256 amount)',
  'function registerStrategy(bytes32 strategyId, address executor)',
  'event ActionExecuted(address indexed target, bytes data, uint256 value, bool success, bytes result)',
  'event StrategyChanged(bytes32 oldStrategy, bytes32 newStrategy)',
  'event Deposited(address indexed from, uint256 amount)',
  'event Withdrawn(address indexed to, uint256 amount)',
]);

const StrategyExecutorABI = parseAbi([
  'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint8 dex) returns (uint256 amountOut)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint8 dex) returns (uint256 liquidity)',
  'function harvest(address farm, address rewardToken) returns (uint256 amount)',
  'function getBestRoute(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint8 bestDex, uint256 bestAmount)',
  'function setDEXRouter(uint8 dex, address router)',
  'function setDEXFactory(uint8 dex, address factory)',
]);

const ERC8004ABI = parseAbi([
  'function register(string agentURI) returns (uint256 tokenId)',
  'function register(string agentURI, string[] metadata) returns (uint256 tokenId)',
  'function getMetadata(uint256 tokenId, string key) view returns (string value)',
  'function setMetadata(uint256 tokenId, string key, string value)',
  'function getAgentWallet(uint256 tokenId) view returns (address wallet)',
  'function tokenURI(uint256 tokenId) view returns (string uri)',
]);

// ═══════════════════════════════════════════════════════════════
//                        MAIN AGENT
// ═══════════════════════════════════════════════════════════════

class MantleAgentWallet {
  private walletManager: WalletManager;
  private strategyEngine: StrategyEngine;
  private mcpServer: MCPServer;
  private isRunning: boolean = false;

  constructor() {
    // Initialize wallet manager
    this.walletManager = new WalletManager({
      privateKey: process.env.PRIVATE_KEY || '',
      rpcUrl,
      chain,
      logger,
    });

    // Initialize strategy engine
    this.strategyEngine = new StrategyEngine({
      walletManager: this.walletManager,
      logger,
      config: {
        defaultStrategy: process.env.DEFAULT_STRATEGY || 'swap',
        maxTradeSize: parseFloat(process.env.MAX_TRADE_SIZE || '1.0'),
        slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || '0.5'),
      },
    });

    // Initialize MCP server
    this.mcpServer = new MCPServer({
      port: parseInt(process.env.MCP_PORT || '3000'),
      walletManager: this.walletManager,
      strategyEngine: this.strategyEngine,
      logger,
    });
  }

  async start() {
    logger.info('Starting Mantle Agent Wallet...');
    logger.info(`Network: ${chain.name} (Chain ID: ${chain.id})`);
    logger.info(`RPC: ${rpcUrl}`);

    try {
      // Initialize wallet
      await this.walletManager.initialize();
      logger.info(`Wallet address: ${this.walletManager.getAddress()}`);

      // Check balance
      const balance = await this.walletManager.getBalance();
      logger.info(`Wallet balance: ${formatEther(balance)} MNT`);

      // Start strategy engine
      await this.strategyEngine.start();
      logger.info('Strategy engine started');

      // Start MCP server
      if (process.env.MCP_ENABLED === 'true') {
        await this.mcpServer.start();
        logger.info(`MCP server started on port ${process.env.MCP_PORT || 3000}`);
      }

      this.isRunning = true;
      logger.info('Mantle Agent Wallet started successfully!');

      // Start main loop
      await this.mainLoop();
    } catch (error) {
      logger.error('Failed to start agent:', error);
      process.exit(1);
    }
  }

  private async mainLoop() {
    logger.info('Entering main loop...');

    while (this.isRunning) {
      try {
        // Execute strategy
        await this.strategyEngine.execute();

        // Wait before next iteration
        const interval = parseInt(process.env.STRATEGY_INTERVAL || '60000'); // 1 minute default
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        logger.error('Error in main loop:', error);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  async stop() {
    logger.info('Stopping Mantle Agent Wallet...');
    this.isRunning = false;

    // Stop strategy engine
    await this.strategyEngine.stop();

    // Stop MCP server
    await this.mcpServer.stop();

    logger.info('Mantle Agent Wallet stopped');
  }
}

// ═══════════════════════════════════════════════════════════════
//                        ENTRY POINT
// ═══════════════════════════════════════════════════════════════

async function main() {
  const agent = new MantleAgentWallet();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await agent.stop();
    process.exit(0);
  });

  // Start agent
  await agent.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { MantleAgentWallet };
