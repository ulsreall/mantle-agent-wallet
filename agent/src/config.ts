import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════
//                    MANTLE MAINNET CONFIG
// ═══════════════════════════════════════════════════════════════

export const MANTLE_CONFIG = {
  chainId: 5000,
  rpcUrl: 'https://rpc.mantle.xyz',
  name: 'Mantle Mainnet',
};

// ═══════════════════════════════════════════════════════════════
//                    CONTRACT ADDRESSES
// ═══════════════════════════════════════════════════════════════

export const ADDRESSES = {
  // Tokens
  WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
  USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
  USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
  USDe: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
  
  // DEX Routers
  agniRouter: '0x319b69888b0d11cec22caa5034e25fffbdc88421',
  merchantMoeRouter: '0x88a8984f2b8507bbc1c699594e3a4ecdefed4784',
  
  // Agni Factory
  agniFactory: '0x25780dc8Fc3cfBD75F33bFDAB65e969b603b2035',
  
  // ERC-8004
  identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  
  // Our contracts
  agenticWallet: '0xb22c73495353fe732CAFD4dbFFD6500939BB9507',
};

// ═══════════════════════════════════════════════════════════════
//                    ABIs
// ═══════════════════════════════════════════════════════════════

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
  'function transfer(address, uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export const WMNT_ABI = [
  ...ERC20_ABI,
  'function deposit() payable',
  'function withdraw(uint256)',
];

// Agni V3 Router (Uniswap V3 style)
export const AGNI_ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
  'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory)',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
  'function refundETH() external payable',
];

// Merchant Moe Router (Liquidity Book style - similar to Trader Joe)
export const MERCHANT_MOE_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address pairBinSteps, address to, uint256 deadline) external returns (uint256 amountOut, uint256[] memory fees)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address pairBinSteps, address to, uint256 deadline) external payable returns (uint256 amountOut, uint256[] memory fees)',
  'function swapETHForExactTokens(uint256 amountOut, address[] calldata path, address pairBinSteps, address to, uint256 deadline) external payable returns (uint256[] memory amounts, uint256[] memory fees)',
];

export const AGENTIC_WALLET_ABI = [
  'function execute(address target, bytes data, uint256 value) returns (bool success, bytes result)',
  'function batchExecute(address[] targets, bytes[] datas, uint256[] values) returns (bool[] successes, bytes[] results)',
  'function getBalance() view returns (uint256)',
  'function getPnL() view returns (int256)',
  'function recordProfit(int256 profit)',
  'function owner() view returns (address)',
  'function agentId() view returns (uint256)',
  'function activeStrategy() view returns (bytes32)',
  'function setStrategy(bytes32 strategyId)',
  'function registerStrategy(bytes32 strategyId, address executor)',
  'function withdraw(address to, uint256 amount)',
];

// ═══════════════════════════════════════════════════════════════
//                    HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrl);
}

export function getWallet(privateKey: string, provider: ethers.JsonRpcProvider): ethers.Wallet {
  return new ethers.Wallet(privateKey, provider);
}

export function getTokenContract(address: string, provider: ethers.JsonRpcProvider): ethers.Contract {
  return new ethers.Contract(address, ERC20_ABI, provider);
}

export function getAgniRouter(provider: ethers.JsonRpcProvider): ethers.Contract {
  return new ethers.Contract(ADDRESSES.agniRouter, AGNI_ROUTER_ABI, provider);
}

export function getMerchantMoeRouter(provider: ethers.JsonRpcProvider): ethers.Contract {
  return new ethers.Contract(ADDRESSES.merchantMoeRouter, MERCHANT_MOE_ROUTER_ABI, provider);
}

// Encode path for Agni V3 swaps
export function encodePath(tokenIn: string, tokenOut: string, fee: number = 500): string {
  return ethers.solidityPacked(
    ['address', 'uint24', 'address'],
    [tokenIn, fee, tokenOut]
  );
}

// Get deadline (current time + buffer)
export function getDeadline(minutes: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
}
