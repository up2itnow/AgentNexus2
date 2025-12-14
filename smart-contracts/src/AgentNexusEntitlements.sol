// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AgentNexusEntitlements
 * @notice ERC-1155 token contract for agent access entitlements
 * @dev Manages access rights to AI agents via NFT tokens
 * 
 * Each agent gets a unique token ID representing access rights.
 * Users who own these tokens can execute the corresponding agent.
 * Supports batch operations, metadata URIs, and expiration.
 * 
 * @author AgentNexus Team ()
 */
contract AgentNexusEntitlements is ERC1155, AccessControl, ReentrancyGuard {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant URI_MANAGER_ROLE = keccak256("URI_MANAGER_ROLE");

    /// @notice Mapping from token ID to agent ID
    mapping(uint256 => uint256) public tokenIdToAgentId;
    
    /// @notice Mapping from agent ID to token ID (reverse lookup)
    mapping(uint256 => uint256) public agentIdToTokenId;
    
    /// @notice Mapping from token ID to metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    /// @notice Mapping from token ID to whether transfers are allowed
    mapping(uint256 => bool) public transferrable;
    
    /// @notice Mapping from token ID to expiration timestamp (0 = no expiration)
    mapping(uint256 => uint256) public expirations;
    
    /// @notice Counter for generating unique token IDs
    uint256 private _nextTokenId = 1;
    
    /// @notice Base URI for token metadata
    string private _baseURI;

    /// @notice Emitted when a new agent entitlement is created
    event EntitlementCreated(
        uint256 indexed tokenId,
        uint256 indexed agentId,
        bool transferrable,
        uint256 expiration
    );

    /// @notice Emitted when an entitlement is minted to a user
    event EntitlementMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );

    /// @notice Emitted when an entitlement is burned
    event EntitlementBurned(
        address indexed from,
        uint256 indexed tokenId,
        uint256 amount
    );

    /// @notice Emitted when token URI is updated
    event TokenURIUpdated(uint256 indexed tokenId, string uri);

    /// @notice Emitted when base URI is updated
    event BaseURIUpdated(string newBaseURI);

    /**
     * @notice Contract constructor
     * @param baseURI_ Base URI for token metadata
     */
    constructor(string memory baseURI_) ERC1155(baseURI_) {
        _baseURI = baseURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(URI_MANAGER_ROLE, msg.sender);
    }

    /**
     * @notice Create a new entitlement type for an agent
     * @param agentId The ID of the agent in the backend system
     * @param uri_ Metadata URI for this entitlement
     * @param transferrable_ Whether tokens can be transferred
     * @param expiration Expiration timestamp (0 for no expiration)
     * @return tokenId The newly created token ID
     */
    function createEntitlement(
        uint256 agentId,
        string memory uri_,
        bool transferrable_,
        uint256 expiration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        require(agentIdToTokenId[agentId] == 0, "Agent entitlement already exists");
        
        uint256 tokenId = _nextTokenId++;
        
        tokenIdToAgentId[tokenId] = agentId;
        agentIdToTokenId[agentId] = tokenId;
        _tokenURIs[tokenId] = uri_;
        transferrable[tokenId] = transferrable_;
        expirations[tokenId] = expiration;
        
        emit EntitlementCreated(tokenId, agentId, transferrable_, expiration);
        
        return tokenId;
    }

    /**
     * @notice Mint entitlement tokens to a user
     * @param to Address to mint tokens to
     * @param tokenId Token ID to mint
     * @param amount Amount of tokens to mint
     * @param data Additional data for hooks
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenIdToAgentId[tokenId] != 0, "Token ID does not exist");
        
        _mint(to, tokenId, amount, data);
        
        emit EntitlementMinted(to, tokenId, amount);
    }

    /**
     * @notice Batch mint entitlement tokens
     * @param to Address to mint tokens to
     * @param tokenIds Array of token IDs to mint
     * @param amounts Array of amounts to mint
     * @param data Additional data for hooks
     */
    function mintBatch(
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenIds.length == amounts.length, "Array length mismatch");
        
        // Validate all token IDs exist
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenIdToAgentId[tokenIds[i]] != 0, "Token ID does not exist");
        }
        
        _mintBatch(to, tokenIds, amounts, data);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit EntitlementMinted(to, tokenIds[i], amounts[i]);
        }
    }

    /**
     * @notice Burn entitlement tokens
     * @param from Address to burn tokens from
     * @param tokenId Token ID to burn
     * @param amount Amount of tokens to burn
     */
    function burn(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external onlyRole(BURNER_ROLE) nonReentrant {
        require(from != address(0), "Cannot burn from zero address");
        
        _burn(from, tokenId, amount);
        
        emit EntitlementBurned(from, tokenId, amount);
    }

    /**
     * @notice Batch burn entitlement tokens
     * @param from Address to burn tokens from
     * @param tokenIds Array of token IDs to burn
     * @param amounts Array of amounts to burn
     */
    function burnBatch(
        address from,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyRole(BURNER_ROLE) nonReentrant {
        require(from != address(0), "Cannot burn from zero address");
        
        _burnBatch(from, tokenIds, amounts);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit EntitlementBurned(from, tokenIds[i], amounts[i]);
        }
    }

    /**
     * @notice Check if a user has access to an agent
     * @param user Address of the user
     * @param agentId ID of the agent
     * @return hasAccess Whether the user has access
     */
    function hasAccess(address user, uint256 agentId) external view returns (bool) {
        uint256 tokenId = agentIdToTokenId[agentId];
        if (tokenId == 0) return false;
        
        // Check if user has tokens
        if (balanceOf(user, tokenId) == 0) return false;
        
        // Check expiration
        uint256 expiration = expirations[tokenId];
        if (expiration != 0 && block.timestamp > expiration) return false;
        
        return true;
    }

    /**
     * @notice Check if multiple users have access to an agent
     * @param users Array of user addresses
     * @param agentId ID of the agent
     * @return accessList Array of booleans indicating access
     */
    function hasAccessBatch(
        address[] memory users,
        uint256 agentId
    ) external view returns (bool[] memory) {
        bool[] memory accessList = new bool[](users.length);
        uint256 tokenId = agentIdToTokenId[agentId];
        
        if (tokenId == 0) return accessList;
        
        uint256 expiration = expirations[tokenId];
        bool expired = expiration != 0 && block.timestamp > expiration;
        
        for (uint256 i = 0; i < users.length; i++) {
            accessList[i] = !expired && balanceOf(users[i], tokenId) > 0;
        }
        
        return accessList;
    }

    /**
     * @notice Get token URI for a token ID
     * @param tokenId Token ID to query
     * @return Token metadata URI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenIdToAgentId[tokenId] != 0, "Token ID does not exist");
        
        string memory tokenURI = _tokenURIs[tokenId];
        
        // If token has specific URI, return it
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        
        // Otherwise, return base URI + token ID
        return string(abi.encodePacked(_baseURI, tokenId.toString()));
    }

    /**
     * @notice Set token URI for a specific token
     * @param tokenId Token ID to set URI for
     * @param uri_ New metadata URI
     */
    function setTokenURI(
        uint256 tokenId,
        string memory uri_
    ) external onlyRole(URI_MANAGER_ROLE) {
        require(tokenIdToAgentId[tokenId] != 0, "Token ID does not exist");
        
        _tokenURIs[tokenId] = uri_;
        
        emit TokenURIUpdated(tokenId, uri_);
        emit URI(uri_, tokenId);
    }

    /**
     * @notice Set base URI for all tokens
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyRole(URI_MANAGER_ROLE) {
        _baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Get the base URI
     * @return Base URI string
     */
    function baseURI() external view returns (string memory) {
        return _baseURI;
    }

    /**
     * @notice Get agent ID for a token ID
     * @param tokenId Token ID to query
     * @return agentId The corresponding agent ID
     */
    function getAgentId(uint256 tokenId) external view returns (uint256) {
        return tokenIdToAgentId[tokenId];
    }

    /**
     * @notice Get token ID for an agent ID
     * @param agentId Agent ID to query
     * @return tokenId The corresponding token ID
     */
    function getTokenId(uint256 agentId) external view returns (uint256) {
        return agentIdToTokenId[agentId];
    }

    /**
     * @notice Check if a token is expired
     * @param tokenId Token ID to check
     * @return expired Whether the token is expired
     */
    function isExpired(uint256 tokenId) external view returns (bool) {
        uint256 expiration = expirations[tokenId];
        return expiration != 0 && block.timestamp > expiration;
    }

    /**
     * @notice Override _update to enforce transfer restrictions
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            // Check if all tokens are transferrable
            for (uint256 i = 0; i < ids.length; i++) {
                require(transferrable[ids[i]], "Token is not transferrable");
            }
        }
        
        super._update(from, to, ids, values);
    }

    /**
     * @notice Required override for AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

