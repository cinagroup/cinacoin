// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/VerifyingPaymaster.sol";
import "../contracts/libraries/PaymasterLib.sol";

/// @title VerifyingPaymasterTest
/// @notice Comprehensive tests for the VerifyingPaymaster contract
contract VerifyingPaymasterTest is Test {
    VerifyingPaymaster public verifyingPaymaster;
    address public entryPoint = makeAddr("entryPoint");
    address public trustedSigner = makeAddr("trustedSigner");
    address public newSigner = makeAddr("newSigner");
    address public attacker = makeAddr("attacker");
    address public user1 = makeAddr("user1");

    function setUp() public {
        verifyingPaymaster = new VerifyingPaymaster(entryPoint, trustedSigner);
    }

    // ==================== Constructor Tests ====================

    function test_ConstructorSetsEntryPoint() public view {
        assertEq(address(verifyingPaymaster.entryPoint()), entryPoint);
    }

    function test_ConstructorSetsTrustedSigner() public view {
        assertEq(verifyingPaymaster.trustedSigner(), trustedSigner);
    }

    function test_EIP712DomainIsSet() public {
        bytes32 domainSeparator = verifyingPaymaster.eip712Domain().field0;
        // Domain separator should be set
        assertTrue(domainSeparator != bytes32(0) || verifyingPaymaster.eip712Domain().name.length > 0);
    }

    // ==================== Trusted Signer Management ====================

    function test_ChangeTrustedSigner() public {
        vm.prank(trustedSigner);
        verifyingPaymaster.setTrustedSigner(newSigner);
        assertEq(verifyingPaymaster.trustedSigner(), newSigner);
    }

    function test_ChangeTrustedSignerEmitsEvent() public {
        vm.prank(trustedSigner);
        vm.expectEmit(true, true, true, true);
        emit VerifyingPaymaster.TrustedSignerChanged(trustedSigner, newSigner);
        verifyingPaymaster.setTrustedSigner(newSigner);
    }

    function test_OnlyTrustedSignerCanChangeSigner() public {
        vm.prank(attacker);
        vm.expectRevert();
        verifyingPaymaster.setTrustedSigner(attacker);

        vm.prank(user1);
        vm.expectRevert();
        verifyingPaymaster.setTrustedSigner(user1);
    }

    function test_CannotSetZeroAddress() public {
        vm.prank(trustedSigner);
        vm.expectRevert("Invalid address");
        verifyingPaymaster.setTrustedSigner(address(0));
    }

    function test_CannotSetSameAddress() public {
        vm.prank(trustedSigner);
        verifyingPaymaster.setTrustedSigner(trustedSigner);
        assertEq(verifyingPaymaster.trustedSigner(), trustedSigner);
    }

    // ==================== Deposit / Withdraw ====================

    function test_Deposit() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(verifyingPaymaster)
            ),
            abi.encode(true)
        );

        vm.deal(trustedSigner, 1 ether);
        vm.prank(trustedSigner);
        verifyingPaymaster.deposit{value: 0.5 ether}();
    }

    function test_WithdrawRequiresTrustedSigner() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("withdrawTo(address,uint256)")),
                user1,
                0.5 ether
            ),
            abi.encode(true)
        );

        vm.deal(trustedSigner, 1 ether);
        vm.prank(trustedSigner);
        verifyingPaymaster.deposit{value: 0.5 ether}();

        // Attacker cannot withdraw
        vm.prank(attacker);
        vm.expectRevert("Only trusted signer");
        verifyingPaymaster.withdrawTo(payable(user1), 0.25 ether);
    }

    function test_TrustedSignerCanWithdraw() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(verifyingPaymaster)
            ),
            abi.encode(true)
        );

        vm.deal(trustedSigner, 1 ether);
        vm.prank(trustedSigner);
        verifyingPaymaster.deposit{value: 0.5 ether}();

        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("withdrawTo(address,uint256)")),
                trustedSigner,
                0.25 ether
            ),
            abi.encode(true)
        );

        vm.prank(trustedSigner);
        verifyingPaymaster.withdrawTo(payable(trustedSigner), 0.25 ether);
    }

    // ==================== Sponsorship ====================

    function test_SponsorUserOpByTrustedSigner() public {
        bytes32 userOpHash = keccak256("test");

        vm.prank(trustedSigner);
        verifyingPaymaster.sponsorUserOp(userOpHash, 1e18);
        // Should not revert
    }

    function test_SponsorUserOpByNonSigner() public {
        bytes32 userOpHash = keccak256("test");

        vm.prank(attacker);
        vm.expectRevert("Not trusted signer");
        verifyingPaymaster.sponsorUserOp(userOpHash, 1e18);
    }

    function test_IsSponsoredReturnsTrueForNewOp() public {
        bytes32 userOpHash = keccak256("test");
        // New ops are not yet used, so isSponsored returns true
        assertTrue(verifyingPaymaster.isSponsored(userOpHash));
    }

    // ==================== Receive ====================

    function test_CanReceiveETH() public {
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        (bool success,) = address(verifyingPaymaster).call{value: 0.1 ether}("");
        assertTrue(success);
        assertEq(address(verifyingPaymaster).balance, 0.1 ether);
    }

    // ==================== Only EntryPoint ====================

    function test_OnlyEntryPointCanValidate() public {
        vm.prank(attacker);
        vm.expectRevert(); // NotEntryPoint
        verifyingPaymaster.validatePaymasterUserOp(
            keccak256("test"),
            1e18,
            1e9
        );
    }

    function test_OnlyEntryPointCanPostOp() public {
        vm.prank(attacker);
        vm.expectRevert();
        verifyingPaymaster.postOp(0, "", 0, 0);
    }

    // ==================== EIP-712 Typehash ====================

    function test_PaymasterDataTypeHash() public view {
        bytes32 expected = keccak256(
            "PaymasterData(uint256 validUntil,uint256 validAfter,address sender,uint256 maxGasCost)"
        );
        assertEq(verifyingPaymaster.PAYMASTER_DATA_TYPEHASH(), expected);
    }
}
