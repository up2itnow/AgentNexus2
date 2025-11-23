// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AgentNexusEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract AgentNexusEscrowTest is Test {
    AgentNexusEscrow public escrow;
    MockUSDC public usdc;

    address public admin = address(1);
    address public orchestrator = address(1); // Admin is also orchestrator in constructor
    address public developer = address(2);
    address public user = address(3);
    address public treasury = address(4);

    uint256 public platformFee = 500; // 5%
    uint256 public agentId = 1;

    event PaymentDeposited(
        bytes32 indexed paymentId,
        address indexed user,
        address indexed developer,
        uint256 agentId,
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
        vm.startPrank(admin);
        
        // Deploy Mock Token
        usdc = new MockUSDC();
        
        // Deploy Escrow
        escrow = new AgentNexusEscrow(treasury, platformFee);
        
        // Setup: Whitelist Token
        escrow.setSupportedToken(address(usdc), true);
        
        // Setup: Register Agent
        escrow.registerAgent(agentId, developer);
        
        vm.stopPrank();

        // Fund User
        usdc.mint(user, 1000 * 10**18);
    }

    function test_DepositPayment() public {
        uint256 amount = 100 * 10**18;
        bytes32 paymentId = keccak256("payment1");

        vm.startPrank(user);
        usdc.approve(address(escrow), amount);

        vm.expectEmit(true, true, true, true);
        emit PaymentDeposited(paymentId, user, developer, agentId, amount, address(usdc));
        
        escrow.depositPayment(paymentId, agentId, amount, address(usdc));
        vm.stopPrank();

        AgentNexusEscrow.Payment memory payment = escrow.getPayment(paymentId);
        assertEq(payment.user, user);
        assertEq(payment.amount, amount);
        assertEq(uint(payment.status), uint(AgentNexusEscrow.PaymentStatus.Escrowed));
    }

    function test_ReleasePayment() public {
        uint256 amount = 100 * 10**18;
        bytes32 paymentId = keccak256("payment1");

        // 1. Deposit
        vm.startPrank(user);
        usdc.approve(address(escrow), amount);
        escrow.depositPayment(paymentId, agentId, amount, address(usdc));
        vm.stopPrank();

        // 2. Release
        vm.startPrank(orchestrator);
        
        uint256 expectedFee = (amount * platformFee) / 10000;
        uint256 expectedDevAmount = amount - expectedFee;

        vm.expectEmit(true, true, true, true);
        emit PaymentReleased(paymentId, developer, expectedDevAmount, expectedFee);
        
        escrow.releasePayment(paymentId);
        vm.stopPrank();

        // 3. Verify Balances
        assertEq(usdc.balanceOf(developer), expectedDevAmount);
        assertEq(usdc.balanceOf(treasury), expectedFee);
        
        AgentNexusEscrow.Payment memory payment = escrow.getPayment(paymentId);
        assertEq(uint(payment.status), uint(AgentNexusEscrow.PaymentStatus.Released));
    }

    function test_RefundPayment() public {
        uint256 amount = 100 * 10**18;
        bytes32 paymentId = keccak256("payment1");

        // 1. Deposit
        vm.startPrank(user);
        usdc.approve(address(escrow), amount);
        escrow.depositPayment(paymentId, agentId, amount, address(usdc));
        uint256 initialBalance = usdc.balanceOf(user);
        vm.stopPrank();

        // 2. Refund
        vm.startPrank(orchestrator);
        
        vm.expectEmit(true, true, true, true);
        emit PaymentRefunded(paymentId, user, amount);
        
        escrow.refundPayment(paymentId);
        vm.stopPrank();

        // 3. Verify Balances
        assertEq(usdc.balanceOf(user), initialBalance + amount);
        
        AgentNexusEscrow.Payment memory payment = escrow.getPayment(paymentId);
        assertEq(uint(payment.status), uint(AgentNexusEscrow.PaymentStatus.Refunded));
    }

    function test_RevertIf_TokenNotSupported() public {
        MockUSDC badToken = new MockUSDC();
        bytes32 paymentId = keccak256("badToken");
        
        vm.startPrank(user);
        vm.expectRevert("Token not supported");
        escrow.depositPayment(paymentId, agentId, 100, address(badToken));
        vm.stopPrank();
    }

    function test_RevertIf_AgentNotRegistered() public {
        bytes32 paymentId = keccak256("badAgent");
        uint256 badAgentId = 999;
        
        vm.startPrank(user);
        vm.expectRevert("Agent not registered");
        escrow.depositPayment(paymentId, badAgentId, 100, address(usdc));
        vm.stopPrank();
    }

    function test_RevertIf_PaymentExists() public {
        uint256 amount = 100 * 10**18;
        bytes32 paymentId = keccak256("payment1");

        vm.startPrank(user);
        usdc.approve(address(escrow), amount * 2);
        escrow.depositPayment(paymentId, agentId, amount, address(usdc));
        
        vm.expectRevert("Payment already exists");
        escrow.depositPayment(paymentId, agentId, amount, address(usdc));
        vm.stopPrank();
    }
}
