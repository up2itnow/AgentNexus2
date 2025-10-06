// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AgentNexusEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title AgentNexusEscrowTest
 * @notice Comprehensive tests for AgentNexusEscrow contract
 * @dev Tests all functionality including edge cases and security
 */
contract AgentNexusEscrowTest is Test {
    AgentNexusEscrow public escrow;
    MockERC20 public usdc;
    MockERC20 public usdt;
    
    address public platformFeeRecipient = address(0x1);
    address public user = address(0x2);
    address public developer = address(0x3);
    address public orchestrator = address(0x4);
    
    uint256 public constant AGENT_ID = 1;
    uint256 public constant PAYMENT_AMOUNT = 100 * 10**6; // 100 USDC/USDT
    
    event PaymentDeposited(
        bytes32 indexed paymentId,
        address indexed user,
        uint256 indexed agentId,
        uint256 amount,
        address token
    );
    
    event PaymentReleased(
        bytes32 indexed paymentId,
        address indexed developer,
        uint256 amount,
        uint256 platformFee
    );
    
    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed user,
        uint256 amount
    );

    function setUp() public {
        // Deploy contracts
        escrow = new AgentNexusEscrow(platformFeeRecipient, 250); // 2.5% fee
        usdc = new MockERC20("USD Coin", "USDC");
        usdt = new MockERC20("Tether USD", "USDT");
        
        // Setup roles
        escrow.grantRole(escrow.ORCHESTRATOR_ROLE(), orchestrator);
        
        // Register agent
        escrow.registerAgent(AGENT_ID, developer);
        
        // Setup tokens
        escrow.setSupportedToken(address(usdc), true);
        escrow.setSupportedToken(address(usdt), true);
        
        // Fund user
        usdc.mint(user, PAYMENT_AMOUNT * 10);
        usdt.mint(user, PAYMENT_AMOUNT * 10);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function testDepositPayment() public {
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, block.timestamp));
        
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        
        escrow.depositPayment(paymentId, AGENT_ID, PAYMENT_AMOUNT, address(usdc));
        vm.stopPrank();
        
        // Verify payment stored correctly
        (
            address paymentUser,
            address paymentDeveloper,
            uint256 paymentAgentId,
            uint256 paymentAmount,
            address paymentToken,
            ,
            ,
            
        ) = escrow.payments(paymentId);
        
        assertEq(paymentUser, user);
        assertEq(paymentDeveloper, developer);
        assertEq(paymentAgentId, AGENT_ID);
        assertEq(paymentAmount, PAYMENT_AMOUNT);
        assertEq(paymentToken, address(usdc));
        
        // Verify escrow received tokens
        assertEq(usdc.balanceOf(address(escrow)), PAYMENT_AMOUNT);
    }

    function testDepositPaymentRevertsIfTokenNotSupported() public {
        MockERC20 unsupportedToken = new MockERC20("Bad Token", "BAD");
        unsupportedToken.mint(user, PAYMENT_AMOUNT);
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, block.timestamp));
        
        vm.startPrank(user);
        unsupportedToken.approve(address(escrow), PAYMENT_AMOUNT);
        
        vm.expectRevert("Token not supported");
        escrow.depositPayment(paymentId, AGENT_ID, PAYMENT_AMOUNT, address(unsupportedToken));
        vm.stopPrank();
    }

    function testDepositPaymentRevertsIfAgentNotRegistered() public {
        uint256 unregisteredAgentId = 999;
        bytes32 paymentId = keccak256(abi.encodePacked(user, unregisteredAgentId, block.timestamp));
        
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        
        vm.expectRevert("Agent not registered");
        escrow.depositPayment(paymentId, unregisteredAgentId, PAYMENT_AMOUNT, address(usdc));
        vm.stopPrank();
    }

    function testDepositPaymentRevertsIfAmountZero() public {
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, block.timestamp));
        
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        
        vm.expectRevert("Amount must be positive");
        escrow.depositPayment(paymentId, AGENT_ID, 0, address(usdc));
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            RELEASE TESTS
    //////////////////////////////////////////////////////////////*/

    function testReleasePayment() public {
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, block.timestamp));
        
        // Deposit payment
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        escrow.depositPayment(paymentId, AGENT_ID, PAYMENT_AMOUNT, address(usdc));
        vm.stopPrank();
        
        uint256 initialDeveloperBalance = usdc.balanceOf(developer);
        uint256 initialPlatformBalance = usdc.balanceOf(platformFeeRecipient);
        
        // Release payment
        vm.prank(orchestrator);
        escrow.releasePayment(paymentId);
        
        // Calculate expected amounts (2.5% platform fee)
        uint256 platformFee = (PAYMENT_AMOUNT * 250) / 10000;
        uint256 developerAmount = PAYMENT_AMOUNT - platformFee;
        
        // Verify balances
        assertEq(usdc.balanceOf(developer), initialDeveloperBalance + developerAmount);
        assertEq(usdc.balanceOf(platformFeeRecipient), initialPlatformBalance + platformFee);
    }

    function testReleasePaymentRevertsIfNotOrchestrator() public {
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, block.timestamp));
        
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        escrow.depositPayment(paymentId, AGENT_ID, PAYMENT_AMOUNT, address(usdc));
        vm.stopPrank();
        
        vm.prank(user);
        vm.expectRevert();
        escrow.releasePayment(paymentId);
    }

    function testReleasePaymentWorksBeforeExpiration() public {
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, block.timestamp));
        
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        escrow.depositPayment(paymentId, AGENT_ID, PAYMENT_AMOUNT, address(usdc));
        vm.stopPrank();
        
        // Release before expiration
        vm.prank(orchestrator);
        escrow.releasePayment(paymentId);
        
        // Verify payment was released
        (,,,,,AgentNexusEscrow.PaymentStatus status,,) = escrow.payments(paymentId);
        assertTrue(status == AgentNexusEscrow.PaymentStatus.Released);
    }

    /*//////////////////////////////////////////////////////////////
                            REFUND TESTS
    //////////////////////////////////////////////////////////////*/

    function testRefundPayment() public {
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, block.timestamp));
        
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        escrow.depositPayment(paymentId, AGENT_ID, PAYMENT_AMOUNT, address(usdc));
        vm.stopPrank();
        
        uint256 initialUserBalance = usdc.balanceOf(user);
        
        vm.prank(orchestrator);
        escrow.refundPayment(paymentId);
        
        assertEq(usdc.balanceOf(user), initialUserBalance + PAYMENT_AMOUNT);
    }

    // Note: Expired payments are automatically refunded via backend monitoring
    // The contract doesn't have a public expirePayment function

    /*//////////////////////////////////////////////////////////////
                            ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetPlatformFee() public {
        escrow.setPlatformFee(500); // 5%
        // Verify by checking in next payment
    }

    function testSetPlatformFeeRevertsIfTooHigh() public {
        vm.expectRevert("Fee too high");
        escrow.setPlatformFee(1001); // > 10%
    }

    function testRegisterAgent() public {
        uint256 newAgentId = 2;
        address newDeveloper = address(0x5);
        
        escrow.registerAgent(newAgentId, newDeveloper);
        
        assertEq(escrow.agentDevelopers(newAgentId), newDeveloper);
    }

    function testSetSupportedToken() public {
        MockERC20 newToken = new MockERC20("New Token", "NEW");
        
        escrow.setSupportedToken(address(newToken), true);
        assertTrue(escrow.supportedTokens(address(newToken)));
        
        escrow.setSupportedToken(address(newToken), false);
        assertFalse(escrow.supportedTokens(address(newToken)));
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzDepositAmount(uint96 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount < 1000000 * 10**6); // Reasonable limit
        
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, amount));
        usdc.mint(user, amount);
        
        vm.startPrank(user);
        usdc.approve(address(escrow), amount);
        escrow.depositPayment(paymentId, AGENT_ID, amount, address(usdc));
        vm.stopPrank();
        
        (,,, uint256 paymentAmount,,,,) = escrow.payments(paymentId);
        assertEq(paymentAmount, amount);
    }

    function testFuzzPlatformFee(uint16 feeBps) public {
        vm.assume(feeBps <= 1000); // Max 10%
        
        bytes32 paymentId = keccak256(abi.encodePacked(user, AGENT_ID, feeBps));
        escrow.setPlatformFee(feeBps);
        
        vm.startPrank(user);
        usdc.approve(address(escrow), PAYMENT_AMOUNT);
        escrow.depositPayment(paymentId, AGENT_ID, PAYMENT_AMOUNT, address(usdc));
        vm.stopPrank();
        
        uint256 expectedPlatformFee = (PAYMENT_AMOUNT * feeBps) / 10000;
        uint256 expectedDeveloperAmount = PAYMENT_AMOUNT - expectedPlatformFee;
        
        uint256 initialDeveloperBalance = usdc.balanceOf(developer);
        uint256 initialPlatformBalance = usdc.balanceOf(platformFeeRecipient);
        
        vm.prank(orchestrator);
        escrow.releasePayment(paymentId);
        
        assertEq(usdc.balanceOf(developer), initialDeveloperBalance + expectedDeveloperAmount);
        assertEq(usdc.balanceOf(platformFeeRecipient), initialPlatformBalance + expectedPlatformFee);
    }
}

