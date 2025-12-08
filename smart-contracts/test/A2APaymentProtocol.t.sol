// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/A2APaymentProtocol.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract A2APaymentProtocolTest is Test {
    A2APaymentProtocol public a2a;
    MockUSDC public usdc;
    
    address public admin = address(this);
    address public dev1 = address(0x1);
    address public dev2 = address(0x2);
    address public dev3 = address(0x3);
    address public user = address(0x100);
    address public feeRecipient = address(0xFEE);
    
    uint256 public constant FEE_BPS = 250; // 2.5%
    
    function setUp() public {
        // Deploy contracts
        a2a = new A2APaymentProtocol(feeRecipient, FEE_BPS);
        usdc = new MockUSDC();
        
        // Setup token support
        a2a.setSupportedToken(address(usdc), true);
        
        // Fund user
        usdc.transfer(user, 10000 * 10**6);
        
        // Approve A2A contract for user
        vm.prank(user);
        usdc.approve(address(a2a), type(uint256).max);
    }
    
    // ============ Pipeline Creation Tests ============
    
    function test_CreatePipeline_Sequential() public {
        // Create a 3-agent sequential pipeline (stages 0, 1, 2)
        uint256[] memory agentIds = new uint256[](3);
        address[] memory developers = new address[](3);
        uint256[] memory paymentBps = new uint256[](3);
        uint256[] memory stageIndices = new uint256[](3);
        uint256[] memory maxRetries = new uint256[](3);
        bytes32[] memory conditions = new bytes32[](3);
        
        agentIds[0] = 1; agentIds[1] = 2; agentIds[2] = 3;
        developers[0] = dev1; developers[1] = dev2; developers[2] = dev3;
        paymentBps[0] = 4000; paymentBps[1] = 3000; paymentBps[2] = 3000; // 100%
        stageIndices[0] = 0; stageIndices[1] = 1; stageIndices[2] = 2;
        
        bytes32 pipelineId = a2a.createPipeline(
            agentIds,
            developers,
            paymentBps,
            stageIndices,
            maxRetries,
            conditions,
            address(usdc),
            0 // no timeout
        );
        
        assertNotEq(pipelineId, bytes32(0), "Pipeline ID should not be zero");
        
        // Check pipeline status
        assertEq(uint8(a2a.getPipelineStatus(pipelineId)), 0, "Status should be Created");
    }
    
    function test_CreatePipeline_Parallel() public {
        // Create a pipeline with parallel execution (agents 2 & 3 in same stage)
        uint256[] memory agentIds = new uint256[](3);
        address[] memory developers = new address[](3);
        uint256[] memory paymentBps = new uint256[](3);
        uint256[] memory stageIndices = new uint256[](3);
        uint256[] memory maxRetries = new uint256[](3);
        bytes32[] memory conditions = new bytes32[](3);
        
        agentIds[0] = 1; agentIds[1] = 2; agentIds[2] = 3;
        developers[0] = dev1; developers[1] = dev2; developers[2] = dev3;
        paymentBps[0] = 4000; paymentBps[1] = 3000; paymentBps[2] = 3000;
        stageIndices[0] = 0; stageIndices[1] = 1; stageIndices[2] = 1; // Stage 1 runs in parallel
        
        bytes32 pipelineId = a2a.createPipeline(
            agentIds,
            developers,
            paymentBps,
            stageIndices,
            maxRetries,
            conditions,
            address(usdc),
            0
        );
        
        assertNotEq(pipelineId, bytes32(0));
    }
    
    // ============ Funding Tests ============
    
    function test_FundPipeline() public {
        bytes32 pipelineId = _createSimplePipeline();
        
        uint256 amount = 100 * 10**6; // 100 USDC
        uint256 userBalanceBefore = usdc.balanceOf(user);
        
        vm.prank(user);
        a2a.fundPipeline(pipelineId, amount);
        
        // Check status changed to Funded
        assertEq(uint8(a2a.getPipelineStatus(pipelineId)), 1, "Status should be Funded");
        
        // Check tokens transferred
        assertEq(usdc.balanceOf(user), userBalanceBefore - amount, "User balance should decrease");
        assertEq(usdc.balanceOf(address(a2a)), amount, "Contract should hold tokens");
    }
    
    // ============ Execution Tests ============
    
    function test_ExecutePipeline_FullFlow() public {
        bytes32 pipelineId = _createSimplePipeline();
        uint256 amount = 100 * 10**6;
        
        // Fund pipeline
        vm.prank(user);
        a2a.fundPipeline(pipelineId, amount);
        
        // Start step 0
        a2a.startStep(pipelineId, 0);
        
        // Complete step 0
        uint256 dev1BalanceBefore = usdc.balanceOf(dev1);
        a2a.completeStep(pipelineId, 0, bytes32(0));
        
        // Dev1 should receive payment (40% of 97.5% = ~39 USDC)
        uint256 netAmount = amount * (10000 - FEE_BPS) / 10000;
        uint256 expectedPayment = netAmount * 4000 / 10000;
        assertEq(usdc.balanceOf(dev1), dev1BalanceBefore + expectedPayment, "Dev1 should receive payment");
        
        // Execute remaining steps
        a2a.startStep(pipelineId, 1);
        a2a.completeStep(pipelineId, 1, bytes32(0));
        
        a2a.startStep(pipelineId, 2);
        a2a.completeStep(pipelineId, 2, bytes32(0));
        
        // Check pipeline completed
        assertEq(uint8(a2a.getPipelineStatus(pipelineId)), 3, "Status should be Completed");
        
        // Check platform fee paid
        uint256 expectedFee = amount * FEE_BPS / 10000;
        assertEq(usdc.balanceOf(feeRecipient), expectedFee, "Fee recipient should receive platform fee");
    }
    
    function test_ExecutePipeline_Parallel() public {
        // Create parallel pipeline (stage 1 has 2 agents)
        uint256[] memory agentIds = new uint256[](3);
        address[] memory developers = new address[](3);
        uint256[] memory paymentBps = new uint256[](3);
        uint256[] memory stageIndices = new uint256[](3);
        uint256[] memory maxRetries = new uint256[](3);
        bytes32[] memory conditions = new bytes32[](3);
        
        agentIds[0] = 1; agentIds[1] = 2; agentIds[2] = 3;
        developers[0] = dev1; developers[1] = dev2; developers[2] = dev3;
        paymentBps[0] = 4000; paymentBps[1] = 3000; paymentBps[2] = 3000;
        stageIndices[0] = 0; stageIndices[1] = 1; stageIndices[2] = 1; // Parallel in stage 1
        
        bytes32 pipelineId = a2a.createPipeline(
            agentIds, developers, paymentBps, stageIndices, maxRetries, conditions,
            address(usdc), 0
        );
        
        vm.prank(user);
        a2a.fundPipeline(pipelineId, 100 * 10**6);
        
        // Execute stage 0
        a2a.startStep(pipelineId, 0);
        a2a.completeStep(pipelineId, 0, bytes32(0));
        
        // Execute stage 1 in parallel (both steps 1 and 2)
        a2a.startStep(pipelineId, 1);
        a2a.startStep(pipelineId, 2);
        
        a2a.completeStep(pipelineId, 1, bytes32(0));
        a2a.completeStep(pipelineId, 2, bytes32(0));
        
        // Pipeline should be complete
        assertEq(uint8(a2a.getPipelineStatus(pipelineId)), 3, "Should be Completed");
    }
    
    // ============ Retry Tests ============
    
    function test_RetryFailedStep() public {
        // Create pipeline with retries enabled
        uint256[] memory agentIds = new uint256[](1);
        address[] memory developers = new address[](1);
        uint256[] memory paymentBps = new uint256[](1);
        uint256[] memory stageIndices = new uint256[](1);
        uint256[] memory maxRetries = new uint256[](1);
        bytes32[] memory conditions = new bytes32[](1);
        
        agentIds[0] = 1;
        developers[0] = dev1;
        paymentBps[0] = 10000;
        maxRetries[0] = 3; // Allow 3 retries
        
        bytes32 pipelineId = a2a.createPipeline(
            agentIds, developers, paymentBps, stageIndices, maxRetries, conditions,
            address(usdc), 0
        );
        
        vm.prank(user);
        a2a.fundPipeline(pipelineId, 100 * 10**6);
        
        // Start and fail step
        a2a.startStep(pipelineId, 0);
        a2a.failStep(pipelineId, 0);
        
        // Retry step
        a2a.retryStep(pipelineId, 0);
        
        // Should be pending again
        A2APaymentProtocol.PipelineStep[] memory steps = a2a.getPipelineSteps(pipelineId);
        assertEq(uint8(steps[0].status), 0, "Step should be Pending after retry");
        assertEq(steps[0].retryCount, 1, "Retry count should be 1");
    }
    
    // ============ Cancel Tests ============
    
    function test_CancelPipeline() public {
        // Create pipeline as user (so user can cancel it)
        bytes32 pipelineId = _createPipelineAsUser();
        uint256 amount = 100 * 10**6;
        
        vm.prank(user);
        a2a.fundPipeline(pipelineId, amount);
        
        uint256 userBalanceBefore = usdc.balanceOf(user);
        
        // Cancel (as creator)
        vm.prank(user);
        a2a.cancelPipeline(pipelineId);
        
        // Check refund
        assertEq(usdc.balanceOf(user), userBalanceBefore + amount, "User should be refunded");
        assertEq(uint8(a2a.getPipelineStatus(pipelineId)), 4, "Status should be Cancelled");
    }
    
    // ============ Revert Tests ============
    
    function test_RevertIf_SplitsNot100Percent() public {
        uint256[] memory agentIds = new uint256[](2);
        address[] memory developers = new address[](2);
        uint256[] memory paymentBps = new uint256[](2);
        uint256[] memory stageIndices = new uint256[](2);
        uint256[] memory maxRetries = new uint256[](2);
        bytes32[] memory conditions = new bytes32[](2);
        
        agentIds[0] = 1; agentIds[1] = 2;
        developers[0] = dev1; developers[1] = dev2;
        paymentBps[0] = 5000; paymentBps[1] = 4000; // Only 90%
        
        vm.expectRevert("Splits must equal 100%");
        a2a.createPipeline(
            agentIds, developers, paymentBps, stageIndices, maxRetries, conditions,
            address(usdc), 0
        );
    }
    
    function test_RevertIf_WrongStage() public {
        bytes32 pipelineId = _createSimplePipeline();
        
        vm.prank(user);
        a2a.fundPipeline(pipelineId, 100 * 10**6);
        
        // Try to start step 1 (stage 1) before step 0 (stage 0) is complete
        vm.expectRevert("Wrong stage");
        a2a.startStep(pipelineId, 1);
    }
    
    // ============ Helper Functions ============
    
    function _createSimplePipeline() internal returns (bytes32) {
        uint256[] memory agentIds = new uint256[](3);
        address[] memory developers = new address[](3);
        uint256[] memory paymentBps = new uint256[](3);
        uint256[] memory stageIndices = new uint256[](3);
        uint256[] memory maxRetries = new uint256[](3);
        bytes32[] memory conditions = new bytes32[](3);
        
        agentIds[0] = 1; agentIds[1] = 2; agentIds[2] = 3;
        developers[0] = dev1; developers[1] = dev2; developers[2] = dev3;
        paymentBps[0] = 4000; paymentBps[1] = 3000; paymentBps[2] = 3000;
        stageIndices[0] = 0; stageIndices[1] = 1; stageIndices[2] = 2;
        
        return a2a.createPipeline(
            agentIds, developers, paymentBps, stageIndices, maxRetries, conditions,
            address(usdc), 0
        );
    }
    
    function _createPipelineAsUser() internal returns (bytes32) {
        uint256[] memory agentIds = new uint256[](3);
        address[] memory developers = new address[](3);
        uint256[] memory paymentBps = new uint256[](3);
        uint256[] memory stageIndices = new uint256[](3);
        uint256[] memory maxRetries = new uint256[](3);
        bytes32[] memory conditions = new bytes32[](3);
        
        agentIds[0] = 1; agentIds[1] = 2; agentIds[2] = 3;
        developers[0] = dev1; developers[1] = dev2; developers[2] = dev3;
        paymentBps[0] = 4000; paymentBps[1] = 3000; paymentBps[2] = 3000;
        stageIndices[0] = 0; stageIndices[1] = 1; stageIndices[2] = 2;
        
        vm.prank(user);
        return a2a.createPipeline(
            agentIds, developers, paymentBps, stageIndices, maxRetries, conditions,
            address(usdc), 0
        );
    }
}

