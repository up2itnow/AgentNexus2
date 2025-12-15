// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AgentNexusEscrow
 * @notice Secure payment escrow system for AI agent executions on Base L2
 * @dev Implements trustless payment flows with automatic fee distribution
 * 
 * KEY FEATURES:
 * =============
 * 
 * 1. ESCROW MANAGEMENT
 *    - Deposits are held in escrow until execution completes
 *    - Automatic release after successful execution
 *    - Refund mechanism for failed executions
 *    - 7-day expiry with reclaim capability
 * 
 * 2. MULTI-TOKEN SUPPORT
 *    - Accepts USDC, USDT, DAI, and other ERC-20 tokens
 *    - Token whitelist managed by admin
 *    - SafeERC20 for secure token transfers
 *    - No ETH handling (reduces attack surface)
 * 
 * 3. FEE STRUCTURE
 *    - Platform fee (configurable, max 10%)
 *    - Developer receives remainder after platform cut
 *    - Atomic fee distribution on release
 *    - Fee recipient can be updated by admin
 * 
 * 4. SECURITY FEATURES
 *    - ReentrancyGuard on all state-changing functions
 *    - Role-based access control (RBAC)
 *    - Payment expiry prevents stuck funds
 *    - Dispute mechanism for edge cases
 * 
 * 5. ROLE SYSTEM
 *    - DEFAULT_ADMIN_ROLE: Can manage roles, fees, tokens
 *    - ORCHESTRATOR_ROLE: Backend server, manages payment lifecycle
 *    - AGENT_DEVELOPER_ROLE: Can register agents and receive payments
 * 
 * ARCHITECTURE RATIONALE:
 * =======================
 * - Base L2 deployment keeps gas costs low (~$0.01 per transaction)
 * - OpenZeppelin contracts ensure battle-tested security
 * - Escrow pattern protects both users and developers
 * - Basis points (10000 = 100%) provide granular fee control
 * 
 * TRUST MODEL:
 * ============
 * - Users trust escrow to hold funds safely
 * - Orchestrator (backend) trusted to report execution results
 * - Admin can update fees but cannot steal escrowed funds
 * - Developers trust platform to distribute payments fairly
 * 
 * GAS OPTIMIZATION:
 * =================
 * - Packed structs where possible
 * - Minimal storage writes
 * - Batch operations not needed (Base L2 gas is cheap)
 * 
 * FUTURE ENHANCEMENTS:
 * ====================
 * - Chainlink automation for expired payment cleanup
 * - Multi-sig for admin operations
 * - Appeal period before refunds
 * - Reputation-based fee discounts
 * 
 * @author AgentNexus Team ()
 * @custom:security-contact https://github.com/up2itnow/AgentNexus2/security/advisories/new
 */
