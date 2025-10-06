// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AgentNexusEscrow
 * @notice Manages payment escrow for agent executions
 * @dev Implements secure payment flows with platform fees and multi-token support
 * 
 * This contract serves as the financial backbone of AgentNexus, handling:
 * - Payment deposits into escrow
 * - Payment releases upon successful execution
 * - Payment refunds for failed executions
 * - Platform fee collection
 * - Multi-token payment support (USDC, USDT, DAI, etc.)
 */
contract AgentNexusEscrow is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");
    bytes32 public constant AGENT_DEVELOPER_ROLE = keccak256("AGENT_DEVELOPER_ROLE");

    // Payment status enum
    enum PaymentStatus {
        Pending,
        Escrowed,
        Released,
        Refunded,
        Disputed
    }

    // Payment struct
    struct Payment {
        address user;
        address developer;
        uint256 agentId;
        uint256 amount;
        address token;
        PaymentStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }

    // State variables
    mapping(bytes32 => Payment) public payments;
    mapping(uint256 => address) public agentDevelopers;
    mapping(address => bool) public supportedTokens;
    
    address public platformFeeRecipient;
    uint256 public platformFeePercentage; // Basis points (100 = 1%)
    
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    uint256 public constant PAYMENT_EXPIRY = 7 days;

    // Events
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
    
    event AgentRegistered(uint256 indexed agentId, address indexed developer);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event TokenSupportUpdated(address indexed token, bool supported);

    /**
     * @notice Contract constructor
     * @param _platformFeeRecipient Address to receive platform fees
     * @param _platformFeePercentage Initial platform fee in basis points
     */
    constructor(address _platformFeeRecipient, uint256 _platformFeePercentage) {
        require(_platformFeeRecipient != address(0), "Invalid fee recipient");
        require(_platformFeePercentage <= MAX_PLATFORM_FEE, "Fee too high");
        
        platformFeeRecipient = _platformFeeRecipient;
        platformFeePercentage = _platformFeePercentage;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORCHESTRATOR_ROLE, msg.sender);
    }

    /**
     * @notice Deposit payment into escrow
     * @param paymentId Unique identifier for the payment
     * @param agentId ID of the agent being executed
     * @param amount Payment amount
     * @param token Payment token address
     */
    function depositPayment(
        bytes32 paymentId,
        uint256 agentId,
        uint256 amount,
        address token
    ) external nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(payments[paymentId].user == address(0), "Payment already exists");
        require(agentDevelopers[agentId] != address(0), "Agent not registered");
        require(amount > 0, "Amount must be positive");

        address developer = agentDevelopers[agentId];
        
        // Transfer tokens to escrow
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Create payment record
        payments[paymentId] = Payment({
            user: msg.sender,
            developer: developer,
            agentId: agentId,
            amount: amount,
            token: token,
            status: PaymentStatus.Escrowed,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + PAYMENT_EXPIRY
        });
        
        emit PaymentDeposited(paymentId, msg.sender, developer, agentId, amount, token);
    }

    /**
     * @notice Release payment to developer after successful execution
     * @param paymentId Payment identifier
     */
    function releasePayment(bytes32 paymentId) external onlyRole(ORCHESTRATOR_ROLE) nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Escrowed, "Payment not in escrow");
        require(block.timestamp <= payment.expiresAt, "Payment expired");
        
        payment.status = PaymentStatus.Released;
        
        // Calculate platform fee
        uint256 platformFee = (payment.amount * platformFeePercentage) / 10000;
        uint256 developerAmount = payment.amount - platformFee;
        
        // Transfer to developer and platform
        IERC20(payment.token).safeTransfer(payment.developer, developerAmount);
        if (platformFee > 0) {
            IERC20(payment.token).safeTransfer(platformFeeRecipient, platformFee);
        }
        
        emit PaymentReleased(paymentId, payment.developer, developerAmount, platformFee);
    }

    /**
     * @notice Refund payment to user for failed execution
     * @param paymentId Payment identifier
     */
    function refundPayment(bytes32 paymentId) external onlyRole(ORCHESTRATOR_ROLE) nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Escrowed, "Payment not in escrow");
        
        payment.status = PaymentStatus.Refunded;
        
        // Refund to user
        IERC20(payment.token).safeTransfer(payment.user, payment.amount);
        
        emit PaymentRefunded(paymentId, payment.user, payment.amount);
    }

    /**
     * @notice Register an agent with its developer
     * @param agentId Agent identifier
     * @param developer Developer address
     */
    function registerAgent(
        uint256 agentId,
        address developer
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(developer != address(0), "Invalid developer address");
        agentDevelopers[agentId] = developer;
        emit AgentRegistered(agentId, developer);
    }

    /**
     * @notice Update supported token status
     * @param token Token address
     * @param supported Whether token is supported
     */
    function setSupportedToken(
        address token,
        bool supported
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    /**
     * @notice Update platform fee percentage
     * @param _platformFeePercentage New fee in basis points
     */
    function setPlatformFee(
        uint256 _platformFeePercentage
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_platformFeePercentage <= MAX_PLATFORM_FEE, "Fee too high");
        platformFeePercentage = _platformFeePercentage;
        emit PlatformFeeUpdated(_platformFeePercentage);
    }

    /**
     * @notice Get payment details
     * @param paymentId Payment identifier
     * @return Payment struct
     */
    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }
}

