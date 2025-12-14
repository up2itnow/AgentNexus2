// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AgentNexusEscrow.sol";
import "../src/AgentNexusEntitlements.sol";

/**
 * @title DeployBaseMainnet
 * @notice Base Mainnet deployment script for Sprint 1 - Operational Proof
 * @dev Run with: forge script script/DeployBaseMainnet.s.sol --rpc-url base --broadcast --verify
 * 
 * PREREQUISITES:
 * 1. Set PRIVATE_KEY in .env.base-mainnet (funded with ~0.01 ETH)
 * 2. Set BASE_RPC_URL (Alchemy recommended)
 * 3. Set ETHERSCAN_API_KEY for verification (BASESCAN_API_KEY is supported as an alias)
 * 4. Set PLATFORM_FEE_RECIPIENT (treasury address)
 * 
 * GRANT LANGUAGE UNLOCKED:
 * "Core payment contracts are deployed and verified on Base mainnet."
 */
contract DeployBaseMainnet is Script {
    // ============ Configuration ============
    
    // Base Mainnet USDC (Circle official)
    address public constant BASE_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    // Platform fee: 2.5% (250 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 250;
    
    // Metadata base URI for entitlements
    string public constant BASE_URI = "https://api.agentnexus.io/metadata/";

    // ============ Deployment ============

    function run() external {
        // Load configuration from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address platformFeeRecipient = vm.envOr("PLATFORM_FEE_RECIPIENT", deployer);

        console.log("========================================");
        console.log("AgentNexus Base Mainnet Deployment");
        console.log("Sprint 1: Operational Proof");
        console.log("========================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e15, "finney");
        console.log("Platform Fee Recipient:", platformFeeRecipient);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy AgentNexusEntitlements (ERC-1155)
        console.log("1. Deploying AgentNexusEntitlements...");
        AgentNexusEntitlements entitlements = new AgentNexusEntitlements(BASE_URI);
        console.log("   Address:", address(entitlements));

        // 2. Deploy AgentNexusEscrow
        console.log("2. Deploying AgentNexusEscrow...");
        AgentNexusEscrow escrow = new AgentNexusEscrow(
            platformFeeRecipient,
            PLATFORM_FEE_BPS
        );
        console.log("   Address:", address(escrow));

        // 3. Configure supported tokens
        console.log("3. Adding USDC as supported token...");
        escrow.setSupportedToken(BASE_USDC, true);
        console.log("   USDC:", BASE_USDC);

        vm.stopBroadcast();

        // ============ Deployment Summary ============
        console.log("");
        console.log("========================================");
        console.log("DEPLOYMENT SUCCESSFUL");
        console.log("========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  AgentNexusEscrow:", address(escrow));
        console.log("  AgentNexusEntitlements:", address(entitlements));
        console.log("");
        console.log("Configuration:");
        console.log("  Platform Fee: 2.5%");
        console.log("  Fee Recipient:", platformFeeRecipient);
        console.log("  Supported Token: USDC");
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Verify on BaseScan (automatic if --verify flag used)");
        console.log("  2. Grant ORCHESTRATOR_ROLE to backend server");
        console.log("  3. Grant MINTER_ROLE for entitlements");
        console.log("  4. Register initial agent (ID: 1) for demo");
        console.log("  5. Update backend .env with contract addresses");
        console.log("");
        console.log("========================================");
        console.log("GRANT CLAIM ENABLED:");
        console.log("'Core payment contracts are deployed and");
        console.log(" verified on Base mainnet.'");
        console.log("========================================");
    }
}

/**
 * @title RegisterDemoAgent
 * @notice Register the Summarizer agent for demo (run after deployment)
 * @dev Run with: forge script script/DeployBaseMainnet.s.sol:RegisterDemoAgent --rpc-url base --broadcast
 */
contract RegisterDemoAgent is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address escrowAddress = vm.envAddress("ESCROW_ADDRESS");
        address developerAddress = vm.envOr("DEVELOPER_ADDRESS", vm.addr(deployerPrivateKey));

        console.log("Registering Demo Agent (Summarizer)...");
        console.log("Escrow:", escrowAddress);
        console.log("Developer:", developerAddress);

        vm.startBroadcast(deployerPrivateKey);

        AgentNexusEscrow escrow = AgentNexusEscrow(escrowAddress);
        
        // Agent ID 1: Summarizer (Sprint 1 reference agent)
        escrow.registerAgent(1, developerAddress);
        console.log("Registered Agent ID 1 (Summarizer)");

        vm.stopBroadcast();
    }
}
