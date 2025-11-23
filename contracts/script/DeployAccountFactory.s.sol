// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import "../src/AgentNexusAccountFactory.sol";
import "../src/AgentNexusAccount.sol";

/**
 * @title DeployAccountFactory
 * @dev Deployment script for AgentNexusAccountFactory and related contracts
 * @notice This script deploys the account factory to Base Sepolia testnet
 */
contract DeployAccountFactory is Script {
    // EntryPoint address for Base Sepolia (ERC-4337 v0.6)
    address constant ENTRY_POINT = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    function run() external {
        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deploying AgentNexusAccountFactory...");
        console.log("EntryPoint:", ENTRY_POINT);
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy account factory
        AgentNexusAccountFactory factory = new AgentNexusAccountFactory(
            ENTRY_POINT
        );
        console.log("Account factory deployed at:", address(factory));

        vm.stopBroadcast();

        // Verify deployment
        console.log("\n=== Deployment Summary ===");

        console.log("Account Factory:", address(factory));
        console.log("Entry Point:", ENTRY_POINT);
        console.log("Owner:", factory.owner());

        // Test account creation
        bytes32 testSalt = keccak256("test@example.com");
        address predictedAccount = factory.getAccountAddress(address(this), testSalt);
        console.log("Predicted account address:", predictedAccount);

        // Actually create the account
        address createdAccount = factory.createAccount(address(this), testSalt);
        console.log("Created account address:", createdAccount);
        console.log("Account creation successful:", createdAccount == predictedAccount);
    }
}
