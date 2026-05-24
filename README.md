# 🧠 Mantle Agent Wallet

> **Agentic Wallet Economy on Mantle Network** — Track 6: Turing Test Hackathon 2026

An autonomous AI agent wallet system built on Mantle Network **Mainnet**, leveraging ERC-8004 identity standard for trustless agent interactions and on-chain reputation.

## 🎯 What This Does

**Mantle Agent Wallet** enables AI agents to:
- Register on-chain identities via ERC-8004
- Execute autonomous DeFi strategies (swap, LP, yield farming)
- Build verifiable reputation through on-chain performance
- Operate across Mantle's DeFi ecosystem (Merchant Moe, Agni Finance, Fluxion)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         Agent Dashboard + Explorer               │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                  AI Agent Layer                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Strategy │  │ Wallet   │  │  MCP Server  │  │
│  │ Engine   │  │ Manager  │  │  (A2A Proto) │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │               │           │
│       └──────────────┼───────────────┘           │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│              Smart Contracts (Mantle)             │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ ERC-8004     │  │   AgenticWallet        │   │
│  │ Identity     │  │   - execute()          │   │
│  │ Registry     │  │   - batchExecute()     │   │
│  └──────────────┘  │   - setStrategy()      │   │
│  ┌──────────────┐  └────────────────────────┘   │
│  │ Reputation   │  ┌────────────────────────┐   │
│  │ Registry     │  │   StrategyExecutor     │   │
│  │ (ERC-8004)   │  │   - swap()             │   │
│  └──────────────┘  │   - addLiquidity()     │   │
│                    │   - harvest()           │   │
│                    └────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 🔑 Key Features

### 1. ERC-8004 Agent Identity
Every agent gets an on-chain identity NFT via ERC-8004 standard:
- Globally unique ID: `{namespace}:{chainId}:{registry}:{tokenId}`
- Portable across chains
- On-chain metadata (wallet, capabilities, endpoints)

### 2. Autonomous DeFi Strategies
Pre-built strategies for Mantle's ecosystem:
- **Swap Strategy**: Auto-execute trades on Merchant Moe / Agni Finance
- **LP Strategy**: Provide liquidity with auto-rebalancing
- **Yield Strategy**: Farm yields across protocols
- **Arbitrage Strategy**: Cross-DEX arbitrage detection

### 3. On-Chain Reputation
Agent performance tracked via ERC-8004 Reputation Registry:
- Trade success rate
- ROI tracking
- Uptime metrics
- Client feedback

### 4. MCP/A2A Protocol Support
Agents expose capabilities via Model Context Protocol:
- Standardized tool discovery
- Agent-to-agent communication
- x402 payment support

## 📁 Project Structure

```
mantle-agent-wallet/
├── contracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── AgenticWallet.sol
│   │   ├── StrategyExecutor.sol
│   │   └── interfaces/
│   ├── test/
│   └── foundry.toml
├── agent/                  # AI Agent framework
│   ├── src/
│   │   ├── agent.ts
│   │   ├── strategies/
│   │   ├── wallet.ts
│   │   └── mcp/
│   └── package.json
├── frontend/               # Dashboard
│   ├── src/
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (for smart contracts)
- **MNT tokens on Mantle Mainnet** (from Bybit/bridge)

### 1. Deploy Contracts
```bash
cd contracts
forge install
forge build
forge script script/Deploy.s.sol --rpc-url mantle --broadcast
```

### 2. Run Agent
```bash
cd agent
npm install
cp .env.example .env  # Add your private key
npm run start
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Network Config

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| **Mantle Mainnet** | **5000** | `https://rpc.mantle.xyz` | [mantlescan.xyz](https://mantlescan.xyz) |
| Mantle Sepolia (test) | 5003 | `https://rpc.sepolia.mantle.xyz` | [explorer.sepolia.mantle.xyz](https://explorer.sepolia.mantle.xyz) |

## 📜 ERC-8004 Contract Addresses

| Contract | Address |
|----------|---------|
| Identity Registry | `0x8004a169fb4a3325136eb29fa0ceb6d2e539a432` |
| Reputation Registry | `0x8004a169fb4a3325136eb29fa0ceb6d2e539a432` |

*Same address on all supported chains (deterministic deployment)*

## 🏆 Turing Test Hackathon 2026

This project is built for **Track 6: Agentic Wallets & Economy** of the [Mantle Turing Test Hackathon](https://dorahacks.io/hackathon/mantleturingtesthackathon2026).

### Judging Criteria
- **Innovation**: Novel approach to agentic wallet economies
- **Technical Execution**: Smart contract quality, agent reliability
- **Mantle Integration**: Deep integration with Mantle ecosystem
- **ERC-8004 Usage**: Proper use of agent identity standard

## 📄 License

MIT

---

Built with 🧠 by [ulsreall](https://github.com/ulsreall)
