const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://rpc.mantle.xyz';
const WALLET_FILE = '/root/.hermes/credentials/mantle-hackathon-wallet.json';
const CONTRACT_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const TOKEN_ID = 98;
const NEW_MCP_ENDPOINT = 'https://mantle-agent.vercel.app/api/mcp';

// ABI for setMetadata
const ABI = [
  'function setMetadata(uint256 tokenId, string calldata key, string calldata value) external',
  'function getMetadata(uint256 tokenId, string calldata key) external view returns (string memory value)'
];

async function main() {
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
  const PRIVATE_KEY = walletData.privateKey;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log(`Using wallet: ${wallet.address}`);
  console.log(`Updating MCP endpoint for token ${TOKEN_ID}...`);
  console.log(`New endpoint: ${NEW_MCP_ENDPOINT}`);

  // Update the MCP endpoint
  const tx = await contract.setMetadata(TOKEN_ID, 'mcp_endpoint', NEW_MCP_ENDPOINT);
  console.log(`Transaction sent: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  // Verify the update
  const updatedEndpoint = await contract.getMetadata(TOKEN_ID, 'mcp_endpoint');
  console.log(`Verified MCP endpoint: ${updatedEndpoint}`);
}

main().catch(console.error);
