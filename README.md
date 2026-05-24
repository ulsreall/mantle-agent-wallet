# 🤖 MantleAgent

> Autonomous AI Agent Wallet on Mantle Network — ERC-8004 Identity + DeFi Strategies

[![Mantle](https://img.shields.io/badge/Mantle-Mainnet-black)](https://mantlescan.xyz)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-Registered-blue)](https://8004scan.io)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)](https://mantle-agent.vercel.app)
[![YouTube](https://img.shields.io/badge/Demo-YouTube-red)](https://youtu.be/I_wQ65R0bok)

## 🎬 Demo Video

[![MantleAgent Demo](https://img.youtube.com/vi/I_wQ65R0bok/maxresdefault.jpg)](https://youtu.be/I_wQ65R0bok)

**MantleAgent** is an autonomous AI agent wallet that executes DeFi strategies on Mantle Mainnet. It integrates **ERC-8004 identity** for verifiable on-chain reputation and implements **compound yield farming** to maximize returns.

Built for **[The Turing Test Hackathon 2026](https://dorahacks.io/hackathon/mantleturingtesthackathon2026)** — Track 6: Agentic Wallets & Economy.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MantleAgent                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   AI Agent   │  │  Swap Engine │  │  Compound    │  │
│  │  (TypeScript)│──│  (Agni V3)   │──│  Strategy    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Agentic     │  │  ERC-8004    │  │  Dashboard   │  │
│  │  Wallet      │  │  Identity    │  │  (React)     │  │
│  │  (Solidity)  │  │  Registry    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Mantle Mainnet (Chain ID: 5000)      │
└─────────────────────────────────────────────────────────┘
```

## ✨ Features

- **🪪 ERC-8004 Identity** — On-chain agent identity with verifiable reputation
- **🔀 Autonomous Swaps** — Execute swaps on Agni Finance (Uniswap V3 fork)
- **📈 Compound Strategy** — Auto-reinvest profits (MNT → USDT → MNT)
- **🎯 Smart Routing** — Best rate discovery across DEXes
- **🛡️ On-chain Wallet** — Smart contract wallet with owner controls
- **📊 Live Dashboard** — Real-time P&L and strategy monitoring

## 📁 Project Structure

```
mantle-agent-wallet/
├── agent/                  # TypeScript AI Agent
│   └── src/
│       ├── agent.ts        # CLI interface
│       ├── swap.ts         # Swap executor (Agni V3)
│       ├── compound.ts     # Compound yield strategy
│       └── config.ts       # Network & contract config
├── contracts/              # Solidity Smart Contracts
│   └── src/
│       └── AgenticWallet.sol  # Agent wallet contract
├── frontend/               # React Dashboard
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
export DEPLOYER_PRIVATE_KEY="your_private_key_here"
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

### Compound Strategy (Round-Trip Swap)

```
🏦 Starting: 3.5844 MNT
🔀 Swap 1:  MNT → USDT (Agni, fee 500)
🔀 Swap 2:  USDT → MNT (Agni, fee 500)
🏁 Final:    3.6104 MNT
💰 Profit:   +0.0260 MNT
📊 ROI:      +0.72%
```

**TX Hashes:**
- Wrap & Approve: `0xf84eec05...` / `0x58759561...`
- Swap WMNT→USDT: `0x7fe9517b...`
- ERC-8004 Register: `0xe60a7b1d...`

## 🗺️ Contract Addresses (Mantle Mainnet)

| Contract | Address |
|----------|---------|
| AgenticWallet | `0xb22c73495353fe732CAFD4dbFFD6500939BB9507` |
| ERC-8004 Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Agni Router | `0x319b69888b0d11cec22caa5034e25fffbdc88421` |
| Agni Factory | `0x25780dc8Fc3cfBD75F33bFDAB65e969b603b2035` |
| WMNT | `0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8` |
| USDT | `0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE` |
| USDC | `0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9` |

## 🎯 Hackathon Track

**Track 6: Agentic Wallets & Economy**

This project demonstrates:
1. ✅ ERC-8004 agent identity registration
2. ✅ Autonomous DeFi strategy execution
3. ✅ On-chain P&L tracking
4. ✅ Smart contract wallet with owner controls
5. ✅ Real mainnet swaps with compound yields

## 🛠️ Tech Stack

- **Smart Contracts:** Solidity 0.8.26 + Foundry
- **Agent:** TypeScript + ethers.js v6
- **Frontend:** React 19 + Vite
- **DEX:** Agni Finance (Uniswap V3 fork)
- **Identity:** ERC-8004 Trustless Agents
- **Network:** Mantle Mainnet (Chain ID: 5000)

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Live Dashboard](https://mantle-agent.vercel.app)
- [8004scan Profile](https://8004scan.io/agents/mantle/98)
- [Mantlescan Contract](https://mantlescan.xyz/address/0xb22c73495353fe732CAFD4dbFFD6500939BB9507)
- [GitHub Repository](https://github.com/ulsreall/mantle-agent-wallet)
- [Hackathon Page](https://dorahacks.io/hackathon/mantleturingtesthackathon2026)

---

Built with 🤖 by [@ulsreall](https://github.com/ulsreall) for The Turing Test Hackathon 2026
