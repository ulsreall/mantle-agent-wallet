// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/AgenticWallet.sol";
import "../src/StrategyExecutor.sol";

/// @title Deploy Script for Mantle Agent Wallet
/// @notice Deploys all contracts to Mantle Network Mainnet
contract DeployScript is Script {
    // ═══════════════════════════════════════════════════════════════
    //                     NETWORK CONFIGS
    // ═══════════════════════════════════════════════════════════════

    // ERC-8004 Registry addresses (same on all chains)
    address constant ERC8004_IDENTITY = 0x8004a169fb4a3325136eb29fa0ceb6d2e539a432;
    address constant ERC8004_REPUTATION = 0x8004a169fb4a3325136eb29fa0ceb6d2e539a432;

    // Mantle Mainnet DEX Routers
    // Merchant Moe: https://merchant.moe
    address constant MERCHANT_MOE_ROUTER = 0x7298A67Ef4A888836EEb8C0BF1DF27a172C0F77A;
    
    // Agni Finance: https://agni.finance
    address constant AGNI_ROUTER = 0x7298A67Ef4A888836EEb8C0BF1DF27a172C0F77A;
    
    // Fluxion: https://fluxion.network
    address constant FLUXION_ROUTER = 0x7298A67Ef4A888836EEb8C0BF1DF27a172C0F77A;

    // ═══════════════════════════════════════════════════════════════
    //                     DEX IDENTIFIERS
    // ═══════════════════════════════════════════════════════════════

    uint8 constant DEX_MERCHANT_MOE = 0;
    uint8 constant DEX_AGNI = 1;
    uint8 constant DEX_FLUXION = 2;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying to Mantle Mainnet (Chain ID: 5000)");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // ═══════════════════════════════════════════════════════════
        // 1. Deploy StrategyExecutor
        // ═══════════════════════════════════════════════════════════
        console.log("\n=== Deploying StrategyExecutor ===");

        // StrategyExecutor needs wallet address, but wallet doesn't exist yet
        // We'll deploy with a placeholder and update after wallet deployment
        StrategyExecutor executor = new StrategyExecutor(deployer); // placeholder
        console.log("StrategyExecutor deployed at:", address(executor));

        // Configure DEX routers
        console.log("Configuring DEX routers...");
        executor.setDEXRouter(DEX_MERCHANT_MOE, MERCHANT_MOE_ROUTER);
        executor.setDEXRouter(DEX_AGNI, AGNI_ROUTER);
        executor.setDEXRouter(DEX_FLUXION, FLUXION_ROUTER);
        console.log("DEX routers configured");

        // ═══════════════════════════════════════════════════════════
        // 2. Deploy AgenticWallet
        // ═══════════════════════════════════════════════════════════
        console.log("\n=== Deploying AgenticWallet ===");

        // For hackathon, we'll create a new agent ID
        // In production, this would be an existing ERC-8004 token ID
        uint256 agentId = 0; // Will be set after ERC-8004 registration

        AgenticWallet wallet = new AgenticWallet(
            deployer,
            agentId,
            ERC8004_IDENTITY,
            ERC8004_REPUTATION
        );
        console.log("AgenticWallet deployed at:", address(wallet));

        // ═══════════════════════════════════════════════════════════
        // 3. Register Strategy
        // ═══════════════════════════════════════════════════════════
        console.log("\n=== Registering Strategy ===");

        bytes32 strategyId = keccak256("default-defi-strategy");
        wallet.registerStrategy(strategyId, address(executor));
        wallet.setStrategy(strategyId);
        console.log("Default strategy registered and activated");

        vm.stopBroadcast();

        // ═══════════════════════════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════════════════════════
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Mantle Mainnet (5000)");
        console.log("StrategyExecutor:", address(executor));
        console.log("AgenticWallet:", address(wallet));
        console.log("Deployer:", deployer);
        console.log("\nNext steps:");
        console.log("1. Register agent on ERC-8004 Identity Registry");
        console.log("2. Fund wallet with MNT");
        console.log("3. Configure agent strategies");
        console.log("4. Start agent: npm run agent:start");
    }
}
