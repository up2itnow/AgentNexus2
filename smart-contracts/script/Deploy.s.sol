// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AgentNexusEscrow.sol";
import "../src/AgentNexusEntitlements.sol";

/**
 * @title DeployScript
 * @notice Deployment script for AgentNexus smart contracts on Base L2
 * @dev Run with: forge script script/Deploy.s.sol:DeployScript --rpc-url base-sepolia --broadcast --verify
 */
contract DeployScript is Script {
    // Configuration
    address public constant PLATFORM_FEE_RECIPIENT = 0x742d35cC6634c0532925A3b844bc9E7595F0beB1; // Replace with actual
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    string public constant BASE_URI = "https://api.agentnexus.io/metadata/";
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Escrow
        console.log("\n=== Deploying AgentNexusEscrow ===");
        AgentNexusEscrow escrow = new AgentNexusEscrow(
            PLATFORM_FEE_RECIPIENT,
            PLATFORM_FEE_BPS
        );
        console.log("AgentNexusEscrow deployed at:", address(escrow));
        
        // Deploy Entitlements
        console.log("\n=== Deploying AgentNexusEntitlements ===");
        AgentNexusEntitlements entitlements = new AgentNexusEntitlements(BASE_URI);
        console.log("AgentNexusEntitlements deployed at:", address(entitlements));
        
        // Setup initial configuration
        console.log("\n=== Initial Configuration ===");
        
        // Add supported tokens (USDC, USDT on Base)
        address usdcBase = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base USDC
        address usdtBase = 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2; // Base USDT (if available)
        
        escrow.setSupportedToken(usdcBase, true);
        console.log("Added USDC as supported token");
        
        if (usdtBase != address(0)) {
            escrow.setSupportedToken(usdtBase, true);
            console.log("Added USDT as supported token");
        }
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Base Sepolia (or Base Mainnet)");
        console.log("Deployer:", deployer);
        console.log("AgentNexusEscrow:", address(escrow));
        console.log("AgentNexusEntitlements:", address(entitlements));
        console.log("Platform Fee:", PLATFORM_FEE_BPS, "bps (2.5%)");
        console.log("Platform Fee Recipient:", PLATFORM_FEE_RECIPIENT);
        console.log("\n=== Next Steps ===");
        console.log("1. Verify contracts on BaseScan");
        console.log("2. Grant ORCHESTRATOR_ROLE to backend");
        console.log("3. Grant MINTER_ROLE to backend");
        console.log("4. Grant BURNER_ROLE to backend");
        console.log("5. Register initial agents");
        console.log("6. Update backend .env with contract addresses");
    }
}

/**
 * @title TestnetDeployScript  
 * @notice Deployment script for Base Sepolia testnet with mock tokens
 */
contract TestnetDeployScript is Script {
    address public constant PLATFORM_FEE_RECIPIENT = 0x742d35cC6634c0532925A3b844bc9E7595F0beB1; // Replace
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    string public constant BASE_URI = "https://testnet-api.agentnexus.io/metadata/";
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to Base Sepolia testnet");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        AgentNexusEscrow escrow = new AgentNexusEscrow(
            PLATFORM_FEE_RECIPIENT,
            PLATFORM_FEE_BPS
        );
        
        AgentNexusEntitlements entitlements = new AgentNexusEntitlements(BASE_URI);
        
        // For testnet, we can deploy mock ERC20 tokens
        console.log("Deployed AgentNexusEscrow:", address(escrow));
        console.log("Deployed AgentNexusEntitlements:", address(entitlements));
        
        // Setup test tokens (Base Sepolia faucet tokens)
        // You can get testnet USDC from Base Sepolia faucet
        address testUSDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e; // Base Sepolia USDC
        
        if (testUSDC != address(0)) {
            escrow.setSupportedToken(testUSDC, true);
            console.log("Added testnet USDC as supported token");
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== Testnet Deployment Complete ===");
        console.log("AgentNexusEscrow:", address(escrow));
        console.log("AgentNexusEntitlements:", address(entitlements));
        console.log("\nGet testnet tokens from: https://www.base.org/faucet");
    }
}

