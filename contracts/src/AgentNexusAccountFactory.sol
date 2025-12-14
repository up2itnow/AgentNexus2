// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentNexusAccount.sol";

/**
 * @title AgentNexusAccountFactory
 * @dev Factory contract for creating deterministic AgentNexus smart accounts
 * @notice This contract creates ERC-4337 compatible smart accounts for users
 */
contract AgentNexusAccountFactory is Ownable {
    address public immutable entryPoint;

    mapping(bytes32 => address) public accounts;
    mapping(address => bytes32) public accountSalts;

    event AccountCreated(
        address indexed account,
        bytes32 indexed salt,
        address indexed owner
    );

    /**
     * @dev Constructor sets the entry point
     * @param _entryPoint Address of the ERC-4337 EntryPoint contract
     */
    constructor(address _entryPoint) Ownable(msg.sender) {
        require(_entryPoint != address(0), "Invalid entry point");

        entryPoint = _entryPoint;
    }

    /**
     * @dev Creates a new account for the given owner with deterministic address
     * @param owner Address that will own the account
     * @param salt Salt for CREATE2 deployment
     * @return account Address of the created account
     */
    function createAccount(
        address owner,
        bytes32 salt
    ) external returns (address account) {
        bytes32 accountSalt = keccak256(abi.encodePacked(owner, salt));

        // Check if account already exists
        account = accounts[accountSalt];
        if (account != address(0)) {
            return account;
        }

        // Deploy new account using CREATE2 for deterministic addresses
        bytes memory bytecode = abi.encodePacked(
            type(AgentNexusAccount).creationCode,
            abi.encode(entryPoint, owner)
        );

        account = Create2.deploy(0, accountSalt, bytecode);

        // Store account information
        accounts[accountSalt] = account;
        accountSalts[account] = accountSalt;

        emit AccountCreated(account, accountSalt, owner);
    }

    /**
     * @dev Returns the address of an account that would be created with given owner and salt
     * @param owner Address that will own the account
     * @param salt Salt for CREATE2 deployment
     * @return account Address of the account (if it doesn't exist, this is where it would be deployed)
     */
    function getAccountAddress(
        address owner,
        bytes32 salt
    ) external view returns (address) {
        bytes32 accountSalt = keccak256(abi.encodePacked(owner, salt));
        return accounts[accountSalt];
    }



    /**
     * @dev Returns the salt used to create a given account
     * @param account Address of the account
     * @return salt Salt used for CREATE2 deployment
     */
    function getAccountSalt(address account) external view returns (bytes32) {
        return accountSalts[account];
    }

    /**
     * @dev Withdraws any ETH accidentally sent to this contract (only owner)
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }
}
