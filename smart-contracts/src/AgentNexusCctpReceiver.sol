// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentNexusCctpReceiver
 * @notice Receives USDC via Circle CCTP and applies credits to agent accounts.
 * @dev Non-custodial: Funds are minted directly to this contract, then credited.
 *      Credits are effectively a prepaid balance for agent services.
 *      
 *      Security:
 *      - `creditFromCctp` allows a Relayer to crypto-economically accept 
 *        the CCTP mint and credit the user.
 *      - To prevent spoofing (crediting without minting), this function 
 *        should be restricted to authorized relayers or validated against 
 *        actual balance increases if atomicity is possible.
 *
 *      For this implementation, we use an AccessControl role CCTP_RELAYER_ROLE.
 *      While the protocol aims for permissionless-ness, the decoupling
 *      of CCTP minting (permissionless) and metadata-based crediting
 *      requires a trusted oracle/relayer to bridge the metadata gap.
 */
contract AgentNexusCctpReceiver is AccessControl, ReentrancyGuard {
    
    bytes32 public constant CCTP_RELAYER_ROLE = keccak256("CCTP_RELAYER_ROLE");
    
    // The official USDC contract on this chain (e.g. Base)
    IERC20 public immutable usdc;

    // Mapping of used reference IDs to prevent replay/double-credit
    mapping(bytes32 => bool) public processedReferences;

    // Simple ledger for credits: beneficiary => amount
    mapping(address => uint256) public credits;

    event CreditApplied(
        bytes32 indexed referenceId,
        address indexed beneficiary,
        uint256 amount,
        address token
    );

    constructor(address _usdc, address _admin) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_admin != address(0), "Invalid Admin address");
        
        usdc = IERC20(_usdc);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CCTP_RELAYER_ROLE, _admin);
    }

    /**
     * @notice Apply credit for a CCTP transfer.
     * @dev Called by an authorized Relayer after CCTP mint is confirmed.
     * @param referenceId Unique identifier for the payment (deterministic).
     * @param beneficiary Address to receive the credit.
     * @param amount Amount of USDC credited.
     */
    function creditFromCctp(
        bytes32 referenceId,
        address beneficiary,
        uint256 amount
    ) external onlyRole(CCTP_RELAYER_ROLE) nonReentrant {
        require(!processedReferences[referenceId], "ReferenceId already used");
        require(amount > 0, "Amount must be greater than 0");
        require(beneficiary != address(0), "Invalid beneficiary");

        // Mark reference as used to prevent replays
        processedReferences[referenceId] = true;

        // Apply credit to the ledger
        credits[beneficiary] += amount;

        emit CreditApplied(referenceId, beneficiary, amount, address(usdc));
    }

    /**
     * @notice Check if a reference ID has been processed.
     */
    function isReferenceProcessed(bytes32 referenceId) external view returns (bool) {
        return processedReferences[referenceId];
    }
}
