// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AgentNexusCctpReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**6); // 6 decimals
    }
    
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}

contract AgentNexusCctpReceiverTest is Test {
    AgentNexusCctpReceiver public receiver;
    MockUSDC public usdc;
    
    address public admin = address(1);
    address public relayer = address(2);
    address public beneficiary = address(3);
    address public unauthorized = address(4);
    
    bytes32 public constant CCTP_RELAYER_ROLE = keccak256("CCTP_RELAYER_ROLE");
    
    event CreditApplied(
        bytes32 indexed referenceId,
        address indexed beneficiary,
        uint256 amount,
        address token
    );

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.prank(admin);
        receiver = new AgentNexusCctpReceiver(address(usdc), admin);
        
        // Grant relayer role
        vm.prank(admin);
        receiver.grantRole(CCTP_RELAYER_ROLE, relayer);
    }

    function test_CreditFromCctp_HappyPath() public {
        uint256 amount = 100 * 10**6;
        bytes32 refId = keccak256("ref1");
        
        vm.prank(relayer);
        vm.expectEmit(true, true, true, true);
        emit CreditApplied(refId, beneficiary, amount, address(usdc));
        
        receiver.creditFromCctp(refId, beneficiary, amount);
        
        // Check state
        assertEq(receiver.credits(beneficiary), amount);
        assertTrue(receiver.processedReferences(refId));
    }
    
    function test_RevertIf_DuplicateReference() public {
        uint256 amount = 100 * 10**6;
        bytes32 refId = keccak256("ref1");
        
        vm.startPrank(relayer);
        receiver.creditFromCctp(refId, beneficiary, amount);
        
        vm.expectRevert("ReferenceId already used");
        receiver.creditFromCctp(refId, beneficiary, amount);
        vm.stopPrank();
    }
    
    function test_RevertIf_Unauthorized() public {
        uint256 amount = 100 * 10**6;
        bytes32 refId = keccak256("ref1");
        
        vm.prank(unauthorized);
        vm.expectRevert(); // AccessControl error
        receiver.creditFromCctp(refId, beneficiary, amount);
    }
    
    function test_RevertIf_ZeroAmount() public {
        bytes32 refId = keccak256("ref1");
        
        vm.prank(relayer);
        vm.expectRevert("Amount must be greater than 0");
        receiver.creditFromCctp(refId, beneficiary, 0);
    }
    
    function test_RevertIf_InvalidBeneficiary() public {
        uint256 amount = 100 * 10**6;
        bytes32 refId = keccak256("ref1");
        
        vm.prank(relayer);
        vm.expectRevert("Invalid beneficiary");
        receiver.creditFromCctp(refId, address(0), amount);
    }
    
    function test_InitialState() public {
        assertTrue(receiver.hasRole(CCTP_RELAYER_ROLE, relayer));
        assertTrue(receiver.hasRole(receiver.DEFAULT_ADMIN_ROLE(), admin));
        assertEq(address(receiver.usdc()), address(usdc));
    }
}
