# 🤖 MantleAgent

> Autonomous AI Agent Wallet on Mantle Network — ERC-8004 Identity + DeFi Strategies

[![Mantle](https://img.shields.io/badge/Mantle-Mainnet-black)](https://mantlescan.xyz)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-Registered-blue)](https://8004scan.io)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)](https://mantle-agent.vercel.app)
[![YouTube](https://img.shields.io/badge/Demo-YouTube-red)](https://youtu.be/I_wQ65R0bok)

## 🎬 Demo Video

[![MantleAgent Demo](https://img.youtube.com/vi/I_wQ65R0bok/maxresdefault.jpg)](https://youtu.be/I_wQ65R0bok)

**MantleAgent** is an autonomous AI agent wallet that executes DeFi strategies on Mantle Mainnet. It integrates **ERC-8004 identity** for verifiable on-chain reputation and implements **4 autonomous strategies** to maximize returns.

Built for **[The Turing Test Hackathon 2026](https://dorahacks.io/hackathon/mantleturingtesthackathon2026)** — Track 6: Agentic Wallets & Economy.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MantleAgent                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   AI Agent   │  │  Swap Engine │  │  Strategies  │  │
│  │  (TypeScript)│──│  (Agni V3)   │──│  DCA/Grid/   │  │
│  │              │  │  (Merch Moe) │  │  Arb/SL-TP   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Agentic     │  │  ERC-8004    │  │  Dashboard   │  │
│  │  Wallet      │  │  Identity    │  │  (React)     │  │
│  │  (Solidity)  │  │  Registry    │  │  + API       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Mantle Mainnet (Chain ID: 5000)      │
└─────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🎯 4 Autonomous Strategies

| Strategy | Risk | Description |
|----------|------|-------------|
| 📊 **DCA** | Low | Auto-buy fixed MNT at regular intervals |
| 📐 **Grid Trading** | Medium | Buy/sell at predefined price levels |
| 🔍 **Arbitrage** | Low | Scan Agni vs Merchant Moe for spreads |
| 🛡️ **Stop Loss/TP** | Low | Auto-sell at price thresholds |

### 🔧 Core Features

- **🪪 ERC-8004 Identity** — On-chain agent identity with verifiable reputation
- **🔀 Autonomous Swaps** — Execute swaps on Agni Finance & Merchant Moe
- **📈 Multi-DEX Routing** — Best rate discovery across DEXes
- **🛡️ On-chain Wallet** — Smart contract wallet with owner controls
- **📊 Live Dashboard** — Real-time stats, strategy control, activity log
- **🔌 REST API** — Backend endpoints for quotes, strategies, stats

## 📁 Project Structure

```
mantle-agent-wallet/
├── agent/                  # TypeScript AI Agent
│   └── src/
│       ├── agent.ts        # CLI interface
│       ├── swap.ts         # Swap executor (Agni V3)
│       ├── compound.ts     # Compound yield strategy
│       ├── config.ts       # Network & contract config
│       └── strategies/     # 4 Autonomous strategies
│           ├── dca.ts      # Dollar Cost Average
│           ├── grid.ts     # Grid Trading
│           ├── arbitrage.ts # Arbitrage Scanner
│           └── stoploss.ts # Stop Loss / Take Profit
├── contracts/              # Solidity Smart Contracts
│   └── src/
│       └── AgenticWallet.sol  # Agent wallet contract
├── frontend/               # React Dashboard + API
│   ├── api/                # Vercel Serverless Functions
│   │   ├── quote.ts        # Price quotes
│   │   ├── strategy.ts     # Strategy recommendations
│   │   └── stats.ts        # Wallet stats
│   └── src/
│       ├── pages/
│       │   └── Dashboard.tsx
│       └── index.css
├── agent-metadata.json     # ERC-8004 metadata
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Foundry (for smart contracts)
- Mantle Mainnet MNT (for gas & swaps)

### 1. Install Dependencies

```bash
# Agent
cd agent && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your private key
```

### 3. Run Agent

```bash
cd agent

# Check status
npx tsx src/agent.ts status

# Run compound strategy (0.05 MNT, 1 iteration)
npx tsx src/agent.ts compound 0.05 1

# Execute a swap
npx tsx src/agent.ts swap 0x0000000000000000000000000000000000000000 0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE 0.05
```

### 4. Run Dashboard

```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Wallet balance, price, tx count |
| `/api/strategy?balance=X` | GET | Strategy recommendations |
| `/api/quote?amount=X` | GET | DEX price quotes |

### Example Response

```json
// GET /api/stats
{
  "success": true,
  "address": "0x3417...793B",
  "balance": { "mnt": "2.7920", "usd": "1.83" },
  "mntPrice": 0.6544,
  "txCount": 34,
  "erc8004": { "tokenId": 98, "network": "mantle" }
}
```

## 🔧 Smart Contract

### AgenticWallet

Deployed at: [`0xb22c73495353fe732CAFD4dbFFD6500939BB9507`](https://mantlescan.xyz/address/0xb22c73495353fe732CAFD4dbFFD6500939BB9507)

```solidity
// Core functions
function execute(address target, bytes data, uint256 value) external;
function batchExecute(address[] targets, bytes[] datas, uint256[] values) external;
function getBalance() external view returns (uint256);
function getPnL() external view returns (int256);
function setStrategy(bytes32 strategyId) external;
function withdraw(address to, uint256 amount) external;
```

### ERC-8004 Identity

- **Registry:** [`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`](https://mantlescan.xyz/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432)
- **Token ID:** #98
- **Agent URI:** [agent-metadata.json](./agent-metadata.json)

## 📊 Live Test Results

### On-Chain Activity

```
✅ 40 transactions on Mantle Mainnet
✅ ERC-8004 Identity registered (Token #98)
✅ Smart contract deployed
✅ DCA strategy tested (real swap)
✅ Grid Trading tested (real swap)
✅ Stop Loss tested (real swap)
✅ Arbitrage scanner ready
```

### Strategy Test Results (Real On-Chain)

| Strategy | Status | TX Hash |
|----------|--------|---------|
| DCA Buy | ✅ Confirmed | `0xf194796d...ba71f` |
| Grid Buy | ✅ Confirmed | `0x3b084074...e016` |
| Stop Loss | ✅ Confirmed | `0xcd8cbd98...e5596` |
| Arbitrage | 🔍 Ready | Scanning... |

### Strategy Configs (from API)

```
📊 DCA:           0.14 MNT/hour, max 20 buys
📐 Grid Trading:  $0.62-0.69 range, 5 levels
🔍 Arbitrage:     >0.3% spread trigger
🛡️ Stop Loss:     -10% / +15% / 5% trailing
```

## 🗺️ Contract Addresses (Mantle Mainnet)

| Contract | Address |
|----------|---------|
| AgenticWallet | `0xb22c73495353fe732CAFD4dbFFD6500939BB9507` |
| ERC-8004 Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Agni Router | `0x319b69888b0d11cec22caa5034e25fffbdc88421` |
| Merchant Moe Router | `0x88a8984f2b8507bbc1c699594e3a4ecdefed4784` |
| WMNT | `0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8` |
| USDT | `0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE` |

## 🎯 Hackathon Track

**Track 6: Agentic Wallets & Economy**

This project demonstrates:
1. ✅ ERC-8004 agent identity registration
2. ✅ 4 autonomous DeFi strategies
3. ✅ Multi-DEX routing (Agni V3 + Merchant Moe)
4. ✅ On-chain P&L tracking
5. ✅ Smart contract wallet with owner controls
6. ✅ REST API for strategy recommendations
7. ✅ Real mainnet swaps (34 transactions)

## 🛠️ Tech Stack

- **Smart Contracts:** Solidity 0.8.26 + Foundry
- **Agent:** TypeScript + ethers.js v6
- **Frontend:** React 19 + Vite
- **Backend:** Vercel Serverless Functions
- **DEX:** Agni Finance + Merchant Moe (Uniswap V3 forks)
- **Identity:** ERC-8004 Trustless Agents
- **Network:** Mantle Mainnet (Chain ID: 5000)

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Live Dashboard](https://mantle-agent.vercel.app)
- [Demo Video](https://youtu.be/I_wQ65R0bok)
- [8004scan Profile](https://8004scan.io/agents/mantle/98)
- [Mantlescan Contract](https://mantlescan.xyz/address/0xb22c73495353fe732CAFD4dbFFD6500939BB9507)
- [GitHub Repository](https://github.com/ulsreall/mantle-agent-wallet)
- [Hackathon Page](https://dorahacks.io/hackathon/mantleturingtesthackathon2026)

---

Built with 🤖 by [@ulsreall](https://github.com/ulsreall) for The Turing Test Hackathon 2026
