// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/AgenticWallet.sol";

contract DeployAgenticWallet is Script {
    // ERC-8004 Identity Registry on Mantle Mainnet
    address constant IDENTITY_REGISTRY = 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying AgenticWallet...");
        console.log("Deployer:", deployer);
        console.log("Identity Registry:", IDENTITY_REGISTRY);

        vm.startBroadcast(deployerPrivateKey);

        AgenticWallet wallet = new AgenticWallet(deployer, IDENTITY_REGISTRY);

        console.log("AgenticWallet deployed at:", address(wallet));
        console.log("Owner:", wallet.owner());
        console.log("Identity Registry:", wallet.identityRegistry());

        vm.stopBroadcast();
    }
}
