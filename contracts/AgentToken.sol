// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentToken
 * @dev ERC-20 Token representing ownership/governance of an Agent.
 * Mintable/Burnable only by the Factory (Bonding Curve).
 */
contract AgentToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, address factory) ERC20(name, symbol) Ownable(factory) {}

    /**
     * @dev Mint tokens. Only callable by the Factory.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens. Only callable by the Factory.
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
