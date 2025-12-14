// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentNexusAccount
 * @dev ERC-4337 compatible smart account implementation
 * @notice This contract serves as a smart wallet that can be controlled by an external owner
 */
contract AgentNexusAccount is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public immutable entryPoint;
    address public immutable factory;

    // ERC-4337 UserOperation nonce tracking
    uint256 public nonce;

    struct SessionConfig {
        uint256 limit;      // Max ETH value per transaction
        uint256 expiry;     // Timestamp when key expires
        bool isActive;
    }

    mapping(address => SessionConfig) public sessionKeys;

    event AccountExecuted(
        address indexed target,
        uint256 value,
        bytes data,
        bytes result
    );

    event SignatureValidated(bytes32 userOpHash, address signer);

    /**
     * @dev Constructor sets the entry point and initial owner
     * @param _entryPoint Address of the ERC-4337 EntryPoint contract
     * @param _owner Address that will own this account
     */
    constructor(address _entryPoint, address _owner) Ownable(_owner) {
        require(_entryPoint != address(0), "Invalid entry point");
        require(_owner != address(0), "Invalid owner");

        entryPoint = _entryPoint;
        factory = msg.sender;
        nonce = 0;
    }

    /**
     * @dev Adds a session key with specific permissions
     * @param key Address of the session key
     * @param limit Max ETH value per transaction
     * @param expiry Timestamp when key expires
     */
    function addSessionKey(address key, uint256 limit, uint256 expiry) external onlyOwner {
        sessionKeys[key] = SessionConfig(limit, expiry, true);
    }

    /**
     * @dev Revokes a session key
     * @param key Address of the session key
     */
    function revokeSessionKey(address key) external onlyOwner {
        delete sessionKeys[key];
    }

    function _checkAuthorization(uint256 value) internal view {
        if (msg.sender != owner()) {
            SessionConfig memory config = sessionKeys[msg.sender];
            require(config.isActive, "Not authorized");
            require(block.timestamp < config.expiry, "Session expired");
            require(value <= config.limit, "Limit exceeded");
        }
    }

    /**
     * @dev Validates user operation signature (ERC-4337 requirement)
     * @param userOp UserOperation struct
     * @param userOpHash Hash of the user operation
     * @param missingAccountFunds Amount of funds needed for the operation
     * @return validationData Packed validation data (authorizer, validUntil, validAfter)
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        // Only the EntryPoint can call this function
        require(msg.sender == entryPoint, "Only EntryPoint can validate");

        // Validate the signature
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);

        if (recovered == owner()) {
            emit SignatureValidated(userOpHash, recovered);
            return 0; // Valid signature, no time restrictions
        } else {
            return 1; // Invalid signature
        }
    }

    /**
     * @dev Executes a transaction from this account
     * @param target Address to call
     * @param value ETH value to send
     * @param data Calldata for the call
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external nonReentrant returns (bytes memory result) {
        _checkAuthorization(value);
        require(target != address(0), "Invalid target");

        // Execute the call
        (bool success, bytes memory returndata) = target.call{value: value}(data);

        if (!success) {
            // If the call failed, revert with the error message
            if (returndata.length > 0) {
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("Transaction execution failed");
            }
        }

        emit AccountExecuted(target, value, data, returndata);
        return returndata;
    }

    /**
     * @dev Executes multiple transactions in a batch
     * @param targets Array of target addresses
     * @param values Array of ETH values to send
     * @param datas Array of calldata for each call
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external nonReentrant returns (bytes[] memory results) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < values.length; i++) {
            totalValue += values[i];
        }
        _checkAuthorization(totalValue);
        require(targets.length == values.length && targets.length == datas.length, "Array length mismatch");
        require(targets.length > 0, "Empty batch");

        results = new bytes[](targets.length);

        for (uint256 i = 0; i < targets.length; i++) {
            require(targets[i] != address(0), "Invalid target");

            (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(datas[i]);

            if (!success) {
                // If any call fails, revert the entire batch
                if (returndata.length > 0) {
                    assembly {
                        let returndata_size := mload(returndata)
                        revert(add(32, returndata), returndata_size)
                    }
                } else {
                    revert("Batch execution failed");
                }
            }

            results[i] = returndata;
            emit AccountExecuted(targets[i], values[i], datas[i], returndata);
        }
    }

    /**
     * @dev Returns the current nonce for user operations
     * @return Current nonce value
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    /**
     * @dev Increments the nonce (called by EntryPoint after successful user operation)
     */
    function incrementNonce() external {
        require(msg.sender == entryPoint, "Only EntryPoint can increment nonce");
        nonce++;
    }

    /**
     * @dev Allows the account to receive ETH
     */
    receive() external payable {}

    /**
     * @dev Fallback function for the account
     */
    fallback() external payable {
        // Allow the account to receive arbitrary calls
        // This enables compatibility with various DeFi protocols
    }

    /**
     * @dev Withdraws ETH from this account (only owner)
     * @param to Address to withdraw to
     * @param amount Amount to withdraw
     */
    function withdrawETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "ETH withdrawal failed");
    }

    /**
     * @dev Returns the EntryPoint address for this account
     * @return Address of the EntryPoint contract
     */
    function getEntryPoint() external view returns (address) {
        return entryPoint;
    }

    /**
     * @dev Returns information about this account
     * @return owner_ Current owner of the account
     * @return entryPoint_ EntryPoint contract address
     * @return nonce_ Current nonce value
     */
    function getAccountInfo() external view returns (
        address owner_,
        address entryPoint_,
        uint256 nonce_
    ) {
        return (owner(), entryPoint, nonce);
    }
}

/**
 * @dev UserOperation struct as defined in ERC-4337
 * This is a simplified version for compatibility
 */
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}
