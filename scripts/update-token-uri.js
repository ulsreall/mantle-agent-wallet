const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://rpc.mantle.xyz';
const WALLET_FILE = '/root/.hermes/credentials/mantle-hackathon-wallet.json';
const CONTRACT_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const TOKEN_ID = 98;
const NEW_URI = 'https://raw.githubusercontent.com/ulsreall/mantle-agent-wallet/main/agent-metadata.json';

// ABI for tokenURI
const ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function setTokenURI(uint256 tokenId, string calldata uri) external'
];

async function main() {
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
  const PRIVATE_KEY = walletData.privateKey;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log(`Using wallet: ${wallet.address}`);
  
  // Check current URI
  try {
    const currentURI = await contract.tokenURI(TOKEN_ID);
    console.log(`Current token URI: ${currentURI}`);
  } catch (e) {
    console.log(`Could not read current URI: ${e.message}`);
  }

  console.log(`\nAttempting to update token URI...`);
  console.log(`New URI: ${NEW_URI}`);

  // Try to update the token URI
  const tx = await contract.setTokenURI(TOKEN_ID, NEW_URI);
  console.log(`Transaction sent: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  // Verify the update
  const updatedURI = await contract.tokenURI(TOKEN_ID);
  console.log(`Verified token URI: ${updatedURI}`);
}

main().catch(console.error);
