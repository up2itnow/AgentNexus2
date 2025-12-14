// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "./AgentToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentFactory
 * @dev Manages Initial Agent Offerings (IAO) via a Bonding Curve.
 * Users buy/sell Agent Tokens against a reserve of ETH (or base asset).
 */
contract AgentFactory is Ownable {
    event AgentTokenCreated(address indexed tokenAddress, string name, string symbol, address indexed creator);
    event Trade(address indexed token, address indexed user, bool isBuy, uint256 amount, uint256 price);

    mapping(address => address) public agentTokens; // Agent NFT ID -> Token Address (Mock mapping for now)
    address[] public allTokens;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new Agent Token.
     */
    function createAgentToken(string memory name, string memory symbol) external returns (address) {
        AgentToken newToken = new AgentToken(name, symbol, address(this));
        allTokens.push(address(newToken));
        
        emit AgentTokenCreated(address(newToken), name, symbol, msg.sender);
        return address(newToken);
    }

    /**
     * @dev Buy Agent Tokens (Bonding Curve).
     * Simple Linear Curve: Price = Supply
     */
    function buy(address tokenAddress, uint256 amount) external payable {
        AgentToken token = AgentToken(tokenAddress);
        uint256 supply = token.totalSupply();
        
        // Calculate price (Mock logic: 0.0001 ETH per token + slippage)
        // In production: Use a real curve formula (e.g., y = mx^2)
        uint256 price = amount * 0.0001 ether; 
        
        require(msg.value >= price, "Insufficient ETH sent");

        token.mint(msg.sender, amount);
        emit Trade(tokenAddress, msg.sender, true, amount, price);
        
        // Refund excess ETH
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    /**
     * @dev Sell Agent Tokens.
     */
    function sell(address tokenAddress, uint256 amount) external {
        AgentToken token = AgentToken(tokenAddress);
        
        // Calculate refund
        uint256 price = amount * 0.0001 ether; // Simplified linear price
        require(address(this).balance >= price, "Insufficient liquidity");

        token.burn(msg.sender, amount);
        payable(msg.sender).transfer(price);
        
        emit Trade(tokenAddress, msg.sender, false, amount, price);
    }
}
