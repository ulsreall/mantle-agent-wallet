// SPDX-License-Identifier: MIT
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from 'pino';
import { WalletManager } from '../wallet';
import { StrategyEngine } from '../strategies/engine';
import { formatEther, parseEther, Address } from 'viem';

// ═══════════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════════

export interface MCPServerConfig {
  port: number;
  walletManager: WalletManager;
  strategyEngine: StrategyEngine;
  logger: Logger;
}

// ═══════════════════════════════════════════════════════════════
//                        MCP SERVER
// ═══════════════════════════════════════════════════════════════

export class MCPServer {
  private server: Server;
  private config: MCPServerConfig;
  private logger: Logger;
  private transport: StdioServerTransport | null = null;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.logger = config.logger;

    // Create MCP server
    this.server = new Server(
      {
        name: 'mantle-agent-wallet',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register handlers
    this.registerHandlers();
  }

  // ═══════════════════════════════════════════════════════════════
  //                        LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  async start() {
    this.logger.info('Starting MCP server...');

    try {
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      this.logger.info('MCP server started');
    } catch (error) {
      this.logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  async stop() {
    this.logger.info('Stopping MCP server...');
    // MCP server doesn't have a stop method in the current version
    this.logger.info('MCP server stopped');
  }

  // ═══════════════════════════════════════════════════════════════
  //                        HANDLERS
  // ═══════════════════════════════════════════════════════════════

  private registerHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_balance',
            description: 'Get the wallet balance in MNT',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'get_address',
            description: 'Get the wallet address',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'swap',
            description: 'Swap tokens on a DEX',
            inputSchema: {
              type: 'object',
              properties: {
                tokenIn: {
                  type: 'string',
                  description: 'Input token address',
                },
                tokenOut: {
                  type: 'string',
                  description: 'Output token address',
                },
                amountIn: {
                  type: 'string',
                  description: 'Amount to swap (in ether units)',
                },
                dex: {
                  type: 'number',
                  description: 'DEX to use (0=MerchantMoe, 1=Agni, 2=Fluxion)',
                },
              },
              required: ['tokenIn', 'tokenOut', 'amountIn', 'dex'],
            },
          },
          {
            name: 'add_liquidity',
            description: 'Add liquidity to a DEX pool',
            inputSchema: {
              type: 'object',
              properties: {
                tokenA: {
                  type: 'string',
                  description: 'First token address',
                },
                tokenB: {
                  type: 'string',
                  description: 'Second token address',
                },
                amountA: {
                  type: 'string',
                  description: 'Amount of first token (in ether units)',
                },
                amountB: {
                  type: 'string',
                  description: 'Amount of second token (in ether units)',
                },
                dex: {
                  type: 'number',
                  description: 'DEX to use (0=MerchantMoe, 1=Agni, 2=Fluxion)',
                },
              },
              required: ['tokenA', 'tokenB', 'amountA', 'amountB', 'dex'],
            },
          },
          {
            name: 'get_best_route',
            description: 'Get the best swap route across DEXes',
            inputSchema: {
              type: 'object',
              properties: {
                tokenIn: {
                  type: 'string',
                  description: 'Input token address',
                },
                tokenOut: {
                  type: 'string',
                  description: 'Output token address',
                },
                amountIn: {
                  type: 'string',
                  description: 'Amount to swap (in ether units)',
                },
              },
              required: ['tokenIn', 'tokenOut', 'amountIn'],
            },
          },
          {
            name: 'get_strategy',
            description: 'Get the current strategy',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'set_strategy',
            description: 'Set the active strategy',
            inputSchema: {
              type: 'object',
              properties: {
                strategy: {
                  type: 'string',
                  description: 'Strategy name (swap, lp, yield, arbitrage)',
                },
              },
              required: ['strategy'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info(`Tool called: ${name}`, args);

      try {
        switch (name) {
          case 'get_balance':
            return await this.handleGetBalance();
          case 'get_address':
            return await this.handleGetAddress();
          case 'swap':
            return await this.handleSwap(args);
          case 'add_liquidity':
            return await this.handleAddLiquidity(args);
          case 'get_best_route':
            return await this.handleGetBestRoute(args);
          case 'get_strategy':
            return await this.handleGetStrategy();
          case 'set_strategy':
            return await this.handleSetStrategy(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        this.logger.error(`Tool ${name} failed:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //                        TOOL HANDLERS
  // ═══════════════════════════════════════════════════════════════

  private async handleGetBalance() {
    const balance = await this.config.walletManager.getBalance();
    return {
      content: [
        {
          type: 'text',
          text: `Wallet balance: ${formatEther(balance)} MNT`,
        },
      ],
    };
  }

  private async handleGetAddress() {
    const address = this.config.walletManager.getAddress();
    return {
      content: [
        {
          type: 'text',
          text: `Wallet address: ${address}`,
        },
      ],
    };
  }

  private async handleSwap(args: any) {
    const { tokenIn, tokenOut, amountIn, dex } = args;

    // This would call the strategy executor
    // For now, return a placeholder
    return {
      content: [
        {
          type: 'text',
          text: `Swap requested: ${amountIn} tokens from ${tokenIn} to ${tokenOut} on DEX ${dex}`,
        },
      ],
    };
  }

  private async handleAddLiquidity(args: any) {
    const { tokenA, tokenB, amountA, amountB, dex } = args;

    // This would call the strategy executor
    // For now, return a placeholder
    return {
      content: [
        {
          type: 'text',
          text: `Add liquidity requested: ${amountA} ${tokenA} + ${amountB} ${tokenB} on DEX ${dex}`,
        },
      ],
    };
  }

  private async handleGetBestRoute(args: any) {
    const { tokenIn, tokenOut, amountIn } = args;

    // This would call the strategy executor
    // For now, return a placeholder
    return {
      content: [
        {
          type: 'text',
          text: `Best route for ${amountIn} tokens from ${tokenIn} to ${tokenOut}: Merchant Moe (estimated)`,
        },
      ],
    };
  }

  private async handleGetStrategy() {
    return {
      content: [
        {
          type: 'text',
          text: `Current strategy: ${this.config.strategyEngine}`,
        },
      ],
    };
  }

  private async handleSetStrategy(args: any) {
    const { strategy } = args;

    // This would update the strategy engine config
    // For now, return a placeholder
    return {
      content: [
        {
          type: 'text',
          text: `Strategy set to: ${strategy}`,
        },
      ],
    };
  }
}
