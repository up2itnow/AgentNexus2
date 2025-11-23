// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AgentNexusEntitlements.sol";

contract AgentNexusEntitlementsTest is Test {
    AgentNexusEntitlements public entitlements;

    address public admin = address(1);
    address public minter = address(2);
    address public user = address(3);
    address public otherUser = address(4);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    function setUp() public {
        vm.startPrank(admin);
        entitlements = new AgentNexusEntitlements("https://api.agentnexus.xyz/metadata/");
        entitlements.grantRole(MINTER_ROLE, minter);
        vm.stopPrank();
    }

    function test_CreateEntitlement() public {
        vm.startPrank(admin);
        uint256 agentId = 1;
        uint256 tokenId = entitlements.createEntitlement(agentId, "uri_1", true, 0);
        
        assertEq(tokenId, 1);
        assertEq(entitlements.getAgentId(tokenId), agentId);
        assertEq(entitlements.getTokenId(agentId), tokenId);
        vm.stopPrank();
    }

    function test_MintEntitlement() public {
        // 1. Create Entitlement
        vm.startPrank(admin);
        uint256 tokenId = entitlements.createEntitlement(1, "uri_1", true, 0);
        vm.stopPrank();

        // 2. Mint
        vm.startPrank(minter);
        entitlements.mint(user, tokenId, 1, "");
        vm.stopPrank();

        assertEq(entitlements.balanceOf(user, tokenId), 1);
        assertTrue(entitlements.hasAccess(user, 1));
    }

    function test_AccessExpiration() public {
        // 1. Create Expiring Entitlement (1 hour)
        vm.startPrank(admin);
        uint256 expiration = block.timestamp + 1 hours;
        uint256 tokenId = entitlements.createEntitlement(1, "uri_1", true, expiration);
        vm.stopPrank();

        // 2. Mint
        vm.startPrank(minter);
        entitlements.mint(user, tokenId, 1, "");
        vm.stopPrank();

        // 3. Check Access (Before Expiry)
        assertTrue(entitlements.hasAccess(user, 1));

        // 4. Warp Time
        vm.warp(block.timestamp + 2 hours);

        // 5. Check Access (After Expiry)
        assertFalse(entitlements.hasAccess(user, 1));
        assertTrue(entitlements.isExpired(tokenId));
    }

    function test_NonTransferrable() public {
        // 1. Create Non-Transferrable Entitlement
        vm.startPrank(admin);
        uint256 tokenId = entitlements.createEntitlement(1, "uri_1", false, 0);
        vm.stopPrank();

        // 2. Mint
        vm.startPrank(minter);
        entitlements.mint(user, tokenId, 1, "");
        vm.stopPrank();

        // 3. Try Transfer
        vm.startPrank(user);
        vm.expectRevert("Token is not transferrable");
        entitlements.safeTransferFrom(user, otherUser, tokenId, 1, "");
        vm.stopPrank();
    }

    function test_BatchAccess() public {
        vm.startPrank(admin);
        uint256 tokenId = entitlements.createEntitlement(1, "uri_1", true, 0);
        vm.stopPrank();

        vm.startPrank(minter);
        entitlements.mint(user, tokenId, 1, "");
        vm.stopPrank();

        address[] memory users = new address[](2);
        users[0] = user;
        users[1] = otherUser;

        bool[] memory access = entitlements.hasAccessBatch(users, 1);
        assertTrue(access[0]);
        assertFalse(access[1]);
    }
}
