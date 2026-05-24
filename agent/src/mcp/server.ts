// SPDX-License-Identifier: MIT
import { Logger } from 'pino';
import { WalletManager } from '../wallet';
import { StrategyEngine } from '../strategies/engine';

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
//                        MCP SERVER (Simplified)
// ═══════════════════════════════════════════════════════════════

export class MCPServer {
  private config: MCPServerConfig;
  private logger: Logger;
  private isRunning: boolean = false;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.logger = config.logger;
  }

  async start() {
    this.logger.info(`MCP server starting on port ${this.config.port}...`);
    this.isRunning = true;
    this.logger.info('MCP server started (simplified mode)');
  }

  async stop() {
    this.logger.info('MCP server stopped');
    this.isRunning = false;
  }

  getStatus() {
    return {
      running: this.isRunning,
      port: this.config.port,
    };
  }
}
