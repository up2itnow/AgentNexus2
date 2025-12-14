// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AgentNexusEntitlements.sol";
import "../src/AgentNexusEscrow.sol";

/**
 * @title DeployMultiChain
 * @notice Deployment script for AgentNexus contracts across multiple chains
 * 
 * Usage:
 *   # Deploy to Base Sepolia (testnet)
 *   forge script script/DeployMultiChain.s.sol --rpc-url base_sepolia --broadcast --verify
 * 
 *   # Deploy to Arbitrum
 *   forge script script/DeployMultiChain.s.sol --rpc-url arbitrum --broadcast --verify
 * 
 *   # Deploy to Polygon
 *   forge script script/DeployMultiChain.s.sol --rpc-url polygon --broadcast --verify
 * 
 *   # Dry run (no broadcast)
 *   forge script script/DeployMultiChain.s.sol --rpc-url base_sepolia
 * 
 * Environment Variables Required:
 *   - DEPLOYER_PRIVATE_KEY: Private key for deployment
 *   - PLATFORM_FEE_RECIPIENT: Address to receive platform fees
 * 
 * @author AgentNexus Team
 */
contract DeployMultiChain is Script {
    // Deployment configuration
    uint256 public constant PLATFORM_FEE_BPS = 300; // 3% platform fee
    string public constant BASE_URI = "https://api.agentnexus.io/metadata/";

    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address platformFeeRecipient = vm.envAddress("PLATFORM_FEE_RECIPIENT");
        
        // Start broadcast for transaction submission
        vm.startBroadcast(deployerPrivateKey);

        // Deploy AgentNexusEntitlements
        AgentNexusEntitlements entitlements = new AgentNexusEntitlements(BASE_URI);
        console.log("AgentNexusEntitlements deployed at:", address(entitlements));

        // Deploy AgentNexusEscrow (takes 2 args: feeRecipient, feePercentage)
        AgentNexusEscrow escrow = new AgentNexusEscrow(
            platformFeeRecipient,
            PLATFORM_FEE_BPS
        );
        console.log("AgentNexusEscrow deployed at:", address(escrow));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("Chain ID:", block.chainid);
        console.log("Entitlements:", address(entitlements));
        console.log("Escrow:", address(escrow));
        console.log("Platform Fee Recipient:", platformFeeRecipient);
        console.log("Platform Fee:", PLATFORM_FEE_BPS, "bps");
        console.log("==========================");
    }
}