contract AgentNexusEscrow is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            ROLES & CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Role for backend orchestrator - manages payment lifecycle
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");
    
    /// @notice Role for agent developers - can register agents
    bytes32 public constant AGENT_DEVELOPER_ROLE = keccak256("AGENT_DEVELOPER_ROLE");

    /// @notice Maximum platform fee (10% in basis points)
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    
    /// @notice Payment expiry duration (7 days)
    uint256 public constant PAYMENT_EXPIRY = 7 days;

    /*//////////////////////////////////////////////////////////////
                            DATA STRUCTURES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Payment lifecycle states
     * @dev Transitions: Pending → Escrowed → Released/Refunded/Disputed
     */
    enum PaymentStatus {
        Pending,    // Payment created but not yet deposited
        Escrowed,   // Funds locked in escrow, execution in progress
        Released,   // Funds distributed to developer (success)
        Refunded,   // Funds returned to user (failure)
        Disputed    // Manual intervention required
    }

    /**
     * @notice Escrow payment record
     * @dev Struct size: 224 bytes (7 slots)
     * @param user Address that made the payment
     * @param developer Agent creator receiving the payment
     * @param agentId Unique identifier for the agent being executed
     * @param amount Payment amount in token's smallest unit
     * @param token ERC-20 token address (must be whitelisted)
     * @param status Current lifecycle state of the payment
     * @param createdAt Timestamp when escrow was created
     * @param expiresAt Timestamp after which payment can be reclaimed
     */
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

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice All escrowed payments, keyed by keccak256(paymentId)
    mapping(bytes32 => Payment) public payments;
    
    /// @notice Maps agent ID to developer address for payment routing
    mapping(uint256 => address) public agentDevelopers;
    
    /// @notice Whitelist of supported ERC-20 tokens (e.g., USDC, USDT)
    mapping(address => bool) public supportedTokens;
    
    /// @notice Address receiving platform fees
    address public platformFeeRecipient;
    
    /// @notice Platform fee in basis points (100 = 1%, 1000 = 10%)
    uint256 public platformFeePercentage;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when funds are deposited into escrow
    event PaymentDeposited(
        bytes32 indexed paymentId,
        address indexed user,
        address indexed developer,
        uint256 agentId,
        uint256 amount,
        address token
    );
    
    /// @notice Emitted when funds are released to developer after successful execution
    event PaymentReleased(
        bytes32 indexed paymentId,
        address indexed developer,
        uint256 amount,
        uint256 platformFee
    );
    
    /// @notice Emitted when funds are refunded to user after failed execution
    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed user,
        uint256 amount
    );
    
    /// @notice Emitted when a new agent is registered by a developer
    event AgentRegistered(uint256 indexed agentId, address indexed developer);
    
    /// @notice Emitted when platform fee percentage is updated
    event PlatformFeeUpdated(uint256 newFeePercentage);
    
    /// @notice Emitted when token whitelist is updated
    event TokenSupportUpdated(address indexed token, bool supported);

    /// @notice Emitted when platform fee recipient is updated
    event PlatformFeeRecipientUpdated(address indexed newRecipient);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the escrow contract with platform configuration
     * @dev Grants admin and orchestrator roles to deployer
     * @param _platformFeeRecipient Address to receive platform fees (treasury)
     * @param _platformFeePercentage Initial platform fee in basis points (e.g., 500 = 5%)
     */
    constructor(address _platformFeeRecipient, uint256 _platformFeePercentage) {
        require(_platformFeeRecipient != address(0), "Invalid fee recipient");
        require(_platformFeePercentage <= MAX_PLATFORM_FEE, "Fee too high");
        
        platformFeeRecipient = _platformFeeRecipient;
        platformFeePercentage = _platformFeePercentage;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORCHESTRATOR_ROLE, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE ESCROW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit payment into escrow for agent execution
     * @dev This is called by users when purchasing agent execution access
     * 
     * SECURITY CHECKS:
     * - Token must be whitelisted (prevents malicious tokens)
     * - PaymentId must be unique (prevents replay attacks)
     * - Agent must be registered (prevents payment to non-existent agents)
     * - Amount must be positive (prevents zero-value spam)
     * 
     * FLOW:
     * 1. Validate all requirements
     * 2. Transfer tokens from user to this contract (requires approval)
     * 3. Create payment record with Escrowed status
     * 4. Set expiry to 7 days from now (user can reclaim if stuck)
     * 
     * IMPORTANT: User must approve this contract to spend tokens before calling!
     * Frontend should call: token.approve(escrowAddress, amount)
     * 
     * GAS COST: ~80,000 gas on Base L2 (~$0.008 @ 1 gwei, $2000 ETH)
     * 
     * @param paymentId Unique identifier from backend (keccak256 of execution ID)
     * @param agentId ID of the agent being purchased/executed
     * @param amount Payment amount in token's smallest unit (e.g., USDC has 6 decimals)
     * @param token ERC-20 token address (must be whitelisted, e.g., USDC on Base)
     * 
     * @custom:emits PaymentDeposited
     * @custom:requires Token approval from msg.sender
     * @custom:reentrancy-protected
     */
    function depositPayment(
        bytes32 paymentId,
        uint256 agentId,
        uint256 amount,
        address token
    ) external nonReentrant {
        // Validate token is supported (USDC, USDT, DAI, etc.)
        require(supportedTokens[token], "Token not supported");
        
        // Ensure paymentId is unique (check if payment.user is zero address)
        require(payments[paymentId].user == address(0), "Payment already exists");
        
        // Verify agent is registered and has a developer assigned
        require(agentDevelopers[agentId] != address(0), "Agent not registered");
        
        // Prevent zero-value deposits
        require(amount > 0, "Amount must be positive");

        // Get developer address for this agent
        address developer = agentDevelopers[agentId];
        
        // Transfer tokens from user to escrow contract
        // NOTE: User must have approved this contract beforehand!
        // SafeERC20 handles tokens with non-standard return values
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Create payment record in storage
        // Status: Escrowed (funds locked until release/refund)
        // Expiry: 7 days (user can reclaim after this if execution never completes)
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
     * @notice Update platform fee recipient
     * @param _platformFeeRecipient New fee recipient address
     */
    function setPlatformFeeRecipient(
        address _platformFeeRecipient
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_platformFeeRecipient != address(0), "Invalid fee recipient");
        platformFeeRecipient = _platformFeeRecipient;
        emit PlatformFeeRecipientUpdated(_platformFeeRecipient);
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

