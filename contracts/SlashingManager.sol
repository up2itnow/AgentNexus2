// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SlashingManager
 * @dev Manages staking and slashing for Execution Nodes.
 * Nodes must stake tokens to be eligible for work.
 * Malicious behavior results in stake slashing.
 */
contract SlashingManager is Ownable {
    IERC20 public stakingToken;
    uint256 public minStakeAmount;

    struct NodeStake {
        uint256 amount;
        uint256 timestamp;
        bool isJailed;
    }

    mapping(address => NodeStake) public stakes;

    event Staked(address indexed node, uint256 amount);
    event Unstaked(address indexed node, uint256 amount);
    event Slashed(address indexed node, uint256 amount, string reason);
    event Jailed(address indexed node);
    event Unjailed(address indexed node);

    constructor(address _stakingToken, uint256 _minStakeAmount) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        minStakeAmount = _minStakeAmount;
    }

    /**
     * @dev Stake tokens to become an active node.
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;

        if (stakes[msg.sender].isJailed && stakes[msg.sender].amount >= minStakeAmount) {
            stakes[msg.sender].isJailed = false;
            emit Unjailed(msg.sender);
        }

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake tokens.
     * In a real system, there would be a withdrawal delay (unbonding period).
     */
    function unstake(uint256 amount) external {
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        require(!stakes[msg.sender].isJailed, "Node is jailed");

        stakes[msg.sender].amount -= amount;
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Slash a node for malicious behavior.
     * Only callable by the owner (or a fraud proof contract in the future).
     */
    function slash(address node, uint256 amount, string calldata reason) external onlyOwner {
        require(stakes[node].amount >= amount, "Insufficient stake to slash");

        stakes[node].amount -= amount;
        stakes[node].isJailed = true;
        
        // Burn or send to treasury (here we just keep it in contract for simplicity)
        // In production: stakingToken.transfer(treasury, amount);

        emit Slashed(node, amount, reason);
        emit Jailed(node);
    }

    /**
     * @dev Check if a node is eligible to work.
     */
    function isEligible(address node) external view returns (bool) {
        return stakes[node].amount >= minStakeAmount && !stakes[node].isJailed;
    }
}
