// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

/**
 * @title AgentAccount
 * @dev ERC-6551 Token Bound Account for AgentNexus Agents
 * Allows agents to hold assets and execute transactions.
 */
contract AgentAccount is IERC1271 {
    address public immutable tokenContract;
    uint256 public immutable tokenId;
    uint256 public nonce;

    event TransactionExecuted(address indexed target, uint256 value, bytes data);

    constructor(address _tokenContract, uint256 _tokenId) {
        tokenContract = _tokenContract;
        tokenId = _tokenId;
    }

    receive() external payable {}

    /**
     * @dev Execute a transaction (call) from this account.
     * Only the owner of the Agent NFT can call this.
     */
    function execute(address to, uint256 value, bytes calldata data) external payable returns (bytes memory) {
        require(_isValidSigner(msg.sender), "Not authorized");
        
        ++nonce;
        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Transaction failed");

        emit TransactionExecuted(to, value, data);
        return result;
    }

    /**
     * @dev Check if the caller is the owner of the Agent NFT.
     */
    function _isValidSigner(address signer) internal view returns (bool) {
        return IERC721(tokenContract).ownerOf(tokenId) == signer;
    }

    /**
     * @dev ERC-1271 Standard Signature Validation
     */
    function isValidSignature(bytes32 hash, bytes memory signature) external view override returns (bytes4) {
        address owner = IERC721(tokenContract).ownerOf(tokenId);
        if (SignatureChecker.isValidSignatureNow(owner, hash, signature)) {
            return IERC1271.isValidSignature.selector;
        }
        return 0xffffffff;
    }
    /**
     * @dev Execute a transaction on a remote chain (Simulated LayerZero/CCIP).
     * @param targetChainId The ID of the destination chain.
     * @param targetAddress The address to call on the remote chain.
     * @param payload The encoded function call.
     */
    function executeRemote(
        uint256 targetChainId,
        address targetAddress,
        bytes calldata payload
    ) external payable returns (bytes32) {
        require(_isValidSigner(msg.sender), "Not authorized");
        
        emit TransactionExecuted(targetAddress, 0, payload); // Reusing event for now
        
        // Return a mock message ID
        return keccak256(abi.encodePacked(block.timestamp, targetChainId, targetAddress, payload));
    }

    /**
     * @dev Receive a cross-chain message (Simulated).
     * Only callable by the CrossChain Endpoint.
     */
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external {
        // Verify caller is LZ Endpoint
        // require(msg.sender == lzEndpoint);
        
        // Decode and execute
        (address target, uint256 value, bytes memory data) = abi.decode(_payload, (address, uint256, bytes));
        
        (bool success, ) = target.call{value: value}(data);
        require(success, "Remote execution failed");
    }
}
