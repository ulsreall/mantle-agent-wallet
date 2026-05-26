const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mantle.xyz';
const CONTRACT_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const TOKEN_ID = 98;

const ABI = [
  'function ownerOf(uint256 tokenId) external view returns (address owner)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  const owner = await contract.ownerOf(TOKEN_ID);
  console.log(`Owner of token ${TOKEN_ID}: ${owner}`);
}

main().catch(console.error);
